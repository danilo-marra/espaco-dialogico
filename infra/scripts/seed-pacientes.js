/**
 * Script para inserir dados de teste na tabela pacientes durante o ambiente de desenvolvimento
 *
 * Executar com: node infra/scripts/seed-pacientes.js
 *
 * Este script insere dados fictícios na tabela de pacientes para facilitar o desenvolvimento
 * e testes da aplicação. Não deve ser usado em ambiente de produção.
 *
 * Nota: Os campos dt_nascimento e origem são opcionais e podem ser null em alguns registros.
 */

const database = require("../database.js");
const dotenv = require("dotenv");
const path = require("path");
const { faker } = require("@faker-js/faker/locale/pt_BR");

// Carrega variáveis de ambiente do arquivo .env.development.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.development.local") });

// Número de pacientes a serem criados
const NUM_PACIENTES = 15;

// Array para guardar promessas de inserção
const insertPromises = [];

/**
 * Função para gerar uma data aleatória entre dois anos
 */
function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

/**
 * Origem possíveis para os pacientes
 */
const origens = ["Indicação", "Instagram", "Busca no Google", "Outros"];

async function seedPacientes() {
  console.log("\n🌱 Iniciando seed da tabela pacientes...");

  try {
    // Verificar se a tabela existe
    const tableCheck = await database.query({
      text: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'pacientes'
        );
      `,
    });

    if (!tableCheck.rows[0].exists) {
      console.error(
        "❌ A tabela 'pacientes' não existe. Execute as migrações primeiro.",
      );
      process.exit(1);
    }

    // Contar quantos pacientes já existem
    const countResult = await database.query({
      text: "SELECT COUNT(*) FROM pacientes",
    });

    const existingCount = parseInt(countResult.rows[0].count);
    console.log(
      `ℹ️ Encontrados ${existingCount} pacientes existentes no banco.`,
    );

    if (existingCount >= NUM_PACIENTES) {
      console.log(
        `✅ Já existem ${existingCount} pacientes no banco. Nenhum dado adicional será inserido.`,
      );
      process.exit(0);
    }

    // Obter lista de terapeutas para associar aos pacientes
    const terapeutasResult = await database.query({
      text: "SELECT id FROM terapeutas",
    });

    if (terapeutasResult.rows.length === 0) {
      console.error(
        "❌ Não existem terapeutas cadastrados. Execute o seed-terapeutas primeiro.",
      );
      process.exit(1);
    }

    const terapeutas = terapeutasResult.rows;

    // Gerar e inserir pacientes
    for (let i = existingCount; i < NUM_PACIENTES; i++) {
      // Gerar dados fictícios usando faker
      const nome = faker.person.fullName();

      // dt_nascimento é opcional - 30% de chance de ser null
      const dt_nascimento = randomDate(
        new Date(1990, 0, 1),
        new Date(2020, 0, 1),
      );

      // Selecionar um terapeuta aleatoriamente
      const terapeuta_id =
        terapeutas[Math.floor(Math.random() * terapeutas.length)].id;

      const nome_responsavel = faker.person.fullName();
      const telefone_responsavel = faker.phone.number("###########");
      const email_responsavel = faker.internet.email();
      const cpf_responsavel = faker.string.numeric(11);
      const endereco_responsavel =
        faker.location.streetAddress() + ", " + faker.location.city();

      // origem é opcional - 20% de chance de ser null
      const origem = origens[Math.floor(Math.random() * origens.length)];

      const dt_entrada = randomDate(new Date(2022, 0, 1), new Date());

      // Inserir no banco
      insertPromises.push(
        database.query({
          text: `
          INSERT INTO pacientes (
            nome, 
            dt_nascimento, 
            terapeuta_id, 
            nome_responsavel, 
            telefone_responsavel, 
            email_responsavel, 
            cpf_responsavel, 
            endereco_responsavel, 
            origem, 
            dt_entrada
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id, nome, email_responsavel
        `,
          values: [
            nome,
            dt_nascimento,
            terapeuta_id,
            nome_responsavel,
            telefone_responsavel,
            email_responsavel,
            cpf_responsavel,
            endereco_responsavel,
            origem,
            dt_entrada,
          ],
        }),
      );
    }

    // Aguardar a conclusão de todas as inserções
    const results = await Promise.all(insertPromises);

    // Exibir os pacientes criados
    console.log(`\n✅ ${results.length} pacientes criados com sucesso:`);
    results.forEach((result, index) => {
      const paciente = result.rows[0];
      console.log(
        `   ${index + 1}. ${paciente.nome} (${paciente.email_responsavel})`,
      );
    });
  } catch (error) {
    console.error(`\n❌ Erro ao inserir dados na tabela pacientes:`);
    console.error(error);
    process.exit(1);
  }
}

seedPacientes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
