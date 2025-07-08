/**
 * Utilitário para marcação de agendamentos em lote
 * Otimiza performance agrupando operações e implementando debounce
 */

import axiosInstance from "./api";
import { debounce } from "lodash";

interface MarkingOperation {
  id: string;
  type: "sessaoRealizada" | "falta" | "status";
  value: boolean | string;
  timestamp: number;
}

interface BatchMarkingResult {
  success: boolean;
  processedCount: number;
  errors: string[];
  duration: number;
}

class BatchMarkingManager {
  private pendingOperations: Map<string, MarkingOperation> = new Map();
  private processingQueue: boolean = false;
  private maxBatchSize: number = 10;
  private debounceDelay: number = 300; // 300ms

  // Debounced function para processar operações em lote
  private debouncedProcess = debounce(
    this.processQueue.bind(this),
    this.debounceDelay,
  );

  /**
   * Adiciona uma operação de marcação à fila
   */
  public addMarkingOperation(
    agendamentoId: string,
    type: "sessaoRealizada" | "falta" | "status",
    value: boolean | string,
  ): void {
    const operation: MarkingOperation = {
      id: agendamentoId,
      type,
      value,
      timestamp: Date.now(),
    };

    // Sobrescreve operação anterior para o mesmo agendamento (última operação prevalece)
    this.pendingOperations.set(agendamentoId, operation);

    // Dispara processamento com debounce
    this.debouncedProcess();
  }

  /**
   * Processa todas as operações pendentes em lote
   */
  private async processQueue(): Promise<BatchMarkingResult> {
    if (this.processingQueue || this.pendingOperations.size === 0) {
      return {
        success: true,
        processedCount: 0,
        errors: [],
        duration: 0,
      };
    }

    this.processingQueue = true;
    const startTime = Date.now();

    try {
      // Converter map para array e processar em chunks
      const operations = Array.from(this.pendingOperations.values());
      this.pendingOperations.clear();

      const results = await this.processBatchOperations(operations);

      const duration = Date.now() - startTime;

      return {
        success: results.errors.length === 0,
        processedCount: results.processedCount,
        errors: results.errors,
        duration,
      };
    } catch (error) {
      console.error("Erro ao processar lote de marcações:", error);
      return {
        success: false,
        processedCount: 0,
        errors: [error.message || "Erro desconhecido"],
        duration: Date.now() - startTime,
      };
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Processa operações em lote usando endpoint otimizado
   */
  private async processBatchOperations(
    operations: MarkingOperation[],
  ): Promise<{
    processedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let processedCount = 0;

    // Agrupar operações por tipo para otimizar requisições
    const groupedOperations = this.groupOperationsByType(operations);

    // Processar cada grupo de operações
    for (const [type, ops] of Object.entries(groupedOperations)) {
      try {
        if (ops.length === 0) continue;

        // Processar em chunks para evitar timeout
        const chunks = this.chunkArray(ops, this.maxBatchSize);

        for (const chunk of chunks) {
          await this.processChunk(
            type as keyof typeof groupedOperations,
            chunk,
          );
          processedCount += chunk.length;
        }
      } catch (error) {
        console.error(`Erro ao processar operações do tipo ${type}:`, error);
        errors.push(`Erro em operações ${type}: ${error.message}`);
      }
    }

    return { processedCount, errors };
  }

  /**
   * Agrupa operações por tipo para otimizar processamento
   */
  private groupOperationsByType(operations: MarkingOperation[]): {
    sessaoRealizada: MarkingOperation[];
    falta: MarkingOperation[];
    status: MarkingOperation[];
  } {
    return operations.reduce(
      (groups, op) => {
        groups[op.type].push(op);
        return groups;
      },
      {
        sessaoRealizada: [],
        falta: [],
        status: [],
      },
    );
  }

  /**
   * Processa um chunk de operações do mesmo tipo
   */
  private async processChunk(
    type: "sessaoRealizada" | "falta" | "status",
    chunk: MarkingOperation[],
  ): Promise<void> {
    if (chunk.length === 1) {
      // Operação individual - usar endpoint padrão
      await this.processSingleOperation(chunk[0]);
    } else {
      // Operação em lote - usar endpoint otimizado
      await this.processBatchChunk(type, chunk);
    }
  }

  /**
   * Processa operação individual
   */
  private async processSingleOperation(
    operation: MarkingOperation,
  ): Promise<void> {
    const updateData = {
      [operation.type]: operation.value,
    };

    await axiosInstance.put(`/agendamentos/${operation.id}`, updateData);
  }

  /**
   * Processa chunk em lote usando endpoint otimizado
   */
  private async processBatchChunk(
    type: "sessaoRealizada" | "falta" | "status",
    chunk: MarkingOperation[],
  ): Promise<void> {
    const batchData = {
      operations: chunk.map((op) => ({
        id: op.id,
        value: op.value,
      })),
      type,
    };

    // Usar endpoint de batch se disponível, senão fazer requisições individuais
    try {
      await axiosInstance.post("/agendamentos/batch-update", batchData);
    } catch (error) {
      // Fallback para operações individuais
      console.warn(
        "Endpoint de batch não disponível, usando operações individuais",
      );

      for (const operation of chunk) {
        await this.processSingleOperation(operation);
      }
    }
  }

  /**
   * Divide array em chunks menores
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Força processamento imediato da fila
   */
  public async forceProcess(): Promise<BatchMarkingResult> {
    this.debouncedProcess.cancel();
    return await this.processQueue();
  }

  /**
   * Limpa todas as operações pendentes
   */
  public clearPendingOperations(): void {
    this.pendingOperations.clear();
    this.debouncedProcess.cancel();
  }

  /**
   * Retorna número de operações pendentes
   */
  public getPendingCount(): number {
    return this.pendingOperations.size;
  }
}

// Instância singleton do gerenciador
export const batchMarkingManager = new BatchMarkingManager();

// Funções utilitárias para uso nos componentes
export const markSessaoRealizada = (agendamentoId: string, value: boolean) => {
  batchMarkingManager.addMarkingOperation(
    agendamentoId,
    "sessaoRealizada",
    value,
  );
};

export const markFalta = (agendamentoId: string, value: boolean) => {
  batchMarkingManager.addMarkingOperation(agendamentoId, "falta", value);
};

export const markStatus = (agendamentoId: string, value: string) => {
  batchMarkingManager.addMarkingOperation(agendamentoId, "status", value);
};

export const forceProcessPendingOperations =
  async (): Promise<BatchMarkingResult> => {
    return await batchMarkingManager.forceProcess();
  };

export const clearPendingOperations = () => {
  batchMarkingManager.clearPendingOperations();
};

export const getPendingOperationsCount = (): number => {
  return batchMarkingManager.getPendingCount();
};
