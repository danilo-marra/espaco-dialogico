const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
const fetch = require("node-fetch");
const net = require("net");

module.exports = async () => {
  // Carregar .env.test prioritariamente
  const envFile = ".env.test";
  if (fs.existsSync(envFile)) {
    const cfg = dotenv.config({ path: envFile });
    dotenvExpand.expand(cfg);
  }
  process.env.NODE_ENV = "test";
  process.env.JEST_GLOBAL_SETUP = "true";

  // Verificar se a porta do Postgres já está aberta antes de tentar garantir DB
  const pgPort = Number(process.env.POSTGRES_PORT) || 5432;
  const pgHost = process.env.POSTGRES_HOST || "localhost";
  const portOpen = await isPortOpen(pgHost, pgPort, 500);
  if (!portOpen) {
    console.log(
      `🧪 Porta ${pgPort} não responde em ${pgHost}. Subindo docker compose antes de garantir DB...`,
    );
    await spawnCompose();
    // Esperar porta ficar aberta (até 10 tentativas rápidas)
    for (let i = 1; i <= 10; i++) {
      if (await isPortOpen(pgHost, pgPort, 500)) break;
      await wait(500);
      if (i === 10)
        console.warn(
          "⚠️ Porta ainda não abriu, prosseguindo assim mesmo (retries internos do ensure-test-db irão atuar).",
        );
    }
  }

  // Agora garantir DB (com retries internos do script). Se falhar, segunda chance inicia compose (fallback legacy)
  try {
    await runNodeScript("infra/scripts/ensure-test-db.js", envFile);
  } catch (e) {
    console.warn(
      "⚠️ Falha ao garantir DB após compose/porta. Tentando fallback docker compose novamente...",
    );
    await spawnCompose();
    await wait(2000);
    await runNodeScript("infra/scripts/ensure-test-db.js", envFile); // se falhar aqui, deixa propagar
  }
  // Rodar migrações de teste
  console.log("🔄 Executando migrações de teste...");
  await runNodeScript("infra/scripts/run-migrations.mjs", envFile);
  console.log("✅ Migrações executadas com sucesso!");

  // Subir Next somente se não estiver rodando
  const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || 3000;
  const statusUrl = `http://localhost:${port}/api/v1/status`;
  const alreadyUp = await isServerUp(statusUrl);
  if (alreadyUp) {
    return; // Reutiliza instância (ex: quando usando npm run test wrapper)
  }

  console.log("🚀 Iniciando Next.js (modo dev) via npx...");
  const startCommand = "npx";
  const startArgs = ["next", "dev", "-p", String(port)];
  const nextProc = spawn(startCommand, startArgs, {
    env: { ...process.env, NODE_ENV: "test" },
    stdio: ["pipe", "pipe", "pipe"],
    shell: process.platform === "win32",
  });

  const markerPath = path.resolve(".next-test-pid");
  fs.writeFileSync(markerPath, String(nextProc.pid));

  nextProc.stdout.on("data", (d) => {
    const text = d.toString();
    if (text.toLowerCase().includes("ready") || text.includes("started")) {
      // Apenas log silencioso minimamente
      console.log("⚙️ Next output:", text.trim());
    }
  });
  nextProc.stderr.on("data", (d) => {
    console.error("Next STDERR:", d.toString());
  });
  nextProc.on("error", (err) => {
    console.error("❌ Falha ao spawnar Next:", err.message);
  });

  // Esperar readiness /status com progresso
  const maxAttempts = 90; // até 90s
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (await isServerUp(statusUrl)) {
      console.log("✅ Next.js pronto para testes.");
      return;
    }
    if (attempt % 10 === 0) {
      console.log(`⏳ Aguardando Next.js... (${attempt}s)`);
    }
    await wait(1000);
    if (nextProc.exitCode !== null) {
      throw new Error(
        `Processo Next encerrou prematuramente com código ${nextProc.exitCode}`,
      );
    }
  }
  throw new Error(
    "Servidor Next.js não ficou pronto a tempo no globalSetup (timeout).",
  );
};

async function runNodeScript(scriptRelative, envFile) {
  return new Promise((resolve, reject) => {
    const args = [scriptRelative, envFile];
    const proc = spawn(process.execPath, args, {
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "test" },
    });
    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptRelative} saiu com código ${code}`));
    });
  });
}

async function isServerUp(url) {
  try {
    const res = await fetch(url);
    return res.status === 200;
  } catch (_) {
    return false;
  }
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isPortOpen(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;
    const finish = (result) => {
      if (!done) {
        done = true;
        try {
          socket.destroy();
        } catch (_) {
          /* ignore */
        }
        resolve(result);
      }
    };
    socket.setTimeout(timeoutMs);
    socket.once("error", () => finish(false));
    socket.once("timeout", () => finish(false));
    socket.connect(port, host, () => finish(true));
  });
}

async function spawnCompose() {
  return new Promise((resolve, reject) => {
    const args = ["compose", "-f", "infra/compose.yaml", "up", "-d"];
    const proc = spawn(
      process.platform === "win32" ? "docker" : "docker",
      args,
      { stdio: "inherit" },
    );
    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error("docker compose up falhou com código " + code));
    });
  });
}
