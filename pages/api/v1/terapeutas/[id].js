import { IncomingForm } from "formidable";
import database from "infra/database.js";
import { uploadToCloudinary } from "utils/cloudnary-config";

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
      const result = await database.query({
        text: "DELETE FROM terapeutas WHERE id = $1 RETURNING id",
        values: [id],
      });
      // No need to delete file from Cloudinary
      res.status(200).json({ id: result.rows[0].id });
    } catch (error) {
      console.error("Delete Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else if (req.method === "PUT") {
    const form = new IncomingForm();

    // eslint-disable-next-line no-undef
    await new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
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
        let fotoUrl = currentTerapeuta.rows[0].foto; // Keep existing photo by default
        if (files.foto) {
          const file = Array.isArray(files.foto) ? files.foto[0] : files.foto;
          try {
            fotoUrl = await uploadToCloudinary(file);
            console.log("New photo URL:", fotoUrl);
          } catch (error) {
            console.error("Cloudinary Upload Error:", error);
            res.status(500).json({ error: "Error uploading image" });
            return reject(error);
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
              fotoUrl,
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
