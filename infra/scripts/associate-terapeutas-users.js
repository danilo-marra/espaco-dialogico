import database from "infra/database.js";

/**
 * Script para associar usuários existentes com role "terapeuta" aos registros de terapeutas
 * baseado no email
 */
async function associateTerapeutasWithUsers() {
  console.log("🔗 Iniciando associação de usuários com terapeutas...");

  try {
    // Buscar todos os usuários com role "terapeuta"
    const usersResult = await database.query({
      text: "SELECT id, email, username FROM users WHERE role = 'terapeuta'",
    });

    console.log(
      `📋 Encontrados ${usersResult.rows.length} usuários com role 'terapeuta'`,
    );

    if (usersResult.rows.length === 0) {
      console.log("⚠️ Nenhum usuário com role 'terapeuta' encontrado");
      return;
    }

    // Buscar todos os terapeutas
    const terapeutasResult = await database.query({
      text: "SELECT id, email, nome FROM terapeutas",
    });

    console.log(
      `📋 Encontrados ${terapeutasResult.rows.length} terapeutas cadastrados`,
    );

    let associacoesRealizadas = 0;
    let associacoesJaExistentes = 0;
    let terapeutasSemUser = 0;

    // Para cada terapeuta, tentar encontrar um usuário correspondente
    for (const terapeuta of terapeutasResult.rows) {
      // Verificar se já tem usuário associado
      if (terapeuta.user_id) {
        associacoesJaExistentes++;
        console.log(`✅ Terapeuta ${terapeuta.nome} já tem usuário associado`);
        continue;
      }

      // Buscar usuário com o mesmo email
      const userCorrespondente = usersResult.rows.find(
        (user) => user.email.toLowerCase() === terapeuta.email.toLowerCase(),
      );

      if (userCorrespondente) {
        // Atualizar o terapeuta com o user_id
        await database.query({
          text: "UPDATE terapeutas SET user_id = $1 WHERE id = $2",
          values: [userCorrespondente.id, terapeuta.id],
        });

        associacoesRealizadas++;
        console.log(
          `🔗 Associado: Terapeuta "${terapeuta.nome}" ↔ Usuário "${userCorrespondente.username}"`,
        );
      } else {
        terapeutasSemUser++;
        console.log(
          `⚠️ Terapeuta "${terapeuta.nome}" (${terapeuta.email}) não tem usuário correspondente`,
        );
      }
    }

    console.log("\n📊 Relatório de Associações:");
    console.log(`✅ Associações realizadas: ${associacoesRealizadas}`);
    console.log(`🔄 Associações já existentes: ${associacoesJaExistentes}`);
    console.log(`❌ Terapeutas sem usuário: ${terapeutasSemUser}`);

    if (terapeutasSemUser > 0) {
      console.log("\n💡 Para terapeutas sem usuário correspondente:");
      console.log("1. Crie convites através da interface de 'Convites'");
      console.log("2. Ou associe manualmente usando o email correto");
    }

    console.log("\n✅ Processo de associação concluído!");
  } catch (error) {
    console.error("❌ Erro durante a associação:", error);
    throw error;
  }
}

// Executar apenas se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  associateTerapeutasWithUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default associateTerapeutasWithUsers;
