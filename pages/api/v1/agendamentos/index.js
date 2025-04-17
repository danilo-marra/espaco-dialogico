import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import agendamento from "models/agendamento.js";
import authMiddleware from "utils/authMiddleware.js";

// Criar o router
const router = createRouter();

// Aplicar middleware de autenticação para proteger as rotas
router.use(authMiddleware);

// Definir os handlers para cada método HTTP
router.get(getHandler);
router.post(postHandler);

// Handler para obter os agendamentos
async function getHandler(req, res) {
  // Verificar se há filtros na query string
  const { terapeuta_id, paciente_id, status, dataInicio, dataFim } = req.query;

  let agendamentos;

  // Se existirem filtros, usar getFiltered, caso contrário, usar getAll
  if (terapeuta_id || paciente_id || status || dataInicio || dataFim) {
    agendamentos = await agendamento.getFiltered({
      terapeuta_id,
      paciente_id,
      status,
      dataInicio,
      dataFim,
    });
  } else {
    agendamentos = await agendamento.getAll();
  }

  // Retornar a resposta com status 200 (OK)
  res.status(200).json(agendamentos);
}

// Handler para criar um novo agendamento
async function postHandler(req, res) {
  try {
    // Extrair os dados do corpo da requisição
    const agendamentoData = req.body;

    // Verificar se já existe agendamento com mesmas características
    // Isso evita duplicações por múltiplos envios do formulário
    const existentes = await agendamento.getFiltered({
      paciente_id: agendamentoData.paciente_id,
      terapeuta_id: agendamentoData.terapeuta_id,
      dataInicio: agendamentoData.dataAgendamento,
      dataFim: agendamentoData.dataAgendamento,
      horario: agendamentoData.horarioAgendamento,
    });

    // Se encontrou algum agendamento com os mesmos dados críticos
    if (
      existentes &&
      existentes.some(
        (a) =>
          a.horarioAgendamento === agendamentoData.horarioAgendamento &&
          a.dataAgendamento === agendamentoData.dataAgendamento &&
          a.paciente_id === agendamentoData.paciente_id &&
          a.terapeuta_id === agendamentoData.terapeuta_id,
      )
    ) {
      return res.status(409).json({
        error: "Conflito",
        message: "Já existe um agendamento com estes mesmos dados",
      });
    }

    // Criar um novo agendamento
    const novoAgendamento = await agendamento.create(agendamentoData);

    // Retornar a resposta com status 201 (Created)
    res.status(201).json(novoAgendamento);
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    res
      .status(500)
      .json({ error: "Erro interno do servidor", message: error.message });
  }
}

// Exportar o handler com tratamento de erros
export default router.handler(controller.errorHandlers);
