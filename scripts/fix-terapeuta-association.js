/**
 * Script para corrigir manualmente a associação entre usuário e terapeuta
 * quando os emails não coincidem exatamente
 */

const fetch = require("node-fetch");

const BASE_URL = "http://localhost:3000";
const ADMIN_EMAIL = "danilo2311@gmail.com";
const ADMIN_PASSWORD = "AdminPassword2025Secure";

async function fixTerapeutaAssociation() {
  console.log("🔧 CORREÇÃO MANUAL DA ASSOCIAÇÃO TERAPEUTA-USUÁRIO\n");

  try {
    // 1. Login como admin
    console.log("🔑 Fazendo login como admin...");
    const loginResponse = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      throw new Error("Falha no login admin");
    }

    const { token } = await loginResponse.json();
    console.log("✅ Login OK\n");

    // 2. Buscar dados atuais
    console.log("📋 Buscando dados atuais...");
    const [terapeutasResponse, usersResponse] = await Promise.all([
      fetch(`${BASE_URL}/api/v1/terapeutas`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${BASE_URL}/api/v1/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (!terapeutasResponse.ok || !usersResponse.ok) {
      throw new Error("Falha ao buscar dados");
    }

    const terapeutas = await terapeutasResponse.json();
    const users = await usersResponse.json();
    const usuariosTerapeuta = users.filter((u) => u.role === "terapeuta");

    console.log("✅ Dados carregados");
    console.log("📊 Usuários terapeuta:", usuariosTerapeuta.length);
    console.log("📊 Registros terapeutas:", terapeutas.length);

    // 3. Mostrar detalhes para decisão manual
    console.log("\n🔍 ANÁLISE DETALHADA:");
    console.log("\n👥 USUÁRIOS TERAPEUTA:");
    usuariosTerapeuta.forEach((user) => {
      console.log(`  • ID: ${user.id}`);
      console.log(`    Nome: ${user.username}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Role: ${user.role}`);
      console.log("");
    });

    console.log("🏥 REGISTROS DE TERAPEUTAS:");
    terapeutas.forEach((terapeuta) => {
      console.log(`  • ID: ${terapeuta.id}`);
      console.log(`    Nome: ${terapeuta.nome}`);
      console.log(`    Email: ${terapeuta.email}`);
      console.log(`    User ID: ${terapeuta.user_id || "NÃO ASSOCIADO"}`);
      console.log("");
    });

    // 4. Associação manual baseada em correspondência lógica
    // Encontrar o usuário terapeuta (deve haver apenas 1)
    const usuarioTerapeuta = usuariosTerapeuta[0];

    if (!usuarioTerapeuta) {
      console.log("❌ Nenhum usuário com role 'terapeuta' encontrado");
      return;
    }

    // Encontrar o terapeuta mais provável para associar
    // Vamos procurar por nome similar ou usar critério específico
    const terapeutaTarget = terapeutas.find(
      (t) => t.nome.toLowerCase().includes("danilo") && !t.user_id,
    );

    if (!terapeutaTarget) {
      console.log("❌ Nenhum terapeuta adequado encontrado para associação");
      return;
    }

    console.log("\n🔗 REALIZANDO ASSOCIAÇÃO:");
    console.log(
      `👤 Usuário: ${usuarioTerapeuta.username} (${usuarioTerapeuta.email})`,
    );
    console.log(
      `🏥 Terapeuta: ${terapeutaTarget.nome} (${terapeutaTarget.email})`,
    );

    // 5. Atualizar o terapeuta com o user_id
    const updateResponse = await fetch(
      `${BASE_URL}/api/v1/terapeutas/${terapeutaTarget.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...terapeutaTarget,
          user_id: usuarioTerapeuta.id,
        }),
      },
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(
        `Falha na atualização: ${errorData.message || "Erro desconhecido"}`,
      );
    }

    console.log("✅ ASSOCIAÇÃO REALIZADA COM SUCESSO!");
    console.log(
      `🔗 Usuário ${usuarioTerapeuta.username} agora está associado ao terapeuta ${terapeutaTarget.nome}`,
    );

    // 6. Verificar o resultado
    console.log("\n🔍 Verificando resultado...");
    const verifyResponse = await fetch(
      `${BASE_URL}/api/v1/terapeutas/${terapeutaTarget.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (verifyResponse.ok) {
      const updatedTerapeuta = await verifyResponse.json();
      console.log("✅ Verificação OK:");
      console.log(`   Terapeuta: ${updatedTerapeuta.nome}`);
      console.log(`   User ID: ${updatedTerapeuta.user_id}`);
    }
  } catch (error) {
    console.error("❌ Erro na correção:", error.message);
  }
}

fixTerapeutaAssociation();
