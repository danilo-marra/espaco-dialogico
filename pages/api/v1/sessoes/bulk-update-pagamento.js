import sessao from "models/sessao.js";

export default async function handler(req, res) {
  if (req.method === "PATCH") {
    try {
      const { sessoesIds, pagamentoRealizado } = req.body;

      if (!Array.isArray(sessoesIds) || sessoesIds.length === 0) {
        return res
          .status(400)
          .json({ message: "sessoesIds deve ser um array não vazio." });
      }

      if (typeof pagamentoRealizado !== "boolean") {
        return res
          .status(400)
          .json({ message: "pagamentoRealizado deve ser um booleano." });
      }

      const updatedCount = await sessao.updatePagamentoStatusBatch(
        sessoesIds,
        pagamentoRealizado,
      );

      return res.status(200).json({
        message: `${updatedCount} sessões atualizadas com sucesso.`,
        updatedCount,
      });
    } catch (error) {
      console.error("Erro ao atualizar status de pagamento em lote:", error);
      return res.status(500).json({ message: "Erro interno do servidor." });
    }
  } else {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
