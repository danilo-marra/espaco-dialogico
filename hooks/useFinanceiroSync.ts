import { useCallback, useEffect } from "react";
import { mutate } from "swr";

/**
 * Hook para sincronização e atualização automática dos dados financeiros
 */
export function useFinanceiroSync() {
  // Função para invalidar todos os dados financeiros
  const invalidateFinanceiro = useCallback(async () => {
    // Invalidar cache do histórico e dados por período
    await mutate(
      (key) => typeof key === "string" && key.includes("/dashboard/financeiro"),
      undefined,
      {
        revalidate: true,
        // Usar optimisticData para transições mais suaves
        optimisticData: undefined,
        rollbackOnError: true,
      },
    );
  }, []);

  // Função para invalidar dados após mudanças em transações (com debounce)
  const invalidateAfterTransacao = useCallback(async () => {
    // Delay menor para responsividade melhor
    setTimeout(async () => {
      await invalidateFinanceiro();
    }, 200);
  }, [invalidateFinanceiro]);

  // Listener para eventos personalizados de atualização
  useEffect(() => {
    const handleTransacaoCreated = () => {
      invalidateAfterTransacao();
    };

    const handleTransacaoUpdated = () => {
      invalidateAfterTransacao();
    };

    const handleTransacaoDeleted = () => {
      invalidateAfterTransacao();
    };

    // Escutar eventos customizados
    window.addEventListener("transacao:created", handleTransacaoCreated);
    window.addEventListener("transacao:updated", handleTransacaoUpdated);
    window.addEventListener("transacao:deleted", handleTransacaoDeleted);

    return () => {
      window.removeEventListener("transacao:created", handleTransacaoCreated);
      window.removeEventListener("transacao:updated", handleTransacaoUpdated);
      window.removeEventListener("transacao:deleted", handleTransacaoDeleted);
    };
  }, [invalidateAfterTransacao]);

  return {
    invalidateFinanceiro,
    invalidateAfterTransacao,
  };
}

/**
 * Função para disparar eventos de atualização
 */
export const emitFinanceiroUpdate = (
  type: "created" | "updated" | "deleted",
) => {
  window.dispatchEvent(new CustomEvent(`transacao:${type}`));
};
