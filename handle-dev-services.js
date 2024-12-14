const { spawn } = require("child_process");
const { Promise } = require("node:globals");
// Helper function to run a command
const runCommand = (command, args) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { stdio: "inherit", shell: true });
    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `${command} ${args.join(" ")} failed with exit code ${code}`,
          ),
        );
      }
    });
  });
};
(async () => {
  console.log("testing handle-dev-services.js ...");
  try {
    console.log("Starting dev enviornment...");
    const nextProcess = spawn("npm", ["run", "dev"], {
      stdio: "inherit",
      shell: true,
    });
    // clean_db_services function to stop the database svc
    const clean_db_services = async () => {
      console.log("\nStopping PostgreSQL database...");
      try {
        await runCommand("npm", ["run", "services:down"]);
        console.log("Database containers down and removed.");
      } catch (err) {
        console.error("Error stopping database:", err.message);
      }
      process.exit(0);
    };
    // Handle process interruption signals
    process.on("SIGINT", clean_db_services); // Handle Ctrl+C
    process.on("SIGTERM", clean_db_services); // Handle termination signals
    // Handle Next.js process exit
    nextProcess.on("exit", async (code) => {
      console.log(`Next.js development server exited with code ${code}.`);
      await clean_db_services();
      process.exit(0);
    });
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
