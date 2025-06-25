import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "utils/api";
import { Agendamento } from "tipos";

// Estado inicial
interface AgendamentosState {
  data: Agendamento[];
  loading: boolean;
  error: string | null;
}

const initialState: AgendamentosState = {
  data: [],
  loading: false,
  error: null,
};

// Thunks (Actions Assíncronas)
export const fetchAgendamentos = createAsyncThunk(
  "agendamentos/fetchAll",
  async () => {
    const response = await axiosInstance.get("/agendamentos");
    return response.data;
  },
);

// Thunk para adicionar um agendamento
export const addAgendamento = createAsyncThunk<Agendamento, any>(
  "agendamentos/addAgendamento",
  async (agendamentoData) => {
    const response = await axiosInstance.post("/agendamentos", agendamentoData);
    return response.data;
  },
);

// Thunk para adicionar agendamentos recorrentes
export const addAgendamentoRecorrente = createAsyncThunk<
  {
    data: Agendamento[];
    metadata?: {
      duration?: string;
      count?: number;
      sessoesCreated?: number;
      numeroOriginalEstimado?: number;
      numeroFinalCriado?: number;
      limiteLabelizado?: boolean;
    };
  },
  {
    recurrenceId: string;
    agendamentoBase: any;
    diasDaSemana: string[];
    dataFimRecorrencia: string;
    periodicidade: string;
  }
>(
  "agendamentos/addAgendamentoRecorrente",
  async ({
    recurrenceId,
    agendamentoBase,
    diasDaSemana,
    dataFimRecorrencia,
    periodicidade,
  }) => {
    const response = await axiosInstance.post(
      `/agendamentos/recurrences/${recurrenceId}`,
      {
        agendamentoBase,
        diasDaSemana,
        dataFimRecorrencia,
        periodicidade,
      },
    );
    return response.data;
  },
);

// Thunk para atualizar um agendamento
export const updateAgendamento = createAsyncThunk<
  Agendamento,
  { id: string; agendamento: any }
>("agendamentos/updateAgendamento", async ({ id, agendamento }) => {
  const response = await axiosInstance.put(`/agendamentos/${id}`, agendamento);
  return response.data;
});

// Thunk para excluir um agendamento
export const deleteAgendamento = createAsyncThunk(
  "agendamentos/deleteAgendamento",
  async (
    arg:
      | string
      | { id: string; deleteAllRecurrences?: boolean; recurrenceId?: string },
  ) => {
    try {
      // Verificar se recebemos um objeto ou apenas o ID
      if (typeof arg === "object") {
        const { id, deleteAllRecurrences, recurrenceId } = arg;

        // Se deve excluir todos os agendamentos recorrentes
        if (deleteAllRecurrences && recurrenceId) {
          await axiosInstance.delete(
            `/agendamentos/recurrences/${recurrenceId}`,
          );
          return { id, recurrenceId, deleteAllRecurrences };
        } else {
          await axiosInstance.delete(`/agendamentos/${id}`);
          return { id };
        }
      } else {
        // Caso padrão: excluir apenas o agendamento específico
        const id = arg;
        await axiosInstance.delete(`/agendamentos/${id}`);
        return { id };
      }
    } catch (error) {
      throw error.response?.data?.message || "Erro ao excluir agendamento";
    }
  },
);

// Slice
const agendamentosSlice = createSlice({
  name: "agendamentos",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch todos os agendamentos
    builder.addCase(fetchAgendamentos.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAgendamentos.fulfilled, (state, action) => {
      state.loading = false;
      state.data = action.payload;
    });
    builder.addCase(fetchAgendamentos.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Erro ao carregar agendamentos";
    });

    // Adicionar agendamento
    builder.addCase(addAgendamento.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addAgendamento.fulfilled, (state, action) => {
      state.loading = false;
      state.data.push(action.payload);
    });
    builder.addCase(addAgendamento.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Erro ao criar agendamento";
    });

    // Adicionar agendamento recorrente
    builder.addCase(addAgendamentoRecorrente.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addAgendamentoRecorrente.fulfilled, (state, action) => {
      state.loading = false;
      // Assume que a API retorna um array de agendamentos criados
      if (Array.isArray(action.payload.data)) {
        state.data = [...state.data, ...action.payload.data];
      }
    });
    builder.addCase(addAgendamentoRecorrente.rejected, (state, action) => {
      state.loading = false;
      state.error =
        action.error.message || "Erro ao criar agendamentos recorrentes";
    });

    // Atualizar agendamento
    builder.addCase(updateAgendamento.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateAgendamento.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.data.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        state.data[index] = action.payload;
      }
    });
    builder.addCase(updateAgendamento.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Erro ao atualizar agendamento";
    });

    // Excluir agendamento
    builder.addCase(deleteAgendamento.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteAgendamento.fulfilled, (state, action) => {
      state.loading = false;

      // Se foi uma exclusão de recorrência, remova todos os itens com o mesmo recurrenceId
      if (
        typeof action.meta.arg === "object" &&
        action.meta.arg.deleteAllRecurrences &&
        action.meta.arg.recurrenceId
      ) {
        const recurrenceId = action.meta.arg.recurrenceId;
        state.data = state.data.filter((a) => a.recurrenceId !== recurrenceId);
      } else {
        // Caso contrário, exclui apenas o item com o ID específico
        state.data = state.data.filter((a) => a.id !== action.payload.id);
      }
    });
    builder.addCase(deleteAgendamento.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || "Erro ao excluir agendamento";
    });
  },
});

export const { clearError } = agendamentosSlice.actions;
export default agendamentosSlice.reducer;
