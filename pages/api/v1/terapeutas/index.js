import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import terapeuta from "models/terapeuta.js";
import { formidable } from "formidable";
import { uploadToCloudinary } from "utils/cloudinary-config";
import { requirePermission } from "utils/roleMiddleware.js";

// Configuração para desativar o bodyParser padrão do Next.js para uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

function getFormValue(field) {
  return Array.isArray(field) ? field[0] : field;
}

const router = createRouter();

// Aplicar middleware de autenticação e autorização para proteger as rotas
router.use(requirePermission("terapeutas"));

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  try {
    // Configurar formidable para análise de formulários multipart
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    // Parsing com a API atual
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("Erro no parsing do form:", err);
          reject(err);
        }
        resolve([fields, files]);
      });
    });

    // Preparar objeto terapeuta
    const terapeutaData = {
      nome: getFormValue(fields.nome),
      telefone: getFormValue(fields.telefone),
      email: getFormValue(fields.email),
      crp: getFormValue(fields.crp),
      dt_nascimento: getFormValue(fields.dt_nascimento),
      dt_entrada: getFormValue(fields.dt_entrada),
      chave_pix: getFormValue(fields.chave_pix),
    };

    // Validação detalhada
    const validationErrors = [];

    if (!terapeutaData.nome || !terapeutaData.nome.trim()) {
      validationErrors.push("Nome do terapeuta é obrigatório");
    }

    if (!terapeutaData.telefone || !terapeutaData.telefone.trim()) {
      validationErrors.push("Telefone é obrigatório");
    }

    if (!terapeutaData.email || !terapeutaData.email.trim()) {
      validationErrors.push("Email é obrigatório");
    }

    if (!terapeutaData.dt_entrada) {
      validationErrors.push("Data de entrada é obrigatória");
    }

    // Validação de formato de email
    if (terapeutaData.email && terapeutaData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(terapeutaData.email.trim())) {
        validationErrors.push("Formato de email inválido");
      }
    }

    // Retornar erros de validação se existirem
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Dados inválidos",
        message: validationErrors.join(", "),
        details: validationErrors,
      });
    }

    // Limpar dados
    terapeutaData.nome = terapeutaData.nome.trim();
    terapeutaData.telefone = terapeutaData.telefone.trim();
    terapeutaData.email = terapeutaData.email.trim().toLowerCase();
    terapeutaData.crp = terapeutaData.crp?.trim() || null;
    terapeutaData.dt_nascimento = terapeutaData.dt_nascimento || null;
    terapeutaData.chave_pix = terapeutaData.chave_pix?.trim() || "";

    // Upload da foto para o Cloudinary, se existir
    if (files.foto && Array.isArray(files.foto) && files.foto.length > 0) {
      try {
        const fotoUrl = await uploadToCloudinary(files.foto[0]);
        terapeutaData.foto = fotoUrl;
      } catch (error) {
        console.error("Erro ao fazer upload para o Cloudinary:", error);
        // Continua sem a foto se falhar o upload
      }
    }

    // Upload do arquivo PDF do currículo para o Cloudinary, se existir
    if (
      files.curriculo_arquivo &&
      Array.isArray(files.curriculo_arquivo) &&
      files.curriculo_arquivo.length > 0
    ) {
      try {
        const curriculoArquivoUrl = await uploadToCloudinary(
          files.curriculo_arquivo[0],
        );
        terapeutaData.curriculo_arquivo = curriculoArquivoUrl;
      } catch (error) {
        console.error(
          "Erro ao fazer upload do currículo para o Cloudinary:",
          error,
        );
        // Continua sem o arquivo se falhar o upload
      }
    }

    // Criar terapeuta no banco de dados
    const newTerapeuta = await terapeuta.create(terapeutaData);

    return res.status(201).json(newTerapeuta);
  } catch (error) {
    console.error("Erro no postHandler:", error);

    // Tratamento específico de erros
    if (error.name === "ValidationError") {
      return res.status(400).json({
        name: error.name,
        message: error.message,
        action: error.action || "Verifique os dados e tente novamente.",
        status_code: 400,
      });
    }

    if (
      error.message &&
      error.message.includes("email") &&
      error.message.includes("já")
    ) {
      return res.status(400).json({
        name: "ValidationError",
        message: "Este email já está sendo utilizado por outro terapeuta.",
        action: "Use um email diferente.",
        status_code: 400,
      });
    }

    return res.status(500).json({
      error: "Erro interno do servidor",
      message: "Erro ao criar terapeuta. Tente novamente.",
    });
  }
}

async function getHandler(request, response) {
  try {
    const terapeutas = await terapeuta.getAll();
    return response.status(200).json(terapeutas);
  } catch (error) {
    console.error("Erro ao buscar terapeutas:", error);
    return response.status(500).json({ error: "Erro ao buscar terapeutas" });
  }
}
