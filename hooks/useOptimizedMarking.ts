/**
 * Hook para gerenciar marcações de agendamento com performance otimizada
 * Implementa debounce, batch processing e feedback visual
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "store/store";
import { updateAgendamento } from "store/agendamentosSlice";
import {
  markSessaoRealizada,
  markFalta,
  markStatus,
  forceProcessPendingOperations,
  clearPendingOperations,
  getPendingOperationsCount,
} from "utils/batchMarking";
import { toast } from "react-toastify";

interface UseOptimizedMarkingProps {
  onSuccess?: () => void;
  enableBatchMode?: boolean;
  autoProcessDelay?: number;
}

interface MarkingState {
  loading: boolean;
  pendingCount: number;
  lastProcessTime: number | null;
  errors: string[];
}

export function useOptimizedMarking({
  onSuccess,
  enableBatchMode = true,
  autoProcessDelay = 2000, // Auto-processar após 2s de inatividade
}: UseOptimizedMarkingProps = {}) {
  const dispatch = useDispatch<AppDispatch>();

  const [state, setState] = useState<MarkingState>({
    loading: false,
    pendingCount: 0,
    lastProcessTime: null,
    errors: [],
  });

  const autoProcessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Atualizar contagem de operações pendentes
  const updatePendingCount = useCallback(() => {
    const count = getPendingOperationsCount();
    setState((prev) => ({ ...prev, pendingCount: count }));
  }, []);

  // Processar operações pendentes manualmente
  const processOperations = useCallback(async () => {
    const pendingCount = getPendingOperationsCount();

    if (pendingCount === 0) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, errors: [] }));

    try {
      const result = await forceProcessPendingOperations();

      setState((prev) => ({
        ...prev,
        loading: false,
        pendingCount: 0,
        lastProcessTime: Date.now(),
        errors: result.errors || [],
      }));

      if (result.success) {
        toast.success(
          `${result.processedCount} marcação${result.processedCount > 1 ? "ões" : ""} processada${result.processedCount > 1 ? "s" : ""} com sucesso`,
          { position: "bottom-right" },
        );

        onSuccess?.();
      } else {
        toast.warning(
          `${result.processedCount} operações processadas, ${result.errors?.length || 0} com erro`,
          { position: "bottom-right" },
        );
      }
    } catch (error) {
      console.error("Erro ao processar operações:", error);

      setState((prev) => ({
        ...prev,
        loading: false,
        errors: [error.message || "Erro desconhecido"],
      }));

      toast.error("Erro ao processar marcações");
    }
  }, [onSuccess]);

  // Auto-processar operações pendentes após período de inatividade
  const scheduleAutoProcess = useCallback(() => {
    if (autoProcessTimeoutRef.current) {
      clearTimeout(autoProcessTimeoutRef.current);
    }

    autoProcessTimeoutRef.current = setTimeout(async () => {
      if (getPendingOperationsCount() > 0) {
        console.log("🔄 Auto-processando operações pendentes...");
        await processOperations();
      }
    }, autoProcessDelay);
  }, [autoProcessDelay, processOperations]);

  // Marcar sessão realizada
  const markSessionRealizada = useCallback(
    async (
      agendamentoId: string,
      value: boolean,
      immediate: boolean = false,
    ) => {
      if (enableBatchMode && !immediate) {
        markSessaoRealizada(agendamentoId, value);
        updatePendingCount();
        scheduleAutoProcess();
      } else {
        // Processamento imediato usando Redux
        setState((prev) => ({ ...prev, loading: true }));

        try {
          await dispatch(
            updateAgendamento({
              id: agendamentoId,
              agendamento: { sessaoRealizada: value },
            }),
          ).unwrap();

          toast.success(
            value
              ? "Sessão marcada como realizada"
              : "Marcação de sessão removida",
          );

          onSuccess?.();
        } catch (error) {
          toast.error("Erro ao atualizar sessão");
          console.error("Erro ao marcar sessão:", error);
        } finally {
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    },
    [
      dispatch,
      enableBatchMode,
      onSuccess,
      updatePendingCount,
      scheduleAutoProcess,
    ],
  );

  // Marcar falta
  const markSessionFalta = useCallback(
    async (
      agendamentoId: string,
      value: boolean,
      immediate: boolean = false,
    ) => {
      if (enableBatchMode && !immediate) {
        markFalta(agendamentoId, value);
        updatePendingCount();
        scheduleAutoProcess();
      } else {
        // Processamento imediato usando Redux
        setState((prev) => ({ ...prev, loading: true }));

        try {
          await dispatch(
            updateAgendamento({
              id: agendamentoId,
              agendamento: { falta: value },
            }),
          ).unwrap();

          toast.success(value ? "Falta marcada" : "Marcação de falta removida");

          onSuccess?.();
        } catch (error) {
          toast.error("Erro ao atualizar falta");
          console.error("Erro ao marcar falta:", error);
        } finally {
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    },
    [
      dispatch,
      enableBatchMode,
      onSuccess,
      updatePendingCount,
      scheduleAutoProcess,
    ],
  );

  // Atualizar status
  const updateStatus = useCallback(
    async (
      agendamentoId: string,
      status: string,
      immediate: boolean = false,
    ) => {
      if (enableBatchMode && !immediate) {
        markStatus(agendamentoId, status);
        updatePendingCount();
        scheduleAutoProcess();
      } else {
        // Processamento imediato usando Redux
        setState((prev) => ({ ...prev, loading: true }));

        try {
          await dispatch(
            updateAgendamento({
              id: agendamentoId,
              agendamento: { statusAgendamento: status },
            }),
          ).unwrap();

          toast.success("Status atualizado com sucesso");
          onSuccess?.();
        } catch (error) {
          toast.error("Erro ao atualizar status");
          console.error("Erro ao atualizar status:", error);
        } finally {
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    },
    [
      dispatch,
      enableBatchMode,
      onSuccess,
      updatePendingCount,
      scheduleAutoProcess,
    ],
  );

  // Cancelar operações pendentes
  const cancelPendingOperations = useCallback(() => {
    clearPendingOperations();

    if (autoProcessTimeoutRef.current) {
      clearTimeout(autoProcessTimeoutRef.current);
      autoProcessTimeoutRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      pendingCount: 0,
      errors: [],
    }));

    toast.info("Operações pendentes canceladas");
  }, []);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (autoProcessTimeoutRef.current) {
        clearTimeout(autoProcessTimeoutRef.current);
      }
    };
  }, []);

  // Atualizar contagem periodicamente
  useEffect(() => {
    const interval = setInterval(updatePendingCount, 1000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  return {
    // Estado
    isLoading: state.loading,
    pendingCount: state.pendingCount,
    hasErrors: state.errors.length > 0,
    errors: state.errors,
    lastProcessTime: state.lastProcessTime,

    // Ações
    markSessionRealizada,
    markSessionFalta,
    updateStatus,
    processOperations,
    cancelPendingOperations,

    // Configurações
    enableBatchMode,
  };
}
