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

// Função auxiliar para preparar os dados da sessão
const prepareSessaoData = (
  data: Omit<Sessao, "id" | "pacienteInfo" | "terapeutaInfo">,
) => {
  return {
    terapeuta_id: data.terapeuta_id,
    paciente_id: data.paciente_id,
    tipoSessao: data.tipoSessao,
    valorSessao: data.valorSessao,
    statusSessao: data.statusSessao,
    dtSessao1: data.dtSessao1 ? new Date(data.dtSessao1).toISOString() : null,
    dtSessao2: data.dtSessao2 ? new Date(data.dtSessao2).toISOString() : null,
    dtSessao3: data.dtSessao3 ? new Date(data.dtSessao3).toISOString() : null,
    dtSessao4: data.dtSessao4 ? new Date(data.dtSessao4).toISOString() : null,
    dtSessao5: data.dtSessao5 ? new Date(data.dtSessao5).toISOString() : null,
    dtSessao6: data.dtSessao6 ? new Date(data.dtSessao6).toISOString() : null,
  };
};

// Thunk para adicionar sessão
export const addSessao = createAsyncThunk<
  Sessao,
  Omit<Sessao, "id" | "pacienteInfo" | "terapeutaInfo">,
  { rejectValue: string }
>("sessoes/addSessao", async (sessaoData, { rejectWithValue }) => {
  try {
    // Mapear dados do formulário para corresponder com a estrutura esperada pela API
    const payload = prepareSessaoData(sessaoData);

    const response = await axiosInstance.post(API_ENDPOINT, payload);
    return response.data;
  } catch (error) {
    console.error("Erro ao adicionar sessão:", error);
    if (isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
    return rejectWithValue("Erro desconhecido ao adicionar sessão");
  }
});

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

// Thunk para editar sessão
export const updateSessao = createAsyncThunk<
  Sessao,
  {
    id: string;
    sessao: Partial<Omit<Sessao, "id" | "pacienteInfo" | "terapeutaInfo">>;
  },
  { rejectValue: string }
>("sessoes/updateSessao", async ({ id, sessao }, { rejectWithValue }) => {
  try {
    // Preparar dados para a API
    const payload = {
      tipoSessao: sessao.tipoSessao,
      valorSessao: sessao.valorSessao,
      statusSessao: sessao.statusSessao,
      valorRepasse: sessao.valorRepasse,
      dtSessao1: sessao.dtSessao1
        ? new Date(sessao.dtSessao1).toISOString()
        : null,
      dtSessao2: sessao.dtSessao2
        ? new Date(sessao.dtSessao2).toISOString()
        : null,
      dtSessao3: sessao.dtSessao3
        ? new Date(sessao.dtSessao3).toISOString()
        : null,
      dtSessao4: sessao.dtSessao4
        ? new Date(sessao.dtSessao4).toISOString()
        : null,
      dtSessao5: sessao.dtSessao5
        ? new Date(sessao.dtSessao5).toISOString()
        : null,
      dtSessao6: sessao.dtSessao6
        ? new Date(sessao.dtSessao6).toISOString()
        : null,
    };

    const response = await axiosInstance.put<Sessao>(
      `${API_ENDPOINT}/${id}`,
      payload,
    );

    return response.data;
  } catch (error: any) {
    if (isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
    return rejectWithValue("Erro desconhecido");
  }
});

// Thunk para excluir sessão
export const deleteSessao = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("sessoes/deleteSessao", async (id, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`${API_ENDPOINT}/${id}`);
    return id;
  } catch (error) {
    if (isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
    return rejectWithValue("Erro desconhecido");
  }
});

// Slice de Sessões
const sessoesSlice = createSlice({
  name: "sessoes",
  initialState,
  reducers: {},
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

    // Add Sessão
    builder.addCase(addSessao.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      addSessao.fulfilled,
      (state, action: PayloadAction<Sessao>) => {
        state.loading = false;
        state.data.push(action.payload);
      },
    );
    builder.addCase(addSessao.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Erro ao adicionar sessão";
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

    // Delete Sessão
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
      state.error = action.payload || "Erro ao excluir sessão";
    });
  },
});

export default sessoesSlice.reducer;
