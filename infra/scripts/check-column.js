// check-migration.js
const database = require("../database.js");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });

async function checkMigration() {
  try {
    const result = await database.query({
      text: `
        SELECT * FROM pgmigrations 
        WHERE name = '1746798677616_add-agendamento-id-to-sessoes'
      `,
    });

    console.log("Migration status:", result.rows);

    const tableResult = await database.query({
      text: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'sessoes'
        );
      `,
    });

    console.log("Table sessoes exists:", tableResult.rows[0].exists);
  } catch (error) {
    console.error("Error checking migration:", error);
  } finally {
    process.exit(0);
  }
}

checkMigration();
