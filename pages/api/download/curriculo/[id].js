// API endpoint para download de currículos com nome correto
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "ID do terapeuta é obrigatório" });
  }

  try {
    // Buscar o terapeuta no banco para pegar a URL do currículo
    const database = require("../../../../infra/database.js");

    const queryObject = {
      text: `
        SELECT nome, curriculo_arquivo 
        FROM terapeutas 
        WHERE id = $1
      `,
      values: [id],
    };

    const result = await database.query(queryObject);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Terapeuta não encontrado" });
    }

    const terapeuta = result.rows[0];

    if (!terapeuta.curriculo_arquivo) {
      return res.status(404).json({ error: "Currículo não encontrado" });
    }

    // Fazer fetch do arquivo do Cloudinary
    const cloudinaryResponse = await fetch(terapeuta.curriculo_arquivo);

    if (!cloudinaryResponse.ok) {
      throw new Error("Erro ao baixar arquivo do Cloudinary");
    }

    // Obter o buffer do arquivo
    const fileBuffer = await cloudinaryResponse.arrayBuffer();

    // Gerar nome do arquivo baseado no nome do terapeuta
    const nomeArquivo = `curriculo_${terapeuta.nome.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

    // Definir headers para forçar download com nome correto
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nomeArquivo}"`,
    );
    res.setHeader("Content-Length", fileBuffer.byteLength);

    // Enviar o arquivo
    res.status(200).send(Buffer.from(fileBuffer));
  } catch (error) {
    console.error("Erro ao fazer download do currículo:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}
