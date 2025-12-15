import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import { createInvite } from "tests/helpers/auth.js";
import {
  ensureServerRunning,
  cleanupServer,
  waitForServerReady,
} from "tests/helpers/serverManager.js";

// Use environment variables for port configuration
const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;

const TEST_NAME = "POST /api/v1/users";

beforeAll(async () => {
  // Garantir que o servidor está rodando (inicia apenas se necessário)
  await ensureServerRunning(TEST_NAME, port);

  await orchestrator.waitForAllServices();
  await waitForServerReady(port);
  await orchestrator.clearDatabase();
});

afterAll(() => {
  // Limpar apenas se fomos nós que iniciamos o servidor
  cleanupServer(TEST_NAME);
});

describe("POST /api/v1/users", () => {
  // Primeiro teste: criar usuário com código de convite válido
  test("Creating user with valid invite code", async () => {
    // Criar um convite válido para o teste
    const invite = await createInvite();

    const response = await fetch(`http://localhost:${port}/api/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "test_user",
        email: "test@example.com",
        password: "senha123",
        inviteCode: invite.code,
      }),
    });

    // Exibir resposta em caso de falha para depuração
    if (response.status !== 201) {
      console.error("Erro na criação do usuário:", await response.json());
    }

    expect(response.status).toBe(201); // created

    const responseBody = await response.json();

    expect(responseBody).toEqual({
      id: responseBody.id,
      username: "test_user",
      email: "test@example.com",
      role: "terapeuta", // Deveria receber a role do convite (terapeuta)
      token_version: 0, // Valor padrão para novos usuários
      created_at: responseBody.created_at,
      updated_at: responseBody.updated_at,
    });

    expect(responseBody.password).toBeUndefined();
    expect(uuidVersion(responseBody.id)).toBe(4);
    expect(Date.parse(responseBody.created_at)).not.toBeNaN();
    expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
  });

  test("Creating user with different role with invite code", async () => {
    // Criar um convite para secretaria
    const invite = await createInvite(null, "secretaria");

    // Usar o convite para criar um usuário
    const response = await fetch(`http://localhost:${port}/api/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "secretaria_user",
        email: "secretaria@example.com",
        password: "senha123",
        inviteCode: invite.code,
      }),
    });

    expect(response.status).toBe(201);

    const responseBody = await response.json();
    expect(responseBody.role).toBe("secretaria");
    expect(responseBody.username).toBe("secretaria_user");
    expect(responseBody.password).toBeUndefined();
  });

  test("With invalid invite code", async () => {
    const response = await fetch(`http://localhost:${port}/api/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "invalid_invite_user",
        email: "invalid_invite@example.com",
        password: "senha123",
        inviteCode: "invalid-code-12345",
      }),
    });

    expect(response.status).toBe(400);

    const responseBody = await response.json();
    // Usar o formato correto da resposta de erro
    expect(responseBody).toEqual({
      error: "Código de convite inválido",
      action: "Por favor, verifique o código ou solicite um novo.",
    });
  });

  test("With duplicated email", async () => {
    // Criar um novo convite válido para este teste
    const invite = await createInvite();

    // Tentar criar um usuário com email duplicado
    const response = await fetch(`http://localhost:${port}/api/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "duplicate_user",
        email: "test@example.com", // Email já usado no primeiro teste
        password: "senha123",
        inviteCode: invite.code,
      }),
    });

    expect(response.status).toBe(400);

    const responseBody = await response.json();
    console.log("Erro de email duplicado:", responseBody);

    // Verificar o formato correto do erro retornado pela API
    expect(responseBody).toHaveProperty("name", "ValidationError");
    expect(responseBody).toHaveProperty("message");
    expect(responseBody.message.toLowerCase()).toContain("email");
    expect(responseBody).toHaveProperty("action");
    expect(responseBody).toHaveProperty("status_code", 400);
  });
});
