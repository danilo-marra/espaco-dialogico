/**
 * Script para inserir dados de teste na tabela agendamentos durante o ambiente de desenvolvimento
 * e sincronizar automaticamente com a tabela de sessões
 *
 * Executar com: node infra/scripts/seed-agendamentos.js
 *
 * Este script insere dados fictícios na tabela de agendamentos e cria as sessões correspondentes
 * para facilitar o desenvolvimento e testes da aplicação. Não deve ser usado em ambiente de produção.
 */

const database = require("../database.js");
const dotenv = require("dotenv");
const path = require("path");
const { faker } = require("@faker-js/faker/locale/pt_BR");

// Carrega variáveis de ambiente do arquivo .env.development
dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });

// Número de agendamentos a serem criados
const NUM_AGENDAMENTOS = 50;

// Array para guardar promessas de inserção
const insertPromises = [];

/**
 * Função para gerar uma data aleatória entre hoje e 60 dias para frente
 */
function randomFutureDate(maxDays = 60) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + Math.floor(Math.random() * maxDays));
  return futureDate.toISOString().split("T")[0]; // Formato YYYY-MM-DD
}

/**
 * Função para gerar um horário aleatório entre 8h e 18h com intervalos de 30 minutos
 */
function randomTimeSlot() {
  const hour = Math.floor(Math.random() * 11) + 8; // 8h às 18h
  const minute = Math.random() > 0.5 ? "30" : "00";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
}

/**
 * Locais de agendamento disponíveis
 */
const locaisAgendamento = ["Sala Verde", "Sala Azul", "Não Precisa de Sala"];

/**
 * Modalidades de agendamento disponíveis
 */
const modalidadesAgendamento = ["Presencial", "Online"];

/**
 * Tipos de agendamento disponíveis
 */
const tiposAgendamento = [
  "Sessão",
  "Orientação Parental",
  "Visita Escolar",
  "Supervisão",
  "Outros",
];

/**
 * Status possíveis para os agendamentos
 */
const statusAgendamento = ["Confirmado", "Remarcado", "Cancelado"];

/**
 * Mapeia o tipo de agendamento para tipo de sessão
 * Alinhado com a interface em tipos.ts (valores permitidos: "Anamnese" | "Atendimento" | "Avaliação" | "Visitar Escolar")
 */
function mapearTipoAgendamentoParaTipoSessao(tipoAgendamento) {
  switch (tipoAgendamento) {
    case "Sessão":
      return "Atendimento";
    case "Orientação Parental":
      return "Atendimento"; // Alterado para um tipo válido
    case "Visita Escolar":
      return "Visitar Escolar";
    case "Supervisão":
      return "Atendimento"; // Alterado para um tipo válido
    case "Outros":
      return "Atendimento";
    default:
      return "Atendimento";
  }
}

/**
 * Mapeia o status de agendamento para status de sessão
 * Alinhado com a interface em tipos.ts (valores permitidos: "Pagamento Pendente" | "Pagamento Realizado" | "Nota Fiscal Emitida" | "Nota Fiscal Enviada")
 */
function mapearStatusAgendamentoParaStatusSessao(statusAgendamento) {
  switch (statusAgendamento) {
    case "Confirmado":
      return "Pagamento Pendente";
    case "Remarcado":
      return "Pagamento Pendente";
    case "Cancelado":
      return "Pagamento Pendente"; // Alterado de "Não Realizada" para um status válido
    default:
      return "Pagamento Pendente";
  }
}

