import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { PacientesState } from "./store";
import type { Paciente } from "tipos";
import axiosInstance from "utils/api";
import { isAxiosError } from "axios";
import { format } from "date-fns";

// Estado inicial
const initialState: PacientesState = {
  data: [],
  loading: false,
  error: null,
};

// Constante para o endpoint base
const API_ENDPOINT = "/pacientes";

// Função auxiliar para formatar as datas antes de enviar ao backend
const preparePacienteData = (data: any) => {
  const formattedData = { ...data };

  console.log("Dados originais recebidos:", data);

  // Verifica e formata dt_nascimento
  if (formattedData.dt_nascimento instanceof Date) {
    formattedData.dt_nascimento = format(
      formattedData.dt_nascimento,
      "yyyy-MM-dd",
    );
  } else if (
    formattedData.dt_nascimento &&
    typeof formattedData.dt_nascimento === "string"
  ) {
    // Se for uma string, tenta converter para data e depois para string no formato correto
    try {
      const date = new Date(formattedData.dt_nascimento);
      formattedData.dt_nascimento = format(date, "yyyy-MM-dd");
    } catch (error) {
      console.error(
        "Erro ao converter dt_nascimento de string para Date",
        error,
      );
      // Em caso de erro, mantém o valor original
    }
  } else {
    console.error("ERRO: dt_nascimento está vazio ou inválido");
    throw new Error("Data de nascimento é obrigatória");
  }

  // Verifica e formata dt_entrada
  if (formattedData.dt_entrada instanceof Date) {
    formattedData.dt_entrada = format(formattedData.dt_entrada, "yyyy-MM-dd");
  } else if (
    formattedData.dt_entrada &&
    typeof formattedData.dt_entrada === "string"
  ) {
    try {
      const date = new Date(formattedData.dt_entrada);
      formattedData.dt_entrada = format(date, "yyyy-MM-dd");
    } catch (error) {
      console.error("Erro ao converter dt_entrada de string para Date", error);
      // Em caso de erro, usa a data atual
      formattedData.dt_entrada = format(new Date(), "yyyy-MM-dd");
    }
  } else {
    // Se a data de entrada não estiver definida, use a data atual
    formattedData.dt_entrada = format(new Date(), "yyyy-MM-dd");
    console.log("dt_entrada não definida, usando data atual");
  }

  // Verifica outros campos obrigatórios
  if (!formattedData.terapeuta_id) {
    console.error("ERRO: terapeuta_id está vazio ou inválido");
    throw new Error("Terapeuta responsável é obrigatório");
  }

  if (!formattedData.nome_responsavel) {
    console.error("ERRO: nome_responsavel está vazio ou inválido");
    throw new Error("Nome do responsável é obrigatório");
  }

  if (!formattedData.telefone_responsavel) {
    console.error("ERRO: telefone_responsavel está vazio ou inválido");
    throw new Error("Telefone do responsável é obrigatório");
  }

  if (!formattedData.email_responsavel) {
    console.error("ERRO: email_responsavel está vazio ou inválido");
    throw new Error("Email do responsável é obrigatório");
  }

  if (!formattedData.cpf_responsavel) {
    console.error("ERRO: cpf_responsavel está vazio ou inválido");
    throw new Error("CPF do responsável é obrigatório");
  }

  if (!formattedData.endereco_responsavel) {
    console.error("ERRO: endereco_responsavel está vazio ou inválido");
    throw new Error("Endereço do responsável é obrigatório");
  }

  if (!formattedData.origem) {
    console.error("ERRO: origem está vazia ou inválida");
    throw new Error("Origem é obrigatória");
  }

  console.log("Dados formatados para envio:", formattedData);
  return formattedData;
};

// Thunk para adicionar paciente
export const addPaciente = createAsyncThunk<
  Paciente,
  any, // Usando any para aceitar os campos do formulário diretamente
  { rejectValue: string }
>("pacientes/addPaciente", async (paciente, { rejectWithValue }) => {
  try {
    // Formatar os dados antes de enviar
    const formattedPaciente = preparePacienteData(paciente);

    const response = await axiosInstance.post(API_ENDPOINT, formattedPaciente);
    return response.data;
  } catch (error) {
    console.error("Erro ao adicionar paciente:", error);
    if (isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
    return rejectWithValue("Erro desconhecido ao adicionar paciente");
  }
});

// Thunk para buscar todos os pacientes
export const fetchPacientes = createAsyncThunk<
  Paciente[],
  void,
  { rejectValue: string }
>("pacientes/fetchPacientes", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get<Paciente[]>(API_ENDPOINT);
    return response.data;
  } catch (error: any) {
    if (isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
    return rejectWithValue("Erro desconhecido");
  }
});

// Thunk para editar paciente
export const updatePaciente = createAsyncThunk<
  Paciente,
  any, // Usando any para aceitar os campos do formulário diretamente
  { rejectValue: string }
>("pacientes/updatePaciente", async (pacienteData, { rejectWithValue }) => {
  try {
    const { id, ...paciente } = pacienteData;

    // Formatar os dados antes de enviar
    const formattedPaciente = preparePacienteData(paciente);

    const response = await axiosInstance.put<Paciente>(
      `${API_ENDPOINT}/${id}`,
      formattedPaciente,
    );

    return response.data;
  } catch (error: any) {
    if (isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
    return rejectWithValue("Erro desconhecido");
  }
});

// Thunk para excluir paciente
export const deletePaciente = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("pacientes/deletePaciente", async (id, { rejectWithValue }) => {
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

// Slice de Pacientes
const pacientesSlice = createSlice({
  name: "pacientes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch Pacientes
    builder.addCase(fetchPacientes.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      fetchPacientes.fulfilled,
      (state, action: PayloadAction<Paciente[]>) => {
        state.loading = false;
        state.data = action.payload;
      },
    );
    builder.addCase(fetchPacientes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Erro ao buscar pacientes";
    });

    // Add Paciente
    builder.addCase(addPaciente.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      addPaciente.fulfilled,
      (state, action: PayloadAction<Paciente>) => {
        state.loading = false;
        state.data.push(action.payload);
      },
    );
    builder.addCase(addPaciente.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Erro ao adicionar paciente";
    });

    // Update Paciente
    builder.addCase(updatePaciente.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      updatePaciente.fulfilled,
      (state, action: PayloadAction<Paciente>) => {
        state.loading = false;
        const index = state.data.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      },
    );
    builder.addCase(updatePaciente.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Erro ao atualizar paciente";
    });

    // Delete Paciente
    builder.addCase(deletePaciente.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      deletePaciente.fulfilled,
      (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.data = state.data.filter((p) => p.id !== action.payload);
      },
    );
    builder.addCase(deletePaciente.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Erro ao excluir paciente";
    });
  },
});

export default pacientesSlice.reducer;
