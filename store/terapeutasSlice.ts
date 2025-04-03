import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { TerapeutasState } from "./store";
import type { Terapeuta } from "tipos";
import axiosInstance from "utils/api";
import { isAxiosError } from "axios";

// Estado inicial
const initialState: TerapeutasState = {
  data: [],
  loading: false,
  error: null,
};

// Constante para o endpoint base
const API_ENDPOINT = "/terapeutas";

// Thunk para adicionar terapeuta com upload de arquivo
export const addTerapeuta = createAsyncThunk<
  Terapeuta,
  { terapeuta: Omit<Terapeuta, "id">; foto?: File },
  { rejectValue: string }
>(
  "terapeutas/addTerapeuta",
  async ({ terapeuta, foto }, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      // Adicionar campos do terapeuta
      formData.append("nome", terapeuta.nome);
      formData.append("telefone", terapeuta.telefone);
      formData.append("email", terapeuta.email);
      formData.append("endereco", terapeuta.endereco);
      formData.append(
        "dt_entrada",
        typeof terapeuta.dt_entrada === "string"
          ? terapeuta.dt_entrada
          : terapeuta.dt_entrada.toISOString(),
      );
      formData.append("chave_pix", terapeuta.chave_pix);

      // Adicionar foto se existir
      if (foto) {
        formData.append("foto", foto);
      }

      console.log("Enviando formData:", Object.fromEntries(formData));

      const response = await axiosInstance.post(API_ENDPOINT, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Erro ao adicionar terapeuta:", error);
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.error || error.message);
      }
      return rejectWithValue("Erro desconhecido ao adicionar terapeuta");
    }
  },
);

// Thunk para buscar todos os terapeutas
export const fetchTerapeutas = createAsyncThunk<
  Terapeuta[],
  void,
  { rejectValue: string }
>("terapeutas/fetchTerapeutas", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<Terapeuta[]>(API_ENDPOINT);
    return response.data;
  } catch (error: any) {
    if (isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
    return rejectWithValue("Erro desconhecido");
  }
});

// Thunk para editar terapeuta
export const updateTerapeuta = createAsyncThunk<
  Terapeuta,
  { terapeuta: Terapeuta; foto?: File },
  { rejectValue: string }
>(
  "terapeutas/updateTerapeuta",
  async ({ terapeuta, foto }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("nome", terapeuta.nome);
      formData.append("telefone", terapeuta.telefone);
      formData.append("email", terapeuta.email);
      formData.append("endereco", terapeuta.endereco);
      formData.append(
        "dt_entrada",
        typeof terapeuta.dt_entrada === "string"
          ? terapeuta.dt_entrada
          : new Date(terapeuta.dt_entrada).toISOString(),
      );
      formData.append("chave_pix", terapeuta.chave_pix);

      if (foto) {
        formData.append("foto", foto);
      }

      const response = await axiosInstance.put<Terapeuta>(
        `${API_ENDPOINT}/${terapeuta.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      return response.data;
    } catch (error: any) {
      if (isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.error || error.message);
      }
      return rejectWithValue("Erro desconhecido");
    }
  },
);

// Thunk para excluir terapeuta
export const deleteTerapeuta = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("terapeutas/deleteTerapeuta", async (id, { rejectWithValue }) => {
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

// Slice de Terapeutas
const terapeutasSlice = createSlice({
  name: "terapeutas",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch Terapeutas
    builder.addCase(fetchTerapeutas.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchTerapeutas.fulfilled,
      (state, action: PayloadAction<Terapeuta[]>) => {
        state.loading = false;
        state.data = action.payload;
      },
    );
    builder.addCase(fetchTerapeutas.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Erro ao buscar terapeutas";
    });

    // Add Terapeuta
    builder.addCase(addTerapeuta.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      addTerapeuta.fulfilled,
      (state, action: PayloadAction<Terapeuta>) => {
        state.loading = false;
        state.data.push(action.payload);
      },
    );
    builder.addCase(addTerapeuta.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Erro ao adicionar terapeuta";
    });

    // Update Terapeuta
    builder.addCase(updateTerapeuta.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      updateTerapeuta.fulfilled,
      (state, action: PayloadAction<Terapeuta>) => {
        state.loading = false;
        const index = state.data.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      },
    );
    builder.addCase(updateTerapeuta.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Erro ao atualizar terapeuta";
    });

    // Delete Terapeuta
    builder.addCase(deleteTerapeuta.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      deleteTerapeuta.fulfilled,
      (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.data = state.data.filter((t) => t.id !== action.payload);
      },
    );
    builder.addCase(deleteTerapeuta.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Erro ao excluir terapeuta";
    });
  },
});

export default terapeutasSlice.reducer;