async function seedAgendamentos() {
  console.log(
    "\n🌱 Iniciando seed da tabela agendamentos e sincronização com sessões...",
  );

  try {
    // Verificar se as tabelas existem
    const tableCheckAgendamentos = await database.query({
      text: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'agendamentos'
        );
      `,
    });

    const tableCheckSessoes = await database.query({
      text: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'sessoes'
        );
      `,
    });

    if (!tableCheckAgendamentos.rows[0].exists) {
      console.error(
        "❌ A tabela 'agendamentos' não existe. Execute as migrações primeiro.",
      );
      process.exit(1);
    }

    if (!tableCheckSessoes.rows[0].exists) {
      console.error(
        "❌ A tabela 'sessoes' não existe. Execute as migrações primeiro.",
      );
      process.exit(1);
    }

    // Contar quantos agendamentos já existem
    const countResult = await database.query({
      text: "SELECT COUNT(*) FROM agendamentos",
    });

    const existingCount = parseInt(countResult.rows[0].count);
    console.log(
      `ℹ️ Encontrados ${existingCount} agendamentos existentes no banco.`,
    );

    // Obter lista de terapeutas e pacientes para associar aos agendamentos
    const terapeutasResult = await database.query({
      text: "SELECT id FROM terapeutas",
    });

    const pacientesResult = await database.query({
      text: "SELECT id FROM pacientes",
    });

    if (
      terapeutasResult.rows.length === 0 ||
      pacientesResult.rows.length === 0
    ) {
      console.error(
        "❌ Não existem terapeutas ou pacientes suficientes. Execute os seeds correspondentes primeiro.",
      );
      process.exit(1);
    }

    const terapeutas = terapeutasResult.rows;
    const pacientes = pacientesResult.rows;

    // Primeiro, sincronizar os agendamentos existentes com sessões
    if (existingCount > 0) {
      console.log("🔄 Sincronizando agendamentos existentes com sessões...");

      // Buscar todos os agendamentos existentes
      const agendamentosExistentes = await database.query({
        text: `SELECT * FROM agendamentos`,
      });

      // Verificar quais agendamentos não possuem sessões correspondentes
      for (const agendamento of agendamentosExistentes.rows) {
        const sessaoCheck = await database.query({
          text: `SELECT COUNT(*) FROM sessoes WHERE agendamento_id = $1`,
          values: [agendamento.id],
        });

        // Se não existe sessão para este agendamento, criar uma
        if (parseInt(sessaoCheck.rows[0].count) === 0) {
          await database.query({
            text: `
              INSERT INTO sessoes (
                terapeuta_id,
                paciente_id,
                tipo_sessao,
                valor_sessao,
                status_sessao,
                agendamento_id
              )
              VALUES ($1, $2, $3, $4, $5, $6)
            `,
            values: [
              agendamento.terapeuta_id,
              agendamento.paciente_id,
              mapearTipoAgendamentoParaTipoSessao(agendamento.tipo_agendamento),
              agendamento.valor_agendamento,
              mapearStatusAgendamentoParaStatusSessao(
                agendamento.status_agendamento,
              ),
              agendamento.id,
            ],
          });

          console.log(
            `  ✓ Criada sessão para o agendamento ID: ${agendamento.id}`,
          );
        }
      }

      console.log("✅ Sincronização de agendamentos existentes concluída!");
    }

    // Se já temos o número desejado de agendamentos, não criar novos
    if (existingCount >= NUM_AGENDAMENTOS) {
      console.log(
        `✅ Já existem ${existingCount} agendamentos no banco. Nenhum agendamento adicional será inserido.`,
      );
      process.exit(0);
    }

    console.log(
      `📝 Criando ${NUM_AGENDAMENTOS - existingCount} novos agendamentos...`,
    );

    // Gerar e inserir novos agendamentos
    for (let i = existingCount; i < NUM_AGENDAMENTOS; i++) {
      // Selecionar um terapeuta e paciente aleatoriamente
      const terapeuta_id =
        terapeutas[Math.floor(Math.random() * terapeutas.length)].id;
      const paciente_id =
        pacientes[Math.floor(Math.random() * pacientes.length)].id;

      // Alguns agendamentos compartilham ID de recorrência (sessões recorrentes)
      // Chance de 30% de ser parte de uma série recorrente
      let recurrence_id = null;
      if (Math.random() < 0.3) {
        recurrence_id = faker.string.uuid();
      }

      // Gerar dados fictícios
      const data_agendamento = randomFutureDate();
      const horario_agendamento = randomTimeSlot();
      const local_agendamento =
        locaisAgendamento[Math.floor(Math.random() * locaisAgendamento.length)];
      const modalidade_agendamento =
        modalidadesAgendamento[
          Math.floor(Math.random() * modalidadesAgendamento.length)
        ];
      const tipo_agendamento =
        tiposAgendamento[Math.floor(Math.random() * tiposAgendamento.length)];
      const valor_agendamento = faker.number.float({
        min: 100,
        max: 500,
        precision: 2,
      });

      // Status com probabilidades diferentes (maioria confirmado)
      const statusRandom = Math.random();
      let status_agendamento;
      if (statusRandom < 0.7) {
        status_agendamento = statusAgendamento[0]; // "Confirmado"
      } else if (statusRandom < 0.9) {
        status_agendamento = statusAgendamento[1]; // "Remarcado"
      } else {
        status_agendamento = statusAgendamento[2]; // "Cancelado"
      }

      // Gerar observações para alguns agendamentos (50% de chance)
      const observacoes_agendamento =
        Math.random() > 0.5
          ? faker.helpers.arrayElement([
              "Trazer relatório da escola",
              "Primeira sessão com este paciente",
              "Reagendado a pedido do responsável",
              "Pais participarão da sessão",
              "Sessão de devolutiva",
              "Paciente prefere online devido à distância",
              "",
            ])
          : null;

      // Inserir o agendamento e criar uma sessão correspondente em uma transação
      insertPromises.push(
        (async () => {
          try {
            // Begin transaction
            await database.query({ text: "BEGIN" });

            // Inserir o agendamento
            const agendamentoResult = await database.query({
              text: `
                INSERT INTO agendamentos (
                  terapeuta_id,
                  paciente_id,
                  recurrence_id,
                  data_agendamento,
                  horario_agendamento,
                  local_agendamento,
                  modalidade_agendamento,
                  tipo_agendamento,
                  valor_agendamento,
                  status_agendamento,
                  observacoes_agendamento
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING id, data_agendamento, horario_agendamento, tipo_agendamento, status_agendamento
              `,
              values: [
                terapeuta_id,
                paciente_id,
                recurrence_id,
                data_agendamento,
                horario_agendamento,
                local_agendamento,
                modalidade_agendamento,
                tipo_agendamento,
                valor_agendamento,
                status_agendamento,
                observacoes_agendamento,
              ],
            });

            const agendamento_id = agendamentoResult.rows[0].id;

            // Criar a sessão vinculada ao agendamento
            await database.query({
              text: `
                INSERT INTO sessoes (
                  terapeuta_id,
                  paciente_id,
                  tipo_sessao,
                  valor_sessao,
                  status_sessao,
                  agendamento_id
                )
                VALUES ($1, $2, $3, $4, $5, $6)
              `,
              values: [
                terapeuta_id,
                paciente_id,
                mapearTipoAgendamentoParaTipoSessao(tipo_agendamento),
                valor_agendamento,
                mapearStatusAgendamentoParaStatusSessao(status_agendamento),
                agendamento_id,
              ],
            });

            // Commit transaction
            await database.query({ text: "COMMIT" });

            return agendamentoResult;
          } catch (error) {
            // Rollback transaction on error
            await database.query({ text: "ROLLBACK" });
            throw error;
          }
        })(),
      );
    }

    // Aguardar a conclusão de todas as inserções
    const results = await Promise.all(insertPromises);

    // Exibir os agendamentos criados
    console.log(
      `\n✅ ${results.length} agendamentos criados com sucesso (com sessões correspondentes):`,
    );
    results.forEach((result, index) => {
      const agendamento = result.rows[0];
      console.log(
        `   ${index + 1}. ${agendamento.data_agendamento} ${
          agendamento.horario_agendamento
        } - ${agendamento.tipo_agendamento} (${agendamento.status_agendamento})`,
      );
    });

    // Confirmar total de sessões criadas
    const sessoesCount = await database.query({
      text: "SELECT COUNT(*) FROM sessoes",
    });

    console.log(
      `\n📊 Total de sessões no sistema: ${sessoesCount.rows[0].count}`,
    );
  } catch (error) {
    console.error(`\n❌ Erro ao inserir dados na tabela agendamentos:`);
    console.error(error);
    process.exit(1);
  }
}

seedAgendamentos()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
