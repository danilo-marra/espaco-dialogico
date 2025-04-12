import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import paciente from "models/paciente.js";
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

router.get(getAllHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getAllHandler(request, response) {
  try {
    const pacientes = await paciente.getAll();
    return response.status(200).json(pacientes);
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    return response.status(500).json({ error: "Erro ao buscar pacientes" });
  }
}

async function postHandler(request, response) {
  // Configurar formidable para análise de formulários multipart
  const form = formidable({
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  try {
    // Parsing com a API atual
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(request, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Preparar objeto paciente para inserção
    const pacienteData = {
      nome: getFormValue(fields.nome),
      telefone: getFormValue(fields.telefone),
      email: getFormValue(fields.email),
      endereco: getFormValue(fields.endereco),
      data_nascimento: getFormValue(fields.data_nascimento),
      observacoes: getFormValue(fields.observacoes),
    };

    // Upload da foto para o Cloudinary, se existir
    if (files.foto && Array.isArray(files.foto) && files.foto.length > 0) {
      try {
        const fotoUrl = await uploadToCloudinary(files.foto[0]);
        pacienteData.foto = fotoUrl;
      } catch (error) {
        console.error("Erro ao fazer upload para o Cloudinary:", error);
        // Continua sem a foto se falhar o upload
      }
    }

    // Criar paciente no banco de dados
    const novoPaciente = await paciente.create(pacienteData);
    return response.status(201).json(novoPaciente);
  } catch (error) {
    console.error("Erro ao criar paciente:", error);
    return response
      .status(500)
      .json({ error: error.message || "Erro ao criar paciente" });
  }
}
