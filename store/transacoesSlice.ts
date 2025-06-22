import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "utils/api";
import { isAxiosError } from "axios";

// Tipos
export interface Transacao {
  id: string;
  tipo: "entrada" | "saida";
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  observacoes?: string;
  usuario_id: string;
  usuario_nome?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TransacoesState {
  data: Transacao[];
  loading: boolean;
  error: string | null;
}

// Estado inicial
const initialState: TransacoesState = {
  data: [],
  loading: false,
  error: null,
};

// Thunks assíncronos
export const fetchTransacoes = createAsyncThunk(
  "transacoes/fetchTransacoes",
  async (
    filters: { periodo?: string; tipo?: string; categoria?: string } = {},
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams();
      if (filters?.periodo) params.append("periodo", filters.periodo);
      if (filters?.tipo) params.append("tipo", filters.tipo);
      if (filters?.categoria) params.append("categoria", filters.categoria);

      const url = `/transacoes${params.toString() ? `?${params.toString()}` : ""}`;

      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.error || error.message);
      }
      return rejectWithValue("Erro desconhecido ao buscar transações");
    }
  },
);

export const addTransacao = createAsyncThunk(
  "transacoes/addTransacao",
  async (
    transacaoData: {
      tipo: "entrada" | "saida";
      categoria: string;
      descricao: string;
      valor: number;
      data: string;
      observacoes?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosInstance.post("/transacoes", transacaoData);
      return response.data.transacao;
    } catch (error) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.error || error.message);
      }
      return rejectWithValue("Erro desconhecido ao criar transação");
    }
  },
);

export const updateTransacao = createAsyncThunk(
  "transacoes/updateTransacao",
  async (
    { id, data }: { id: string; data: Partial<Transacao> },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosInstance.put(`/transacoes/${id}`, data);
      return response.data.transacao;
    } catch (error) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.error || error.message);
      }
      return rejectWithValue("Erro desconhecido ao atualizar transação");
    }
  },
);

export const deleteTransacao = createAsyncThunk(
  "transacoes/deleteTransacao",
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/transacoes/${id}`);
      return id;
    } catch (error) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.error || error.message);
      }
      return rejectWithValue("Erro desconhecido ao excluir transação");
    }
  },
);

// Slice
const transacoesSlice = createSlice({
  name: "transacoes",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTransacoes: (state) => {
      state.data = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch transações
    builder
      .addCase(fetchTransacoes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchTransacoes.fulfilled,
        (state, action: PayloadAction<Transacao[]>) => {
          state.loading = false;
          state.data = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchTransacoes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Add transação
    builder
      .addCase(addTransacao.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        addTransacao.fulfilled,
        (state, action: PayloadAction<Transacao>) => {
          state.loading = false;
          state.data.unshift(action.payload);
          state.error = null;
        },
      )
      .addCase(addTransacao.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update transação
    builder
      .addCase(updateTransacao.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateTransacao.fulfilled,
        (state, action: PayloadAction<Transacao>) => {
          state.loading = false;
          const index = state.data.findIndex((t) => t.id === action.payload.id);
          if (index !== -1) {
            state.data[index] = action.payload;
          }
          state.error = null;
        },
      )
      .addCase(updateTransacao.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete transação
    builder
      .addCase(deleteTransacao.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteTransacao.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.data = state.data.filter((t) => t.id !== action.payload);
          state.error = null;
        },
      )
      .addCase(deleteTransacao.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearTransacoes } = transacoesSlice.actions;

export default transacoesSlice.reducer;
