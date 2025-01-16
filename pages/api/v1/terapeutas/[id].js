import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import database from "infra/database.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Add formatField function from index.js
function formatField(value) {
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

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "DELETE") {
    try {
      // Get current terapeuta to delete photo if exists
      const currentTerapeuta = await database.query({
        text: "SELECT foto FROM terapeutas WHERE id = $1",
        values: [id],
      });

      if (currentTerapeuta.rows.length === 0) {
        return res.status(404).json({ error: "Terapeuta não encontrado" });
      }

      // Delete photo file if exists
      if (currentTerapeuta.rows[0].foto) {
        const photoPath = path.join(
          process.cwd(),
          "public",
          currentTerapeuta.rows[0].foto,
        );
        if (fs.existsSync(photoPath)) {
          fs.unlinkSync(photoPath);
        }
      }

      // Delete from database
      const result = await database.query({
        text: "DELETE FROM terapeutas WHERE id = $1 RETURNING id",
        values: [id],
      });

      res.status(200).json({ id: result.rows[0].id });
    } catch (error) {
      console.error("Delete Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else if (req.method === "PUT") {
    const form = new IncomingForm({
      uploadDir: path.join(process.cwd(), "/public/uploads"),
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024,
      multiples: false,
    });

    // eslint-disable-next-line no-undef
    await new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Formidable Error:", err.message);
          res.status(500).json({ error: "Internal Server Error" });
          return reject(err);
        }

        // Get current terapeuta
        const currentTerapeuta = await database.query({
          text: "SELECT * FROM terapeutas WHERE id = $1",
          values: [id],
        });

        if (currentTerapeuta.rows.length === 0) {
          res.status(404).json({ error: "Terapeuta não encontrado" });
          return reject(new Error("Terapeuta não encontrado"));
        }

        // Format fields using formatField function
        const formattedFields = {
          nomeTerapeuta: formatField(fields.nomeTerapeuta),
          telefoneTerapeuta: formatField(fields.telefoneTerapeuta),
          emailTerapeuta: formatField(fields.emailTerapeuta),
          enderecoTerapeuta: formatField(fields.enderecoTerapeuta),
          dtEntrada: fields.dtEntrada,
          chavePix: formatField(fields.chavePix),
        };

        // Handle photo update
        let fotoPath = currentTerapeuta.rows[0].foto;
        if (files.foto) {
          const file = Array.isArray(files.foto) ? files.foto[0] : files.foto;
          const fileExtension = path.extname(file.originalFilename);
          const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif"];

          if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
            res.status(400).json({ error: "Tipo de arquivo não permitido" });
            return reject(new Error("Tipo de arquivo não permitido"));
          }

          // Delete old photo if exists
          if (currentTerapeuta.rows[0].foto) {
            const oldPhotoPath = path.join(
              process.cwd(),
              "public",
              currentTerapeuta.rows[0].foto,
            );
            if (fs.existsSync(oldPhotoPath)) {
              fs.unlinkSync(oldPhotoPath);
            }
          }

          const newFilename = `${Date.now()}-${file.originalFilename}`;
          const newPath = path.join(form.uploadDir, newFilename);

          try {
            fs.renameSync(file.filepath, newPath);
            fotoPath = `/uploads/${newFilename}`;
          } catch (fileError) {
            console.error("File Move Error:", fileError.message);
            res.status(500).json({ error: "Erro ao salvar a foto" });
            return reject(fileError);
          }
        }

        // Update database
        try {
          const queryObject = {
            text: `
              UPDATE terapeutas 
              SET "nomeTerapeuta" = $1,
                  "foto" = $2,
                  "telefoneTerapeuta" = $3,
                  "emailTerapeuta" = $4,
                  "enderecoTerapeuta" = $5,
                  "dtEntrada" = $6,
                  "chavePix" = $7
              WHERE id = $8
              RETURNING *;
            `,
            values: [
              formattedFields.nomeTerapeuta,
              fotoPath,
              formattedFields.telefoneTerapeuta,
              formattedFields.emailTerapeuta,
              formattedFields.enderecoTerapeuta,
              new Date(formattedFields.dtEntrada),
              formattedFields.chavePix,
              id,
            ],
          };

          const result = await database.query(queryObject);
          res.status(200).json(result.rows[0]);
          resolve();
        } catch (dbError) {
          console.error("Database Update Error:", dbError.message);
          res.status(500).json({ error: "Internal Server Error" });
          reject(dbError);
        }
      });
    });
  } else {
    res.setHeader("Allow", ["DELETE", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
