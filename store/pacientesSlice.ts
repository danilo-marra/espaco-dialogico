import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { PacientesState } from "./store";
import type { Paciente } from "tipos";
import axiosInstance from "utils/api";
import { isAxiosError } from "axios";
import { format, isValid, parse } from "date-fns";

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

  // Função interna para garantir que qualquer formato de data seja convertido corretamente
  const formatDateToYYYYMMDD = (dateValue: any): string => {
    try {
      // Caso 1: Se já for um objeto Date válido
      if (dateValue instanceof Date && isValid(dateValue)) {
        return format(dateValue, "yyyy-MM-dd");
      }

      // Caso 2: Se for uma string ISO (que pode vir do frontend ou já estar no formato ISO)
      if (typeof dateValue === "string") {
        // Primeiro tenta interpretar como uma data ISO
        const parsedIsoDate = new Date(dateValue);
        if (isValid(parsedIsoDate)) {
          return format(parsedIsoDate, "yyyy-MM-dd");
        }

        // Tenta interpretar como dd/MM/yyyy (formato brasileiro)
        try {
          const parsedBrDate = parse(dateValue, "dd/MM/yyyy", new Date());
          if (isValid(parsedBrDate)) {
            return format(parsedBrDate, "yyyy-MM-dd");
          }
        } catch (e) {
          console.warn("Falha ao interpretar como dd/MM/yyyy:", dateValue);
        }
      }

      // Caso 3: Fallback para a data atual
      console.warn(`Valor de data inválido (${dateValue}), usando data atual`);
      return format(new Date(), "yyyy-MM-dd");
    } catch (error) {
      // Caso 4: Em caso de erro inesperado, usa data atual
      console.error(`Erro ao processar data (${dateValue}):`, error);
      return format(new Date(), "yyyy-MM-dd");
    }
  };

  // Formatar dt_nascimento apenas se estiver presente
  if (formattedData.dt_nascimento) {
    formattedData.dt_nascimento = formatDateToYYYYMMDD(
      formattedData.dt_nascimento,
    );
    console.log("dt_nascimento formatado final:", formattedData.dt_nascimento);
  } else {
    formattedData.dt_nascimento = null;
    console.log("dt_nascimento não preenchido, definindo como null");
  }

  // Garante que dt_entrada NUNCA será null
  formattedData.dt_entrada = formatDateToYYYYMMDD(formattedData.dt_entrada);
  console.log("dt_entrada formatado final:", formattedData.dt_entrada);

  // Verifica outros campos obrigatórios e fornece valores padrão
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

  // Origem é opcional, mantém valor original ou define como null
  if (!formattedData.origem) {
    formattedData.origem = null;
    console.log("Origem não definida, definindo como null");
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

    // Criar FormData para envio multipart
    const formData = new FormData();

    // Adicionar todos os campos ao FormData
    Object.keys(formattedPaciente).forEach((key) => {
      const value = formattedPaciente[key];
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    console.log(
      "FormData criado para novo paciente:",
      Array.from(formData.entries()),
    );

    const response = await axiosInstance.post(API_ENDPOINT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
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

    console.log(`Enviando PUT para ${API_ENDPOINT}/${id}:`, formattedPaciente);

    // Criar FormData para envio multipart
    const formData = new FormData();

    // Adicionar todos os campos ao FormData
    Object.keys(formattedPaciente).forEach((key) => {
      const value = formattedPaciente[key];
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Log para debug
    console.log(
      "FormData criado para paciente:",
      Array.from(formData.entries()),
    );

    const response = await axiosInstance.put<Paciente>(
      `${API_ENDPOINT}/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error: any) {
    console.error("Erro ao atualizar paciente:", error);
    if (isAxiosError(error)) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
    return rejectWithValue("Erro desconhecido ao atualizar paciente");
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
