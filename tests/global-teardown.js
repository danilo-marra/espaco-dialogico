const fs = require("fs");
const { spawn } = require("child_process");

module.exports = async () => {
  // Tentar encerrar intervalos / caches se carregados
  try {
    // Import dinâmico para evitar exigir em caminhos onde não foi usado
    const financeiro = require("../models/financeiroOtimizado.js");
    if (financeiro && typeof financeiro.shutdown === "function") {
      financeiro.shutdown();
    }
  } catch (_) {
    /* ignore */
  }

  const markerPath = ".next-test-pid";
  if (fs.existsSync(markerPath)) {
    const pid = Number(fs.readFileSync(markerPath, "utf8"));
    fs.unlinkSync(markerPath);
    await killProcessTree(pid, 5000);
  }
};

function killProcessTree(pid, timeoutMs) {
  return new Promise((resolve) => {
    if (process.platform === "win32") {
      // taskkill para encerrar árvore (suprime output)
      const proc = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
        stdio: "ignore",
      });
      const timer = setTimeout(() => resolve(), timeoutMs);
      proc.on("exit", () => {
        clearTimeout(timer);
        resolve();
      });
    } else {
      try {
        process.kill(pid, "SIGTERM");
      } catch (_) {
        /* ignore */
      }
      const start = Date.now();
      const check = () => {
        try {
          process.kill(pid, 0); // ainda existe
          if (Date.now() - start > timeoutMs) return resolve();
          setTimeout(check, 250);
        } catch (_) {
          return resolve();
        }
      };
      check();
    }
  });
}
