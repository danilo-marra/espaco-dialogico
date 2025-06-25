/**
 * Script para associar automaticamente terapeutas e usuários por email
 */

const fetch = require("node-fetch");

const BASE_URL = "http://localhost:3000";
const ADMIN_EMAIL = "danilo2311@gmail.com";
const ADMIN_PASSWORD = "AdminPassword2025Secure";

async function associateTerapeutasAndUsers() {
  console.log("🔗 ASSOCIAÇÃO AUTOMÁTICA DE TERAPEUTAS E USUÁRIOS\n");

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

    console.log("✅ Dados carregados\n");

    // 3. Encontrar correspondências
    console.log("🔍 Identificando correspondências por email...");
    const correspondencias = [];

    terapeutas
      .filter((t) => !t.user_id) // Apenas terapeutas sem usuário associado
      .forEach((terapeuta) => {
        const usuarioCorrespondente = usuariosTerapeuta.find(
          (u) => u.email.toLowerCase() === terapeuta.email.toLowerCase(),
        );

        if (usuarioCorrespondente) {
          // Verificar se o usuário já não está associado a outro terapeuta
          const jaAssociado = terapeutas.some(
            (t) => t.user_id === usuarioCorrespondente.id,
          );

          if (!jaAssociado) {
            correspondencias.push({
              terapeuta,
              usuario: usuarioCorrespondente,
            });
          }
        }
      });

    console.log(`✅ ${correspondencias.length} correspondências encontradas\n`);

    if (correspondencias.length === 0) {
      console.log("ℹ️  Nenhuma correspondência para associar.");
      return;
    }

    // 4. Realizar associações
    console.log("🔗 Iniciando associações...\n");

    for (const { terapeuta, usuario } of correspondencias) {
      console.log(
        `🔄 Associando: "${terapeuta.nome}" ↔ "${usuario.username}"`,
      );
      console.log(`   Email: ${terapeuta.email}`);
      console.log(`   Terapeuta ID: ${terapeuta.id}`);
      console.log(`   Usuário ID: ${usuario.id}`);

      try {
        // Fazer a associação via API (se existir) ou diretamente no banco
        // Vou usar uma requisição PUT para atualizar o terapeuta
        const updateResponse = await fetch(
          `${BASE_URL}/api/v1/terapeutas/${terapeuta.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              user_id: usuario.id,
              // Incluir outros campos necessários para evitar erro de validação
              nome: terapeuta.nome,
              email: terapeuta.email,
              telefone: terapeuta.telefone,
              endereco: terapeuta.endereco,
              dt_entrada: terapeuta.dt_entrada,
              chave_pix: terapeuta.chave_pix,
            }),
          },
        );

        if (updateResponse.ok) {
          console.log("   ✅ Associação realizada com sucesso!");
        } else {
          const errorText = await updateResponse.text();
          console.log(`   ❌ Falha na associação: ${errorText}`);

          // Tentar método alternativo via FormData se o endpoint esperar formulário
          console.log("   🔄 Tentando método alternativo...");

          const FormData = require("form-data");
          const form = new FormData();
          form.append("nome", terapeuta.nome);
          form.append("email", terapeuta.email);
          form.append("telefone", terapeuta.telefone);
          form.append("endereco", terapeuta.endereco);
          form.append("dt_entrada", terapeuta.dt_entrada);
          form.append("chave_pix", terapeuta.chave_pix);
          form.append("user_id", usuario.id);

          const formUpdateResponse = await fetch(
            `${BASE_URL}/api/v1/terapeutas/${terapeuta.id}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                ...form.getHeaders(),
              },
              body: form,
            },
          );

          if (formUpdateResponse.ok) {
            console.log("   ✅ Associação realizada com método alternativo!");
          } else {
            const formErrorText = await formUpdateResponse.text();
            console.log(
              `   ❌ Falha também no método alternativo: ${formErrorText}`,
            );
          }
        }
      } catch (error) {
        console.log(`   ❌ Erro na associação: ${error.message}`);
      }

      console.log();
    }

    // 5. Verificar resultado
    console.log("🔍 Verificando resultado...");
    const finalTerapeutasResponse = await fetch(
      `${BASE_URL}/api/v1/terapeutas`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (finalTerapeutasResponse.ok) {
      const finalTerapeutas = await finalTerapeutasResponse.json();
      const terapeutasComUser = finalTerapeutas.filter((t) => t.user_id);

      console.log(
        `✅ Resultado final: ${terapeutasComUser.length} terapeutas com usuários associados`,
      );

      terapeutasComUser.forEach((t) => {
        const usuario = users.find((u) => u.id === t.user_id);
        console.log(
          `   🔗 ${t.nome} ↔ ${usuario ? usuario.username : "Usuário não encontrado"}`,
        );
      });
    }

    console.log("\n🎉 Processo de associação concluído!");
  } catch (error) {
    console.error("❌ Erro no processo de associação:", error.message);
  }
}

associateTerapeutasAndUsers().catch(console.error);
