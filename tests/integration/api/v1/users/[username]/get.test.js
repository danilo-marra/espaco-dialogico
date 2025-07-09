import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import {
  ensureDevAdminExists,
  prepareAuthentication,
  createInvite,
} from "tests/helpers/auth.js";
import {
  ensureServerRunning,
  cleanupServer,
  waitForServerReady,
} from "tests/helpers/serverManager.js";

// Use environment variables for port configuration
const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

const TEST_NAME = "GET /api/v1/users/[username]";

describe("GET /api/v1/users/[username]", () => {
  let authToken;

  beforeAll(async () => {
    // Garantir que o servidor está rodando (inicia apenas se necessário)
    await ensureServerRunning(TEST_NAME, port);

    await orchestrator.waitForAllServices();
    await waitForServerReady(port);

    // Verificar se o admin das variáveis de ambiente já existe
    await ensureDevAdminExists();

    // Obter token de autenticação para os testes usando função utilitária
    authToken = await prepareAuthentication(port);

    if (!authToken) {
      console.error("Falha ao obter token de autenticação");
    }
  });

  afterAll(() => {
    // Limpar apenas se fomos nós que iniciamos o servidor
    cleanupServer(TEST_NAME);
  });

  describe("Logged User", () => {
    // O primeiro teste deve verificar se temos um token válido antes de continuar
    test("Authentication setup is successful", async () => {
      // Verificar se temos um token válido
      expect(authToken).toBeTruthy();
    });

    test("With exact case match", async () => {
      // Criar um convite válido para o teste
      const invite = await createInvite();
      const timestamp = Date.now();

      // Criar um usuário para testar a busca (SEM autenticação - usuários se auto-registram com convite)
      const response1 = await fetch(`http://localhost:${port}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: `MesmoCase${timestamp}`,
          email: `user${timestamp}@example.com`,
          password: "Senha@123",
          inviteCode: invite.code,
        }),
      });

      // Se o teste falhar, vamos ver qual foi o erro
      if (response1.status !== 201) {
        const errorBody = await response1.json();
        console.error("Erro ao criar usuário:", errorBody);
        console.error("Status:", response1.status);
        console.error("Dados enviados:", {
          username: `MesmoCase${timestamp}`,
          email: `user${timestamp}@example.com`,
          password: "Senha@123",
          inviteCode: invite.code,
        });

        // Falhar o teste com informação de debug
        throw new Error(`Falha ao criar usuário: ${JSON.stringify(errorBody)}`);
      }

      expect(response1.status).toBe(201); // created

      // Buscar o usuário criado com autenticação
      const response2 = await fetch(
        `http://localhost:${port}/api/v1/users/MesmoCase${timestamp}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      expect(response2.status).toBe(200); // ok

      const response2Body = await response2.json();

      // Verificar que o usuário é retornado sem a senha
      expect(response2Body).toEqual({
        id: response2Body.id,
        username: `MesmoCase${timestamp}`,
        email: `user${timestamp}@example.com`,
        role: "terapeuta", // Verificando o role padrão
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      // Verificar explicitamente que a senha não está presente
      expect(response2Body.password).toBeUndefined();

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });

    test("With case mismatch", async () => {
      // Criar um convite válido para o teste
      const invite = await createInvite();
      const timestamp = Date.now();

      // Criar um usuário para testar a busca com case diferente (SEM autenticação)
      const response1 = await fetch(`http://localhost:${port}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: `CaseDiferente${timestamp}`,
          email: `casediff${timestamp}@example.com`,
          password: "Senha@123",
          inviteCode: invite.code,
        }),
      });

      // Se o teste falhar, vamos ver qual foi o erro
      if (response1.status !== 201) {
        const errorBody = await response1.json();
        console.error("Erro ao criar usuário case diferente:", errorBody);
        throw new Error(`Falha ao criar usuário: ${JSON.stringify(errorBody)}`);
      }

      expect(response1.status).toBe(201); // created

      // Buscar o usuário com case diferente
      const response2 = await fetch(
        `http://localhost:${port}/api/v1/users/casediferente${timestamp}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      expect(response2.status).toBe(200); // ok

      const response2Body = await response2.json();

      // Verificar que o usuário é retornado sem a senha
      expect(response2Body).toEqual({
        id: response2Body.id,
        username: `CaseDiferente${timestamp}`,
        email: `casediff${timestamp}@example.com`,
        role: "terapeuta", // Verificando o role padrão
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      // Verificar explicitamente que a senha não está presente
      expect(response2Body.password).toBeUndefined();

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });

    test("With username not found", async () => {
      // Testar busca de usuário inexistente
      const response = await fetch(
        `http://localhost:${port}/api/v1/users/UsuarioInexistente`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      expect(response.status).toBe(404); // not found

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "Usuário não encontrado.",
        action: "Verifique se o username informado está correto.",
        status_code: 404,
      });
    });
  });
});
