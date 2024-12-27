import database from "infra/database.js";

async function terapeutasHandler(req, res) {
  if (req.method === "GET") {
    try {
      const result = await database.query(
        'SELECT * FROM terapeutas ORDER BY "nomeTerapeuta" ASC;',
      );
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Database Error:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default terapeutasHandler;
