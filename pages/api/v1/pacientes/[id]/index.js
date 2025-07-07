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

router.get(getHandler);
router.put(putHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const id = request.query.id;

  try {
    const pacienteFound = await paciente.getById(id);

    if (!pacienteFound) {
      return response.status(404).json({ error: "Paciente não encontrado" });
    }

    return response.status(200).json(pacienteFound);
  } catch (error) {
    console.error("Erro ao buscar paciente:", error);
    return response.status(500).json({ error: "Erro ao buscar paciente" });
  }
}

async function putHandler(request, response) {
  const id = request.query.id;

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

    // Verificar se o paciente existe
    const pacienteExists = await paciente.getById(id);
    if (!pacienteExists) {
      return response.status(404).json({ error: "Paciente não encontrado" });
    }

    // Tratar especificamente o campo terapeuta_id para garantir que nunca seja null
    const terapeuta_id = getFormValue(fields.terapeuta_id);
    if (!terapeuta_id && !pacienteExists.terapeuta_id) {
      return response
        .status(400)
        .json({ error: "O campo terapeuta_id é obrigatório" });
    }

    // Preparar objeto paciente para atualização
    const pacienteData = {
      nome: getFormValue(fields.nome) || pacienteExists.nome,
      dt_nascimento:
        getFormValue(fields.dt_nascimento) !== undefined
          ? getFormValue(fields.dt_nascimento) || null
          : pacienteExists.dt_nascimento,
      // Use o valor do form apenas se não for falsy (empty string, null, etc)
      terapeuta_id: terapeuta_id || pacienteExists.terapeuta_id,
      nome_responsavel:
        getFormValue(fields.nome_responsavel) ||
        pacienteExists.nome_responsavel,
      telefone_responsavel:
        getFormValue(fields.telefone_responsavel) ||
        pacienteExists.telefone_responsavel,
      email_responsavel:
        getFormValue(fields.email_responsavel) ||
        pacienteExists.email_responsavel,
      cpf_responsavel:
        getFormValue(fields.cpf_responsavel) || pacienteExists.cpf_responsavel,
      endereco_responsavel:
        getFormValue(fields.endereco_responsavel) ||
        pacienteExists.endereco_responsavel,
      origem:
        getFormValue(fields.origem) !== undefined
          ? getFormValue(fields.origem) || null
          : pacienteExists.origem,
      dt_entrada: getFormValue(fields.dt_entrada) || pacienteExists.dt_entrada,
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

    // Atualizar paciente no banco de dados
    const updatedPaciente = await paciente.update(id, pacienteData);
    return response.status(200).json(updatedPaciente);
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);
    return response
      .status(500)
      .json({ error: error.message || "Erro ao atualizar paciente" });
  }
}

async function deleteHandler(request, response) {
  const id = request.query.id;

  try {
    // Verificar se o paciente existe
    const pacienteExists = await paciente.getById(id);
    if (!pacienteExists) {
      return response.status(404).json({ error: "Paciente não encontrado" });
    }

    // Deletar paciente
    await paciente.remove(id);
    return response.status(204).send(); // 204 No Content - resposta bem-sucedida sem conteúdo
  } catch (error) {
    console.error("Erro ao deletar paciente:", error);
    return response.status(500).json({ error: "Erro ao deletar paciente" });
  }
}
