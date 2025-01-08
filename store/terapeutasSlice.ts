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

// Thunk para adicionar terapeuta com upload de arquivo
export const addTerapeuta = createAsyncThunk<
  Terapeuta,
  { terapeuta: Omit<Terapeuta, "id">; foto?: File }, // Torna 'foto' opcional
  { rejectValue: string }
>(
  "terapeutas/addTerapeuta",
  async ({ terapeuta, foto }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("nomeTerapeuta", terapeuta.nomeTerapeuta);
      formData.append("telefoneTerapeuta", terapeuta.telefoneTerapeuta);
      formData.append("emailTerapeuta", terapeuta.emailTerapeuta);
      formData.append("enderecoTerapeuta", terapeuta.enderecoTerapeuta);
      formData.append("dtEntrada", terapeuta.dtEntrada.toISOString());
      formData.append("chavePix", terapeuta.chavePix);

      if (foto) {
        // Condicionalmente adiciona a foto
        formData.append("foto", foto);
      }

      // Log das entradas do FormData
      // for (let pair of formData.entries()) {
      //   console.log(`${pair[0]}: ${pair[1]}`);
      // }

      const response = await axiosInstance.post<Terapeuta>(
        "/terapeutas",
        formData,
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
      formData.append("nomeTerapeuta", terapeuta.nomeTerapeuta);
      formData.append("telefoneTerapeuta", terapeuta.telefoneTerapeuta);
      formData.append("emailTerapeuta", terapeuta.emailTerapeuta);
      formData.append("enderecoTerapeuta", terapeuta.enderecoTerapeuta);
      formData.append("dtEntrada", terapeuta.dtEntrada.toISOString());
      formData.append("chavePix", terapeuta.chavePix);
      formData.append("id", terapeuta.id);

      if (foto) {
        formData.append("foto", foto);
      }

      const response = await axiosInstance.put<Terapeuta>(
        `/terapeutas/${terapeuta.id}`,
        formData,
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
    await axiosInstance.delete(`/terapeutas/${id}`);
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
