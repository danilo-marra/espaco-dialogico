import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import paciente from "models/paciente.js";
import { formidable } from "formidable";
import authMiddleware from "utils/authMiddleware.js";
import { requirePermission } from "utils/roleMiddleware.js";
import { requireTerapeutaAccess } from "utils/terapeutaMiddleware.js";
import { parsePagination, setPaginationHeaders } from "utils/pagination.js";

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
router.use(authMiddleware).use(requirePermission("pacientes"));
router.use(requireTerapeutaAccess());

router.get(getAllHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getAllHandler(request, response) {
  try {
    // Verificar se é um terapeuta e filtrar adequadamente
    const userRole = request.user?.role;
    const terapeutaId = request.terapeutaId; // Vem do middleware terapeutaMiddleware
    const pagination = parsePagination(request.query, {
      defaultLimit: 200,
      maxLimit: 500,
    });
    const search = request.query.search || request.query.q;
    const requestedTerapeutaId = request.query.terapeuta_id;

    let pacientes;

    // Se for terapeuta, buscar apenas seus pacientes
    if (userRole === "terapeuta") {
      if (!terapeutaId) {
        return response.status(403).json({
          error: "Acesso negado",
          message:
            "Terapeuta não tem registro válido no sistema. Entre em contato com a administração.",
        });
      }

      pacientes = await paciente.getFiltered({
        terapeuta_id: terapeutaId,
        search,
        ...pagination,
      });
    } else {
      // Admin e secretaria veem todos os pacientes
      pacientes = await paciente.getFiltered({
        terapeuta_id: requestedTerapeutaId,
        search,
        ...pagination,
      });
    }

    setPaginationHeaders(response, {
      ...pagination,
      count: pacientes.length,
    });
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

    // Preparar objeto paciente para inserção com os campos corretos
    const pacienteData = {
      nome: getFormValue(fields.nome),
      dt_nascimento: getFormValue(fields.dt_nascimento) || null,
      terapeuta_id: getFormValue(fields.terapeuta_id),
      nome_responsavel: getFormValue(fields.nome_responsavel),
      telefone_responsavel: getFormValue(fields.telefone_responsavel),
      origem: getFormValue(fields.origem) || null,
      dt_entrada: getFormValue(fields.dt_entrada),
      nf_nome_completo: getFormValue(fields.nf_nome_completo),
      nf_telefone: getFormValue(fields.nf_telefone),
      nf_cpf: getFormValue(fields.nf_cpf),
      nf_email: getFormValue(fields.nf_email),
      nf_endereco: getFormValue(fields.nf_endereco),
      nf_dt_entrada: getFormValue(fields.nf_dt_entrada),
    };

    // Validação dos campos obrigatórios
    const requiredFields = [
      "nome",
      "terapeuta_id",
      "nome_responsavel",
      "telefone_responsavel",
      "nf_nome_completo",
      "nf_telefone",
      "nf_cpf",
      "nf_email",
      "nf_endereco",
      "nf_dt_entrada",
    ];

    for (const field of requiredFields) {
      if (!pacienteData[field]) {
        throw new Error(`Campo obrigatório não preenchido: ${field}`);
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
