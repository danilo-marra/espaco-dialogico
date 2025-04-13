import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import terapeuta from "models/terapeuta.js";
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

// Aplicar middleware de autenticação para proteger as rotas
router.use(authMiddleware);

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  // Log para debug
  if (process.env.NODE_ENV === "development") {
    console.log("Received body:", req.body);
  }

  // Configurar formidable para análise de formulários multipart
  const form = formidable({
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  // Parsing com a API atual
  const [fields, files] = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve([fields, files]);
    });
  });

  // Preparar objeto terapeuta
  const terapeutaData = {
    nome: getFormValue(fields.nome),
    telefone: getFormValue(fields.telefone),
    email: getFormValue(fields.email),
    endereco: getFormValue(fields.endereco),
    dt_entrada: getFormValue(fields.dt_entrada),
    chave_pix: getFormValue(fields.chave_pix),
  };

  // Validação básica
  const requiredFields = [
    "nome",
    "telefone",
    "email",
    "endereco",
    "dt_entrada",
    "chave_pix",
  ];

  for (const field of requiredFields) {
    if (!terapeutaData[field]) {
      return res.status(400).json({
        error: `O campo "${field}" é obrigatório`,
      });
    }
  }

  // Upload da foto para o Cloudinary, se existir
  if (files.foto && Array.isArray(files.foto) && files.foto.length > 0) {
    try {
      const fotoUrl = await uploadToCloudinary(files.foto[0]); // Acessando o primeiro elemento do array
      terapeutaData.foto = fotoUrl;
    } catch (error) {
      console.error("Erro ao fazer upload para o Cloudinary:", error);
      // Continua sem a foto se falhar o upload
    }
  }

  // Criar terapeuta no banco de dados
  console.log("Criando terapeuta com dados:", terapeutaData);
  const newTerapeuta = await terapeuta.create(terapeutaData);

  console.log("Fields:", fields);
  console.log("Files:", files);

  return res.status(201).json(newTerapeuta);
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
