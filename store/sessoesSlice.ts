import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { SessoesState } from "./store";
import type { Sessao } from "tipos";
import axiosInstance from "utils/api";
import { isAxiosError } from "axios";

// Estado inicial
const initialState: SessoesState = {
  data: [],
  loading: false,
  error: null,
};

// Constante para o endpoint base
const API_ENDPOINT = "/sessoes";

// Thunk para buscar todas as sessões
export const fetchSessoes = createAsyncThunk<
  Sessao[],
  void,
  { rejectValue: string }
>("sessoes/fetchSessoes", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<Sessao[]>(API_ENDPOINT);
    return response.data;
  } catch (error: any) {
    if (isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
    return rejectWithValue("Erro desconhecido");
  }
});

// Thunk para atualizar uma sessão
export const updateSessao = createAsyncThunk<
  Sessao,
  { id: string; sessao: Partial<Sessao> },
  { rejectValue: string }
>("sessoes/updateSessao", async ({ id, sessao }, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.put<Sessao>(
      `${API_ENDPOINT}/${id}`,
      sessao,
    );
    return response.data;
  } catch (error: any) {
    if (isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
    return rejectWithValue("Erro ao atualizar sessão");
  }
});

// NOVO: Thunk para criar uma sessão
export const createSessao = createAsyncThunk<
  Sessao,
  Partial<Sessao>,
  { rejectValue: string }
>("sessoes/createSessao", async (sessaoData, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post<Sessao>(API_ENDPOINT, sessaoData);
    return response.data;
  } catch (error: any) {
    if (isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
    return rejectWithValue("Erro ao criar sessão");
  }
});

// NOVO: Thunk para deletar uma sessão
export const deleteSessao = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("sessoes/deleteSessao", async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`${API_ENDPOINT}/${id}`);
    return id;
  } catch (error: any) {
    if (isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
    return rejectWithValue("Erro ao deletar sessão");
  }
});

// Slice de Sessões
const sessoesSlice = createSlice({
  name: "sessoes",
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
    },
    // NOVO: Action para atualizar múltiplas sessões localmente
    updateMultipleSessoes: (
      state,
      action: PayloadAction<{ ids: string[]; updates: Partial<Sessao> }>,
    ) => {
      const { ids, updates } = action.payload;
      state.data = state.data.map((sessao) =>
        ids.includes(sessao.id) ? { ...sessao, ...updates } : sessao,
      );
    },
  },
  extraReducers: (builder) => {
    // Fetch Sessões
    builder.addCase(fetchSessoes.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchSessoes.fulfilled,
      (state, action: PayloadAction<Sessao[]>) => {
        state.loading = false;
        state.data = action.payload;
      },
    );
    builder.addCase(fetchSessoes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Erro ao buscar sessões";
    });

    // Update Sessão
    builder.addCase(updateSessao.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      updateSessao.fulfilled,
      (state, action: PayloadAction<Sessao>) => {
        state.loading = false;
        // Update the sessão in the data array
        const index = state.data.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      },
    );
    builder.addCase(updateSessao.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Erro ao atualizar sessão";
    });

    // NOVO: Create Sessão
    builder.addCase(createSessao.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      createSessao.fulfilled,
      (state, action: PayloadAction<Sessao>) => {
        state.loading = false;
        state.data.unshift(action.payload); // Add to beginning
      },
    );
    builder.addCase(createSessao.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Erro ao criar sessão";
    });

    // NOVO: Delete Sessão
    builder.addCase(deleteSessao.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      deleteSessao.fulfilled,
      (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.data = state.data.filter((s) => s.id !== action.payload);
      },
    );
    builder.addCase(deleteSessao.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Erro ao deletar sessão";
    });
  },
});

export const { clearErrors, updateMultipleSessoes } = sessoesSlice.actions;
export default sessoesSlice.reducer;
