import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import database from "infra/database.js";

function formatField(value) {
  // If value is an array, get first element
  if (Array.isArray(value)) {
    return value[0];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "string") {
        return parsed;
      }
      if (parsed && typeof parsed.value === "string") {
        return parsed.value;
      }
    } catch (e) {
      return value;
    }
  }
  return value;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

async function terapeutasHandler(req, res) {
  if (req.method === "GET") {
    try {
      const queryObject = {
        text: 'SELECT * FROM terapeutas ORDER BY "nomeTerapeuta" ASC;',
        values: [],
      };
      const result = await database.query(queryObject);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Database Error:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else if (req.method === "POST") {
    const form = new IncomingForm({
      uploadDir: path.join(process.cwd(), "/public/uploads"),
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // Limite de 5MB
      multiples: false, // Certifique-se de que apenas um arquivo é aceito
    });

    // eslint-disable-next-line no-undef
    await new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Formidable Error:", err.message);
          res.status(500).json({ error: "Internal Server Error" });
          return reject(err);
        }

        // Format fields before processing
        const formattedFields = {
          nomeTerapeuta: formatField(fields.nomeTerapeuta),
          telefoneTerapeuta: formatField(fields.telefoneTerapeuta),
          emailTerapeuta: formatField(fields.emailTerapeuta),
          enderecoTerapeuta: formatField(fields.enderecoTerapeuta),
          dtEntrada: fields.dtEntrada,
          chavePix: formatField(fields.chavePix),
        };

        // Validação básica
        if (
          !formattedFields.nomeTerapeuta ||
          !formattedFields.telefoneTerapeuta ||
          !formattedFields.emailTerapeuta ||
          !formattedFields.enderecoTerapeuta ||
          !formattedFields.dtEntrada ||
          !formattedFields.chavePix
        ) {
          res.status(400).json({
            error: "Todos os campos obrigatórios devem ser preenchidos.",
          });
          return reject(new Error("Campos obrigatórios faltando"));
        }

        // Opcional: Validar o formato da data
        const dataEntrada = new Date(formattedFields.dtEntrada);
        if (isNaN(dataEntrada.getTime())) {
          res.status(400).json({ error: "Data de entrada inválida." });
          return reject(new Error("Data de entrada inválida"));
        }

        // Processar arquivo de foto
        let fotoPath = null;
        if (files.foto) {
          const file = Array.isArray(files.foto) ? files.foto[0] : files.foto; // Garantir que é um único arquivo
          const fileExtension = path.extname(file.originalFilename);
          const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif"];
          if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
            res.status(400).json({ error: "Tipo de arquivo não permitido." });
            return reject(new Error("Tipo de arquivo não permitido"));
          }

          const newFilename = `${Date.now()}-${file.originalFilename}`;
          const newPath = path.join(form.uploadDir, newFilename);

          try {
            fs.renameSync(file.filepath, newPath);
            fotoPath = `/uploads/${newFilename}`;
          } catch (fileError) {
            console.error("File Move Error:", fileError.message);
            res.status(500).json({ error: "Erro ao salvar a foto." });
            return reject(fileError);
          }
        }

        // Inserir no banco de dados
        try {
          const queryObject = {
            text: `
              INSERT INTO terapeutas (
                "nomeTerapeuta",
                "foto",
                "telefoneTerapeuta",
                "emailTerapeuta",
                "enderecoTerapeuta",
                "dtEntrada",
                "chavePix"
              ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
            `,
            values: [
              formattedFields.nomeTerapeuta,
              fotoPath,
              formattedFields.telefoneTerapeuta,
              formattedFields.emailTerapeuta,
              formattedFields.enderecoTerapeuta,
              new Date(formattedFields.dtEntrada),
              formattedFields.chavePix,
            ],
          };

          const result = await database.query(queryObject);
          res.status(201).json(result.rows[0]);
          resolve();
        } catch (dbError) {
          console.error("Database Insert Error:", dbError.message);
          res.status(500).json({ error: "Internal Server Error" });
          reject(dbError);
        }
      });
    });
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default terapeutasHandler;
