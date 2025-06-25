import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import terapeuta from "models/terapeuta.js";
import { formidable } from "formidable";
import { uploadToCloudinary } from "utils/cloudinary-config";

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

router.get(getHandler);
router.put(putHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const id = request.query.id;

  try {
    const terapeutaFound = await terapeuta.getById(id);

    if (!terapeutaFound) {
      return response.status(404).json({ error: "Terapeuta não encontrado" });
    }

    return response.status(200).json(terapeutaFound);
  } catch (error) {
    console.error("Erro ao buscar terapeuta:", error);
    return response.status(500).json({ error: "Erro ao buscar terapeuta" });
  }
}

async function putHandler(request, response) {
  const id = request.query.id;

  // Configurar formidable para análise de formulários multipart
  const form = formidable({
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  // Parsing com a API atual
  const [fields, files] = await new Promise((resolve, reject) => {
    form.parse(request, (err, fields, files) => {
      if (err) reject(err);
      resolve([fields, files]);
    });
  });

  // Verificar se o terapeuta existe
  const terapeutaExists = await terapeuta.getById(id);
  if (!terapeutaExists) {
    return response.status(404).json({ error: "Terapeuta não encontrado" });
  }

  // Preparar objeto terapeuta para atualização
  const terapeutaData = {
    nome: getFormValue(fields.nome),
    telefone: getFormValue(fields.telefone),
    email: getFormValue(fields.email),
    endereco: getFormValue(fields.endereco),
    dt_entrada: getFormValue(fields.dt_entrada),
    chave_pix: getFormValue(fields.chave_pix),
  };

  // Incluir user_id se foi fornecido (para associação de usuários)
  if (fields.user_id) {
    terapeutaData.user_id = getFormValue(fields.user_id);
  }

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

  try {
    // Atualizar terapeuta no banco de dados
    const updatedTerapeuta = await terapeuta.update(id, terapeutaData);
    return response.status(200).json(updatedTerapeuta);
  } catch (error) {
    console.error("Erro ao atualizar terapeuta:", error);

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
      name: "InternalServerError",
      message: "Erro interno do servidor",
      action: "Tente novamente ou entre em contato com o suporte.",
      status_code: 500,
    });
  }
}

async function deleteHandler(request, response) {
  const id = request.query.id;

  try {
    // Verificar se o terapeuta existe
    const terapeutaExists = await terapeuta.getById(id);
    if (!terapeutaExists) {
      return response.status(404).json({ error: "Terapeuta não encontrado" });
    }

    // Deletar terapeuta
    await terapeuta.remove(id);
    return response.status(204).send(); // 204 No Content - resposta bem-sucedida sem conteúdo
  } catch (error) {
    console.error("Erro ao deletar terapeuta:", error);
    return response.status(500).json({ error: "Erro ao deletar terapeuta" });
  }
}
