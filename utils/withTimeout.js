// Middleware para adicionar timeout personalizado e logs de performance
export function withTimeout(handler, timeoutMs = 25000) {
  return async (req, res) => {
    const startTime = Date.now();

    // Configurar timeout personalizado
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      // Executar o handler com timeout
      await Promise.race([handler(req, res), timeoutPromise]);

      const duration = Date.now() - startTime;
      console.log(`Request completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error.message?.includes("timeout")) {
        console.error(`Request timeout after ${duration}ms`);

        if (!res.headersSent) {
          return res.status(504).json({
            error: "Gateway Timeout",
            message: `Request took too long to complete (${duration}ms)`,
            timeout: `${timeoutMs}ms`,
          });
        }
      } else {
        console.error(`Request failed after ${duration}ms:`, error);

        if (!res.headersSent) {
          return res.status(500).json({
            error: "Internal Server Error",
            message: error.message,
            duration: `${duration}ms`,
          });
        }
      }

      throw error;
    }
  };
}

export default withTimeout;
