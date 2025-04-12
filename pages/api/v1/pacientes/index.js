import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import paciente from "models/paciente.js";
import { formidable } from "formidable";

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
    const [fields] = await new Promise((resolve, reject) => {
      form.parse(request, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    console.log("Campos recebidos do formulário:", fields);

    // Preparar objeto paciente para inserção com os campos corretos
    const pacienteData = {
      nome: getFormValue(fields.nome),
      dt_nascimento: getFormValue(fields.dt_nascimento),
      terapeuta_id: getFormValue(fields.terapeuta_id),
      nome_responsavel: getFormValue(fields.nome_responsavel),
      telefone_responsavel: getFormValue(fields.telefone_responsavel),
      email_responsavel: getFormValue(fields.email_responsavel),
      cpf_responsavel: getFormValue(fields.cpf_responsavel),
      endereco_responsavel: getFormValue(fields.endereco_responsavel),
      origem: getFormValue(fields.origem),
      dt_entrada: getFormValue(fields.dt_entrada),
    };

    // Validação dos campos obrigatórios
    const requiredFields = [
      "nome",
      "dt_nascimento",
      "terapeuta_id",
      "nome_responsavel",
      "telefone_responsavel",
      "email_responsavel",
      "cpf_responsavel",
      "endereco_responsavel",
      "origem",
    ];

    for (const field of requiredFields) {
      if (!pacienteData[field]) {
        throw new Error(`Campo obrigatório não preenchido: ${field}`);
      }
    }

    console.log("Dados do paciente formatados para inserção:", pacienteData);

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
