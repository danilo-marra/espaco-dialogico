/**
 * SEED OBSOLETO POIS A CRIAÇÃO DE SESSÕES É VINCULADA NO AGENDAMENTO
 */

const database = require("../database.js");
const dotenv = require("dotenv");
const path = require("path");
const { faker } = require("@faker-js/faker/locale/pt_BR");

// Carrega variáveis de ambiente do arquivo .env.development
dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });

// Número de sessões a serem criadas
const NUM_SESSOES = 30;

// Array para guardar promessas de inserção
const insertPromises = [];

/**
 * Função para gerar uma data aleatória entre hoje e 60 dias para frente
 */
function randomFutureDate(maxDays = 60) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + Math.floor(Math.random() * maxDays));
  return futureDate;
}

/**
 * Tipos de sessões disponíveis
 */
const tiposSessao = ["Anamnese", "Atendimento", "Avaliação", "Visitar Escolar"];

/**
 * Status possíveis para as sessões
 */
const statusSessao = [
  "Pagamento Pendente",
  "Pagamento Realizado",
  "Nota Fiscal Emitida",
  "Nota Fiscal Enviada",
];

async function seedSessoes() {
  console.log("\n🌱 Iniciando seed da tabela sessoes...");

  try {
    // Verificar se a tabela existe
    const tableCheck = await database.query({
      text: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'sessoes'
        );
      `,
    });

    if (!tableCheck.rows[0].exists) {
      console.error(
        "❌ A tabela 'sessoes' não existe. Execute as migrações primeiro.",
      );
      process.exit(1);
    }

    // Contar quantas sessões já existem
    const countResult = await database.query({
      text: "SELECT COUNT(*) FROM sessoes",
    });

    const existingCount = parseInt(countResult.rows[0].count);
    console.log(`ℹ️ Encontradas ${existingCount} sessões existentes no banco.`);

    if (existingCount >= NUM_SESSOES) {
      console.log(
        `✅ Já existem ${existingCount} sessões no banco. Nenhum dado adicional será inserido.`,
      );
      process.exit(0);
    }

    // Obter lista de terapeutas e pacientes para associar às sessões
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

    // Gerar e inserir sessões
    for (let i = existingCount; i < NUM_SESSOES; i++) {
      // Selecionar um terapeuta e paciente aleatoriamente
      const terapeuta_id =
        terapeutas[Math.floor(Math.random() * terapeutas.length)].id;
      const paciente_id =
        pacientes[Math.floor(Math.random() * pacientes.length)].id;

      // Gerar dados fictícios
      const tipo_sessao =
        tiposSessao[Math.floor(Math.random() * tiposSessao.length)];
      const valor_sessao = faker.number.float({
        min: 100,
        max: 500,
        precision: 2,
      });
      const status_sessao =
        statusSessao[Math.floor(Math.random() * statusSessao.length)];

      // Configurar datas das sessões (máximo de 6, nem todas preenchidas)
      const qtdSessoesAgendadas = Math.floor(Math.random() * 6) + 1;
      let dtSessao = [];

      for (let j = 0; j < 6; j++) {
        if (j < qtdSessoesAgendadas) {
          dtSessao[j] = randomFutureDate(j * 10); // Dias incrementais para simular pacotes de sessões
        } else {
          dtSessao[j] = null;
        }
      }

      // Inserir no banco
      insertPromises.push(
        database.query({
          text: `
          INSERT INTO sessoes (
            terapeuta_id,
            paciente_id,
            tipo_sessao,
            valor_sessao,
            status_sessao,
            dt_sessao1,
            dt_sessao2,
            dt_sessao3,
            dt_sessao4,
            dt_sessao5,
            dt_sessao6
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id, tipo_sessao, valor_sessao, status_sessao
        `,
          values: [
            terapeuta_id,
            paciente_id,
            tipo_sessao,
            valor_sessao,
            status_sessao,
            dtSessao[0],
            dtSessao[1],
            dtSessao[2],
            dtSessao[3],
            dtSessao[4],
            dtSessao[5],
          ],
        }),
      );
    }

    // Aguardar a conclusão de todas as inserções
    const results = await Promise.all(insertPromises);

    // Exibir as sessões criadas
    console.log(`\n✅ ${results.length} sessões criadas com sucesso:`);
    results.forEach((result, index) => {
      const sessao = result.rows[0];
      console.log(
        `   ${index + 1}. ${sessao.tipo_sessao} - R$ ${sessao.valor_sessao} (${sessao.status_sessao})`,
      );
    });
  } catch (error) {
    console.error(`\n❌ Erro ao inserir dados na tabela sessoes:`);
    console.error(error);
    process.exit(1);
  }
}

seedSessoes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
