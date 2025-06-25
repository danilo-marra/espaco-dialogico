const database = require("../infra/database.js");

async function checkAssociations() {
  try {
    console.log("🔍 Verificando associações user ↔ terapeuta...\n");

    // 1. Usuários com role 'terapeuta'
    const usersResult = await database.query({
      text: `
        SELECT id, username, email, role, created_at 
        FROM users 
        WHERE role = 'terapeuta'
        ORDER BY created_at DESC
      `,
    });

    console.log(`👨‍⚕️ Usuários com role 'terapeuta': ${usersResult.rows.length}`);

    // 2. Terapeutas com user_id
    const terapeutasResult = await database.query({
      text: `
        SELECT t.id, t.nome, t.email, t.user_id, u.username, u.email as user_email
        FROM terapeutas t
        LEFT JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
      `,
    });

    console.log(`🏥 Total de terapeutas: ${terapeutasResult.rows.length}`);

    // 3. Analisar associações
    console.log("\n📊 ANÁLISE DAS ASSOCIAÇÕES:");
    console.log("=".repeat(60));

    const terapeutasComUser = terapeutasResult.rows.filter((t) => t.user_id);
    const terapeutasSemUser = terapeutasResult.rows.filter((t) => !t.user_id);

    console.log(
      `✅ Terapeutas COM usuário vinculado: ${terapeutasComUser.length}`,
    );
    console.log(
      `❌ Terapeutas SEM usuário vinculado: ${terapeutasSemUser.length}`,
    );

    if (terapeutasComUser.length > 0) {
      console.log("\n🔗 TERAPEUTAS COM USUÁRIO VINCULADO:");
      terapeutasComUser.forEach((t) => {
        console.log(`  • ${t.nome} (${t.email})`);
        console.log(`    ↳ Usuário: ${t.username} (${t.user_email})`);
      });
    }

    if (terapeutasSemUser.length > 0) {
      console.log("\n🚫 TERAPEUTAS SEM USUÁRIO VINCULADO:");
      terapeutasSemUser.forEach((t) => {
        console.log(`  • ${t.nome} (${t.email})`);
      });
    }

    // 4. Usuários terapeuta sem registro de terapeuta
    console.log("\n🔍 USUÁRIOS 'terapeuta' SEM REGISTRO DE TERAPEUTA:");
    const usersSemTerapeuta = [];

    for (const user of usersResult.rows) {
      const terapeutaVinculado = terapeutasResult.rows.find(
        (t) => t.user_id === user.id,
      );
      if (!terapeutaVinculado) {
        usersSemTerapeuta.push(user);
      }
    }

    if (usersSemTerapeuta.length > 0) {
      usersSemTerapeuta.forEach((u) => {
        console.log(`  • ${u.username} (${u.email})`);
      });
    } else {
      console.log(
        "  ✅ Todos os usuários 'terapeuta' têm registro correspondente",
      );
    }

    // 5. Resumo
    console.log("\n📋 RESUMO:");
    console.log("=".repeat(40));
    console.log(`Total de usuários 'terapeuta': ${usersResult.rows.length}`);
    console.log(
      `Total de registros de terapeutas: ${terapeutasResult.rows.length}`,
    );
    console.log(
      `Terapeutas com usuário vinculado: ${terapeutasComUser.length}`,
    );
    console.log(
      `Usuários 'terapeuta' sem registro: ${usersSemTerapeuta.length}`,
    );

    if (
      terapeutasComUser.length === usersResult.rows.length &&
      usersSemTerapeuta.length === 0
    ) {
      console.log("\n🎉 TUDO CERTO! Todas as associações estão corretas.");
    } else {
      console.log("\n⚠️  Existem inconsistências que precisam ser corrigidas.");
    }
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    process.exit(0);
  }
}

checkAssociations();
