import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import terapeuta from "models/terapeuta.js";
import user from "models/user.js";
import { formidable } from "formidable";
import { uploadToCloudinary } from "utils/cloudinary-config";
import authMiddleware from "utils/authMiddleware.js";

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

// Aplicar middleware de autenticação
router.use(authMiddleware);

router.get(getHandler);
router.put(putHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "User ID é obrigatório" });
    }

    // Verificar se o usuário logado é o mesmo que está consultando
    // Converter ambos para string para comparação
    if (req.user.id.toString() !== userId.toString()) {
      return res.status(403).json({
        error: "Acesso negado. Você só pode consultar seus próprios dados.",
      });
    }

    // Buscar terapeuta pelo user_id
    let terapeutaData = await terapeuta.getByUserId(userId);

    if (!terapeutaData) {
      // Se não encontrar terapeuta, buscar dados do usuário para pré-preencher
      try {
        const userData = await user.findById(userId);

        // Retornar estrutura com dados do usuário para pré-preenchimento
        return res.status(200).json({
          id: null,
          nome: userData.username || "",
          email: userData.email || "",
          telefone: "",
          endereco: "",
          dt_entrada: "",
          chave_pix: "",
          foto: null,
          user_id: userId,
          isNew: true, // Flag para indicar que é um novo registro
        });
      } catch (userError) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
    }

    // Se encontrou o terapeuta, verificar se é "novo" (campos obrigatórios não preenchidos)
    const isNew =
      !terapeutaData.telefone ||
      !terapeutaData.dt_entrada ||
      !terapeutaData.chave_pix ||
      terapeutaData.telefone === "(não informado)";

    // Adicionar a flag isNew ao objeto de retorno
    terapeutaData.isNew = isNew;

    return res.status(200).json(terapeutaData);
  } catch (error) {
    console.error("Erro ao buscar terapeuta por user_id:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

async function putHandler(request, response) {
  const { userId } = request.query;

  try {
    // Verificar se o usuário logado é o mesmo que está sendo atualizado
    if (request.user.id !== userId) {
      return response.status(403).json({
        error: "Acesso negado. Você só pode atualizar seus próprios dados.",
      });
    }

    // Buscar terapeuta existente pelo user_id
    let existingTerapeuta = await terapeuta.getByUserId(userId);

    // Configurar formidable para análise de formulários multipart
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    // Parsing com a API atual
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(request, (err, fields, files) => {
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

    // Validação básica
    const validationErrors = [];

    if (!terapeutaData.nome || !terapeutaData.nome.trim()) {
      validationErrors.push("Nome é obrigatório");
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

    if (!terapeutaData.chave_pix || !terapeutaData.chave_pix.trim()) {
      validationErrors.push("Chave PIX é obrigatória");
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
      return response.status(400).json({
        error: "Dados inválidos",
        message: validationErrors.join(", "),
        details: validationErrors,
      });
    }

    // Limpar dados
    terapeutaData.nome = terapeutaData.nome.trim();
    terapeutaData.telefone = terapeutaData.telefone.trim();
    terapeutaData.email = terapeutaData.email.trim().toLowerCase();
    terapeutaData.crp = terapeutaData.crp?.trim() || "";
    terapeutaData.chave_pix = terapeutaData.chave_pix?.trim() || "";

    // Upload da foto para o Cloudinary, se existir
    if (files.foto && Array.isArray(files.foto) && files.foto.length > 0) {
      try {
        const fotoUrl = await uploadToCloudinary(files.foto[0]);
        terapeutaData.foto = fotoUrl;
        console.log("Upload da foto realizado com sucesso:", fotoUrl);
      } catch (error) {
        console.error("Erro ao fazer upload da foto para o Cloudinary:", error);
        // Continua sem a foto se falhar o upload
      }
    }

    // Upload do currículo PDF para o Cloudinary, se existir
    if (
      files.curriculo_arquivo &&
      Array.isArray(files.curriculo_arquivo) &&
      files.curriculo_arquivo.length > 0
    ) {
      try {
        const curriculoUrl = await uploadToCloudinary(
          files.curriculo_arquivo[0],
        );
        terapeutaData.curriculo_arquivo = curriculoUrl;
        console.log(
          "Upload do arquivo de currículo realizado com sucesso:",
          curriculoUrl,
        );
      } catch (error) {
        console.error(
          "Erro ao fazer upload do currículo para o Cloudinary:",
          error,
        );
        return response.status(500).json({
          error: "Erro ao fazer upload do currículo",
          message:
            "Não foi possível fazer upload do arquivo de currículo. Tente novamente.",
        });
      }
    }

    let result;

    if (existingTerapeuta) {
      // Atualizar terapeuta existente
      result = await terapeuta.update(existingTerapeuta.id, terapeutaData);
    } else {
      // Criar novo registro de terapeuta
      terapeutaData.user_id = userId;
      result = await terapeuta.create(terapeutaData);
    }

    return response.status(200).json(result);
  } catch (error) {
    console.error("Erro ao atualizar dados do terapeuta:", error);

    // Tratamento específico de erros
    if (error.name === "ValidationError") {
      return response.status(400).json({
        name: error.name,
        message: error.message,
        action: error.action || "Verifique os dados e tente novamente.",
        status_code: 400,
      });
    }

    if (error.name === "NotFoundError") {
      return response.status(404).json({
        name: error.name,
        message: error.message,
        action: error.action || "Verifique o ID e tente novamente.",
        status_code: 404,
      });
    }

    return response.status(500).json({
      error: "Erro interno do servidor",
      message: "Erro ao atualizar dados do terapeuta. Tente novamente.",
    });
  }
}
