const { exec } = require("node:child_process");

function checkPostgres(retries = 10, delay = 5000) {
  if (retries === 0) {
    console.error("\n🔴 Postgres is not ready after multiple attempts.\n");
    process.exit(1);
  }

  exec(
    "docker exec postgres-dev pg_isready --host localhost",
    (error, stdout) => {
      if (stdout.search("accepting connections") === -1) {
        console.log(
          `Attempt ${11 - retries}: Postgres is not ready, retrying in ${delay / 1000} seconds...`,
        );
        setTimeout(() => checkPostgres(retries - 1, delay), delay);
      } else {
        console.log("\n🟢 Postgres is ready for connections!\n");
      }
    },
  );
}

console.log("\n\n🔴 Waiting for Postgres to be ready...");
checkPostgres();
