import { createRouter } from "next-connect";
import { formidable } from "formidable";
import terapeuta from "models/terapeuta";
import controller from "infra/controller";
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

// GET para recuperar um terapeuta específico
async function getHandler(req, res) {
  const { id } = req.query;

  try {
    const terapeutaById = await terapeuta.getById(id);
    if (!terapeutaById) {
      return res.status(404).json({
        error: "Terapeuta não encontrado",
      });
    }
    return res.status(200).json(terapeutaById);
  } catch (error) {
    console.error("Erro ao buscar terapeuta:", error);
    throw error; // Será capturado pelo controller.errorHandlers
  }
}

// PUT para atualizar um terapeuta
async function putHandler(req, res) {
  const { id } = req.query;

  try {
    // Verificar se o terapeuta existe
    const existingTerapeuta = await terapeuta.getById(id);
    if (!existingTerapeuta) {
      return res.status(404).json({
        error: "Terapeuta não encontrado",
      });
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

    // Atualizar terapeuta no banco de dados
    console.log(`Atualizando terapeuta ${id} com dados:`, terapeutaData);
    const updatedTerapeuta = await terapeuta.update(id, terapeutaData);

    console.log("Fields:", fields);
    console.log("Files:", files);

    return res.status(200).json(updatedTerapeuta);
  } catch (error) {
    console.error("Erro ao atualizar terapeuta:", error);
    throw error; // Será capturado pelo controller.errorHandlers
  }
}

// DELETE para remover um terapeuta
async function deleteHandler(req, res) {
  const { id } = req.query;

  try {
    await terapeuta.remove(id);
    return res.status(204).end();
  } catch (error) {
    console.error("Erro ao remover terapeuta:", error);
    throw error; // Será capturado pelo controller.errorHandlers
  }
}
