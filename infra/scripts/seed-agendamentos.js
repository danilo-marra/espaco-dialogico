/**
 * Script para inserir dados de teste na tabela agendamentos durante o ambiente de desenvolvimento
 *
 * Executar com: node infra/scripts/seed-agendamentos.js
 *
 * Este script insere dados fictícios na tabela de agendamentos para facilitar o desenvolvimento
 * e testes da aplicação. Não deve ser usado em ambiente de produção.
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

async function seedAgendamentos() {
  console.log("\n🌱 Iniciando seed da tabela agendamentos...");

  try {
    // Verificar se a tabela existe
    const tableCheck = await database.query({
      text: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'agendamentos'
        );
      `,
    });

    if (!tableCheck.rows[0].exists) {
      console.error(
        "❌ A tabela 'agendamentos' não existe. Execute as migrações primeiro.",
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

    if (existingCount >= NUM_AGENDAMENTOS) {
      console.log(
        `✅ Já existem ${existingCount} agendamentos no banco. Nenhum dado adicional será inserido.`,
      );
      process.exit(0);
    }

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

    // Gerar e inserir agendamentos
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

      // Inserir no banco
      insertPromises.push(
        database.query({
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
        }),
      );
    }

    // Aguardar a conclusão de todas as inserções
    const results = await Promise.all(insertPromises);

    // Exibir os agendamentos criados
    console.log(`\n✅ ${results.length} agendamentos criados com sucesso:`);
    results.forEach((result, index) => {
      const agendamento = result.rows[0];
      console.log(
        `   ${index + 1}. ${agendamento.data_agendamento} ${
          agendamento.horario_agendamento
        } - ${agendamento.tipo_agendamento} (${agendamento.status_agendamento})`,
      );
    });
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
