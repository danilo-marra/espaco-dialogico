import { spawn } from "child_process";

let globalNextProcess = null;
let serverOwner = null;

// Função para verificar se o servidor já está rodando
async function isServerRunning(port = 3000, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Criar um AbortController para timeout manual
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`http://localhost:${port}/api/v1/status`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Servidor não está rodando ou não respondeu
    }

    // Aguardar um pouco antes de tentar novamente
    if (i < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return false;
}

// Função para iniciar o servidor apenas se necessário
export async function ensureServerRunning(testName, port = 3000) {
  const isRunning = await isServerRunning(port);

  if (isRunning) {
    console.log(`🔄 Servidor já está rodando para ${testName}`);
    return null; // Não precisamos gerenciar o processo
  }

  console.log(`🚀 Iniciando servidor para ${testName}`);
  globalNextProcess = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    shell: true,
  });

  serverOwner = testName;

  // Aguardar o servidor ficar disponível
  let retries = 0;
  const maxRetries = 30;

  while (retries < maxRetries) {
    const running = await isServerRunning(port, 1);
    if (running) {
      console.log(`✅ Servidor pronto para ${testName}`);
      return globalNextProcess;
    }

    retries++;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `Falha ao iniciar servidor para ${testName} após ${maxRetries} tentativas`,
  );
}

// Função para limpar o servidor apenas se fomos nós que iniciamos
export function cleanupServer(testName) {
  if (globalNextProcess && serverOwner === testName) {
    console.log(`🛑 Parando servidor iniciado por ${testName}`);

    try {
      // No Windows, usar taskkill para garantir que o processo seja morto
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", globalNextProcess.pid, "/f", "/t"], {
          shell: true,
        });
      } else {
        globalNextProcess.kill("SIGTERM");

        // Se não morrer em 5 segundos, forçar
        setTimeout(() => {
          if (globalNextProcess && !globalNextProcess.killed) {
            globalNextProcess.kill("SIGKILL");
          }
        }, 5000);
      }
    } catch (error) {
      console.error(`Erro ao parar servidor:`, error);
    }

    globalNextProcess = null;
    serverOwner = null;
  } else if (globalNextProcess) {
    console.log(
      `⚠️  Servidor será mantido (iniciado por ${serverOwner}, solicitado por ${testName})`,
    );
  } else {
    console.log(`ℹ️  Servidor externo mantido para ${testName}`);
  }
}

// Função para aguardar que o servidor esteja pronto
export async function waitForServerReady(port = 3000) {
  const isRunning = await isServerRunning(port, 15);
  if (!isRunning) {
    throw new Error("Servidor não está disponível após aguardar");
  }
}
