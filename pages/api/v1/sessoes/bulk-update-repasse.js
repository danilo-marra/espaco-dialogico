import sessao from "models/sessao.js";

export default async function handler(req, res) {
  if (req.method === "PATCH") {
    try {
      const { sessoesIds, repasseRealizado } = req.body;

      if (!Array.isArray(sessoesIds) || sessoesIds.length === 0) {
        return res
          .status(400)
          .json({ message: "sessoesIds deve ser um array não vazio." });
      }

      if (typeof repasseRealizado !== "boolean") {
        return res
          .status(400)
          .json({ message: "repasseRealizado deve ser um booleano." });
      }

      const updatedCount = await sessao.updateRepasseStatusBatch(
        sessoesIds,
        repasseRealizado,
      );

      res.status(200).json({
        message: `${updatedCount} sessões atualizadas com sucesso.`,
        updatedCount,
      });
    } catch (error) {
      console.error("Erro ao atualizar status de repasse em lote:", error);
      return res.status(500).json({ message: "Erro interno do servidor." });
    }
  } else {
    res.setHeader("Allow", ["PATCH"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
