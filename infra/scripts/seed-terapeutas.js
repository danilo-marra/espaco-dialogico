/**
 * Script para inserir dados de teste na tabela terapeutas durante o ambiente de desenvolvimento
 *
 * Executar com: node infra/scripts/seed-terapeutas.js
 *
 * Este script insere dados fictícios na tabela de terapeutas para facilitar o desenvolvimento
 * e testes da aplicação. Não deve ser usado em ambiente de produção.
 */

const database = require("../database.js");
const dotenv = require("dotenv");
const path = require("path");
const { faker } = require("@faker-js/faker/locale/pt_BR");

// Carrega variáveis de ambiente do arquivo .env.development
dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });

// Número de terapeutas a serem criados
const NUM_TERAPEUTAS = 10;

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

async function seedTerapeutas() {
  console.log("\n🌱 Iniciando seed da tabela terapeutas...");

  try {
    // Verificar se a tabela existe
    const tableCheck = await database.query({
      text: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'terapeutas'
        );
      `,
    });

    if (!tableCheck.rows[0].exists) {
      console.error(
        "❌ A tabela 'terapeutas' não existe. Execute as migrações primeiro.",
      );
      process.exit(1);
    }

    // Contar quantos terapeutas já existem
    const countResult = await database.query({
      text: "SELECT COUNT(*) FROM terapeutas",
    });

    const existingCount = parseInt(countResult.rows[0].count);
    console.log(
      `ℹ️ Encontrados ${existingCount} terapeutas existentes no banco.`,
    );

    if (existingCount >= NUM_TERAPEUTAS) {
      console.log(
        `✅ Já existem ${existingCount} terapeutas no banco. Nenhum dado adicional será inserido.`,
      );
      process.exit(0);
    }

    // Gerar e inserir terapeutas
    for (let i = existingCount; i < NUM_TERAPEUTAS; i++) {
      // Gerar dados fictícios usando faker
      const nome = faker.person.fullName();
      const telefone = faker.phone.number("###########");
      const email = faker.internet.email({
        firstName: nome.split(" ")[0].toLowerCase(),
        lastName: nome.split(" ").slice(-1)[0].toLowerCase(),
        provider: "espacodialogico.com.br",
      });

      // Novos campos
      const crp =
        Math.random() > 0.3
          ? `CRP 06/${faker.number.int({ min: 10000, max: 99999 })}`
          : null; // 70% chance de ter CRP
      const dt_nascimento =
        Math.random() > 0.2
          ? randomDate(new Date(1970, 0, 1), new Date(1995, 11, 31))
          : null; // 80% chance de ter data nascimento
      const dt_entrada = randomDate(new Date(2020, 0, 1), new Date());
      const chave_pix = faker.finance.accountNumber();

      // Inserir no banco
      insertPromises.push(
        database.query({
          text: `
          INSERT INTO terapeutas (nome, foto, telefone, email, crp, dt_nascimento, dt_entrada, chave_pix)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, nome, email
        `,
          values: [
            nome,
            null,
            telefone,
            email,
            crp,
            dt_nascimento,
            dt_entrada,
            chave_pix,
          ],
        }),
      );
    }

    // Aguardar a conclusão de todas as inserções
    const results = await Promise.all(insertPromises);

    // Exibir os terapeutas criados
    console.log(`\n✅ ${results.length} terapeutas criados com sucesso:`);
    results.forEach((result, index) => {
      const terapeuta = result.rows[0];
      console.log(`   ${index + 1}. ${terapeuta.nome} (${terapeuta.email})`);
    });
  } catch (error) {
    console.error(`\n❌ Erro ao inserir dados na tabela terapeutas:`);
    console.error(error);
    process.exit(1);
  }
}

seedTerapeutas()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
