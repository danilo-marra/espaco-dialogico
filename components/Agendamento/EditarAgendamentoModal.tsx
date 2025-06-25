import React, { useEffect, useState, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useFetchPacientes } from "../../hooks/useFetchPacientes";
import { useFetchTerapeutas } from "../../hooks/useFetchTerapeutas";
import { useTerapeutaData } from "../../hooks/useTerapeutaData";
import useAuth from "../../hooks/useAuth";
import { X } from "@phosphor-icons/react";
import { toast } from "sonner";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from "date-fns/locale";
import { agendamentoSchema } from "./agendamentoSchema";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "store/store";
import { updateAgendamento, fetchAgendamentos } from "store/agendamentosSlice";
import { z } from "zod";
import { Agendamento } from "tipos";
import { maskPrice } from "utils/formatter";
import { Switch } from "@headlessui/react";
import { formatDateForAPI, parseAnyDate } from "utils/dateUtils";
import axiosInstance from "utils/api";
import { mutate } from "swr"; // Importar mutate global do SWR

// Registrar locale pt-BR
registerLocale("pt-BR", ptBR);

// Tipos de agendamento disponíveis
const tiposAgendamento = [
  "Sessão",
  "Orientação Parental",
  "Visita Escolar",
  "Supervisão",
  "Outros",
];

// Status de agendamento
const statusAgendamento = ["Confirmado", "Remarcado", "Cancelado"];

// Modalidades de atendimento
const modalidadesAgendamento = ["Presencial", "Online"];

// Locais de agendamento
const locaisAgendamento = ["Sala Verde", "Sala Azul", "Não Precisa de Sala"];

// Dias da semana
const diasDaSemana = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

// Horários disponíveis (8h às 20h, a cada 30min)
const horariosDisponiveis: string[] = [];
for (let hora = 8; hora <= 20; hora++) {
  horariosDisponiveis.push(`${hora.toString().padStart(2, "0")}:00`);
  horariosDisponiveis.push(`${hora.toString().padStart(2, "0")}:30`);
}

// Tipo para o formulário baseado no schema Zod
type AgendamentoFormInputs = z.infer<typeof agendamentoSchema>;

// Tipo para as props do componente
type EditarAgendamentoModalProps = {
  agendamento: Agendamento;
  open: boolean;
  onSuccess: () => void;
  onClose: () => void;
};

export function EditarAgendamentoModal({
  agendamento,
  open,
  onSuccess,
  onClose,
}: EditarAgendamentoModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [valorInput, setValorInput] = useState<string>("");
  const [editarRecorrencia, setEditarRecorrencia] = useState(false);
  const [alterarDiaSemana, setAlterarDiaSemana] = useState(false);
  const [novoDiaSemana, setNovoDiaSemana] = useState<number>(0); // 0 = Domingo, 1 = Segunda, etc.
  const [agendamentoAtualizado, setAgendamentoAtualizado] =
    useState<Agendamento | null>(null);
  const [isLoadingAgendamento, setIsLoadingAgendamento] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false); // Nova flag para controlar inicialização
  const [numeroRecorrencias, setNumeroRecorrencias] = useState<number>(0); // Estado para número de recorrências
  const [progressPercentage, setProgressPercentage] = useState<number>(0); // Estado para barra de progresso
  const [showProgress, setShowProgress] = useState<boolean>(false); // Estado para mostrar/ocultar barra de progresso

  // Buscar todos os agendamentos do Redux para ter dados atualizados
  const agendamentos = useSelector(
    (state: RootState) => state.agendamentos.data,
  );

  // Buscar dados baseado no role do usuário
  const { user } = useAuth();
  const isUserTerapeuta = user?.role === "terapeuta";

  // Se for terapeuta, usar dados filtrados; senão usar todos os dados
  const {
    terapeuta: currentTerapeuta,
    pacientes: terapeutaPacientes,
    isLoading: terapeutaDataLoading,
  } = useTerapeutaData();

  const { pacientes: allPacientes } = useFetchPacientes();
  const { terapeutas } = useFetchTerapeutas();

  // Determinar quais pacientes mostrar baseado no role
  const pacientes = isUserTerapeuta ? terapeutaPacientes : allPacientes;

  // Debug específico para terapeuta
  useEffect(() => {
    if (isUserTerapeuta) {
      console.log("🧑‍⚕️ DEBUG TERAPEUTA:");
      console.log("- currentTerapeuta:", currentTerapeuta);
      console.log("- terapeutaPacientes:", terapeutaPacientes?.length);
      console.log("- terapeutaDataLoading:", terapeutaDataLoading);
      console.log("- user email:", user?.email);
      console.log("- user id:", user?.id);
      console.log("- user:", user);
    } else {
      console.log("👨‍💼 DEBUG ADMIN:");
      console.log("- allPacientes:", allPacientes?.length);
      console.log("- terapeutas:", terapeutas?.length);
    }
  }, [
    isUserTerapeuta,
    currentTerapeuta,
    terapeutaPacientes,
    terapeutaDataLoading,
    allPacientes,
    terapeutas,
    user,
  ]);

  // Para terapeutas, aguardar a associação do terapeuta antes de prosseguir
  const terapeutaAssociado = isUserTerapeuta ? currentTerapeuta : true;

  // Configuração do formulário com zod e react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<AgendamentoFormInputs>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: {
      paciente_id: "",
      terapeuta_id: "",
      dataAgendamento: new Date(),
      horarioAgendamento: "14:00",
      localAgendamento: "Sala Verde",
      modalidadeAgendamento: "Presencial",
      tipoAgendamento: "Sessão",
      valorAgendamento: 0,
      statusAgendamento: "Confirmado",
      observacoesAgendamento: "",
    },
  });

  // Primeiro buscar todos os agendamentos para garantir dados atualizados
  useEffect(() => {
    if (open) {
      dispatch(fetchAgendamentos());
    }
  }, [open, dispatch]);

  // Buscar e preparar o agendamento mais recente quando o modal abrir
  useEffect(() => {
    if (open && agendamento?.id) {
      setIsLoadingAgendamento(true);

      // Primeiro, verificar se temos dados atualizados no Redux
      const agendamentoRedux = agendamentos.find(
        (a) => a.id === agendamento.id,
      );

      // Se encontramos no Redux, usamos essa versão mais atualizada
      if (agendamentoRedux) {
        setAgendamentoAtualizado(agendamentoRedux);
        setIsLoadingAgendamento(false);
      } else {
        // Caso contrário, buscar diretamente da API
        axiosInstance
          .get<Agendamento>(`/agendamentos/${agendamento.id}`)
          .then((response) => {
            setAgendamentoAtualizado(response.data);
          })
          .catch((error) => {
            console.error("Erro ao buscar agendamento atualizado:", error);
            // Em caso de erro, usar o agendamento fornecido via props
            setAgendamentoAtualizado(agendamento);
          })
          .finally(() => {
            setIsLoadingAgendamento(false);
          });
      }
    } else if (!open) {
      // Limpar o estado quando o modal fechar
      setAgendamentoAtualizado(null);
      setFormInitialized(false); // Reset da flag quando o modal fechar
      setNumeroRecorrencias(0); // Reset do número de recorrências
    }
  }, [open, agendamento?.id, agendamentos, agendamento]);

  // Buscar número de recorrências quando há recurrenceId
  useEffect(() => {
    const agendamentoToUse = agendamentoAtualizado || agendamento;

    if (open && agendamentoToUse?.recurrenceId) {
      axiosInstance
        .get(`/agendamentos/recurrences/${agendamentoToUse.recurrenceId}`)
        .then((response) => {
          if (Array.isArray(response.data)) {
            setNumeroRecorrencias(response.data.length);
          } else {
            setNumeroRecorrencias(0);
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar número de recorrências:", error);
          // Se não conseguir buscar, tentar contar pelos agendamentos carregados
          const agendamentosRecorrentes = agendamentos.filter(
            (a) => a.recurrenceId === agendamentoToUse.recurrenceId,
          );
          setNumeroRecorrencias(agendamentosRecorrentes.length);
        });
    } else if (!open || !agendamentoToUse?.recurrenceId) {
      setNumeroRecorrencias(0);
    }
  }, [open, agendamentoAtualizado, agendamento, agendamentos]);

  // Efeito adicional para garantir que o modal seja reinicializado quando abrir
  useEffect(() => {
    if (open) {
      // Reset da flag de inicialização quando o modal abrir
      setFormInitialized(false);
    } else {
      // Limpar o formulário quando o modal fechar
      reset();
      setValorInput("");
    }
  }, [open, reset]);

  // Carregar os dados do agendamento quando o modal abrir ou quando o agendamento atualizado for obtido
  // MAS APENAS NA PRIMEIRA VEZ para evitar sobrescrever as edições do usuário
  useEffect(() => {
    // Usar agendamentoAtualizado se disponível, caso contrário usar agendamento das props
    const agendamentoToUse = agendamentoAtualizado || agendamento;

    // Só inicializar o formulário se:
    // 1. Temos dados do agendamento
    // 2. Não está carregando
    // 3. Ainda não foi inicializado (formInitialized = false)
    // 4. Temos os dados de terapeutas carregados (essencial para os selects funcionarem)
    // 5. Temos os dados de pacientes carregados (se for admin/secretaria) ou dados do terapeuta (se for terapeuta)
    const terapeutasCarregados = terapeutas && terapeutas.length > 0;
    const pacientesCarregados = isUserTerapeuta
      ? terapeutaPacientes !== undefined && !terapeutaDataLoading // Para terapeuta, aguardar hook específico E não estar carregando
      : allPacientes && allPacientes.length >= 0; // Para admin/secretaria, aguardar todos os pacientes

    if (
      agendamentoToUse &&
      !isLoadingAgendamento &&
      !formInitialized &&
      terapeutasCarregados &&
      pacientesCarregados &&
      terapeutaAssociado // Aguardar associação do terapeuta para usuários tipo "terapeuta"
    ) {
      console.log(
        "Inicializando formulário com dados do agendamento:",
        agendamentoToUse,
      );
      console.log("Paciente ID:", agendamentoToUse.paciente_id);
      console.log("Terapeuta ID:", agendamentoToUse.terapeuta_id);
      console.log("Terapeutas carregados:", terapeutasCarregados);
      console.log("Pacientes carregados:", pacientesCarregados);
      console.log("🔍 isUserTerapeuta:", isUserTerapeuta);
      console.log("🔍 terapeutaDataLoading:", terapeutaDataLoading);
      console.log("🔍 terapeutaPacientes length:", terapeutaPacientes?.length);
      console.log("🔍 terapeutaAssociado:", terapeutaAssociado);
      console.log("🔍 currentTerapeuta:", currentTerapeuta);

      setValue("paciente_id", agendamentoToUse.paciente_id);
      setValue("terapeuta_id", agendamentoToUse.terapeuta_id);

      // Converter a string de data para um objeto Date de forma segura
      try {
        // Usar nossa função utilitária robusta para conversão segura
        const dataAgendamento = parseAnyDate(agendamentoToUse.dataAgendamento);

        setValue("dataAgendamento", dataAgendamento);
      } catch (error) {
        console.error("Erro ao converter data:", error);
        setValue("dataAgendamento", new Date());
      }

      // Define os outros valores do formulário
      setValue("horarioAgendamento", agendamentoToUse.horarioAgendamento);
      setValue("localAgendamento", agendamentoToUse.localAgendamento as any);
      setValue(
        "modalidadeAgendamento",
        agendamentoToUse.modalidadeAgendamento as any,
      );
      setValue("tipoAgendamento", agendamentoToUse.tipoAgendamento as any);
      setValue("valorAgendamento", agendamentoToUse.valorAgendamento);
      setValue("statusAgendamento", agendamentoToUse.statusAgendamento as any);
      setValue(
        "observacoesAgendamento",
        agendamentoToUse.observacoesAgendamento || "",
      );

      // Formatar o valor para exibição
      const valorFormatado = maskPrice(
        (agendamentoToUse.valorAgendamento * 100).toString(),
      );
      setValorInput(valorFormatado);

      // Inicializar o dia da semana atual baseado na data do agendamento
      try {
        const dataParaDiaSemana = parseAnyDate(
          agendamentoToUse.dataAgendamento,
        );
        const diaSemanaAtual = dataParaDiaSemana.getDay();
        setNovoDiaSemana(diaSemanaAtual);
      } catch (error) {
        console.error("Erro ao calcular dia da semana:", error);
        setNovoDiaSemana(0); // Default para Domingo
      }

      // Marcar como inicializado para evitar sobreposições futuras
      setFormInitialized(true);
      console.log("Formulário inicializado com sucesso");
    }
  }, [
    agendamento,
    agendamentoAtualizado,
    setValue,
    isLoadingAgendamento,
    formInitialized,
    terapeutas,
    allPacientes,
    terapeutaPacientes,
    isUserTerapeuta,
    terapeutaDataLoading,
    terapeutaAssociado,
    currentTerapeuta,
  ]);

  // Selecionar paciente e terapeuta
  const selectedTerapeutaId = watch("terapeuta_id");
  const selectedPacienteId = watch("paciente_id");
  const selectedModalidade = watch("modalidadeAgendamento");

  // Debug: logs para verificar os valores selecionados
  useEffect(() => {
    console.log("Debug - selectedTerapeutaId:", selectedTerapeutaId);
    console.log("Debug - selectedPacienteId:", selectedPacienteId);
    console.log("Debug - pacientes disponíveis:", pacientes?.length);
    console.log(
      "Debug - agendamento atual:",
      agendamento?.terapeuta_id,
      agendamento?.paciente_id,
    );
  }, [selectedTerapeutaId, selectedPacienteId, pacientes, agendamento]);

  // Efeito para ajustar o local de agendamento quando a modalidade muda
  useEffect(() => {
    if (selectedModalidade === "Online") {
      setValue("localAgendamento", "Não Precisa de Sala");
    }
  }, [selectedModalidade, setValue]);

  // Filtrar pacientes pelo terapeuta selecionado
  // IMPORTANTE: Usar o terapeuta do agendamento como fallback se selectedTerapeutaId ainda não estiver disponível
  const terapeutaIdParaFiltro =
    selectedTerapeutaId || (agendamentoAtualizado || agendamento)?.terapeuta_id;
  const filteredPacientes = useMemo(() => {
    return terapeutaIdParaFiltro
      ? pacientes?.filter((p) => p.terapeuta_id === terapeutaIdParaFiltro)
      : [];
  }, [terapeutaIdParaFiltro, pacientes]);

  // Debug: log para verificar a filtragem
  useEffect(() => {
    console.log("Debug - terapeutaIdParaFiltro:", terapeutaIdParaFiltro);
    console.log("Debug - filteredPacientes:", filteredPacientes?.length);
    console.log(
      "Debug - filteredPacientes nomes:",
      filteredPacientes?.map((p) => p.nome),
    );
  }, [terapeutaIdParaFiltro, filteredPacientes]);

  // Handler para envio do formulário
  const onSubmit = async (data: AgendamentoFormInputs) => {
    setIsSubmitting(true);
    setLoadingMessage("Preparando atualização...");

    // Se for edição de recorrência, mostrar barra de progresso
    const agendamentoToUse = agendamentoAtualizado || agendamento;
    const isRecurrenceUpdate =
      agendamentoToUse.recurrenceId && editarRecorrencia;

    if (isRecurrenceUpdate) {
      setShowProgress(true);
      setProgressPercentage(10);
    }

    try {
      // Formatar a data para o formato esperado pela API
      const formattedData = {
        ...data,
        dataAgendamento: formatDateForAPI(data.dataAgendamento),
      };

      if (isRecurrenceUpdate) {
        setProgressPercentage(25);
        setLoadingMessage(
          alterarDiaSemana
            ? "Atualizando todos os agendamentos recorrentes com novo dia da semana..."
            : "Atualizando todos os agendamentos recorrentes...",
        );

        // Preparar dados adicionais se alterando dia da semana
        const dadosAtualizacao = {
          ...formattedData,
          updateAllRecurrences: true,
          recurrenceId: agendamentoToUse.recurrenceId,
          ...(alterarDiaSemana && { novoDiaSemana }),
        };

        setProgressPercentage(50);

        // Enviar uma requisição para atualizar todos os agendamentos com o mesmo recurrenceId
        await dispatch(
          updateAgendamento({
            id: agendamentoToUse.id,
            agendamento: dadosAtualizacao,
          }),
        ).unwrap();

        setProgressPercentage(75);
        setLoadingMessage("Atualizando sessões correspondentes...");

        // Atualizar a sessão correspondente (se existir)
        try {
          await axiosInstance.post("/sessoes/from-agendamento", {
            agendamento_id: agendamentoToUse.id,
            update_all_recurrences: true,
          });
        } catch (error) {
          console.error(
            "Erro ao atualizar sessão a partir do agendamento:",
            error,
          );
          // Não interrompemos o fluxo se houver erro na atualização da sessão
        }
      } else {
        setLoadingMessage("Atualizando agendamento...");

        // Atualizar apenas este agendamento específico
        await dispatch(
          updateAgendamento({
            id: agendamentoToUse.id,
            agendamento: {
              ...formattedData,
              updateAllRecurrences: false,
            },
          }),
        ).unwrap();

        setLoadingMessage("Atualizando sessão correspondente...");

        // Atualizar a sessão correspondente (se existir)
        try {
          await axiosInstance.post("/sessoes/from-agendamento", {
            agendamento_id: agendamentoToUse.id,
            update_all_recurrences: false,
          });
        } catch (error) {
          console.error(
            "Erro ao atualizar sessão a partir do agendamento:",
            error,
          );
          // Não interrompemos o fluxo se houver erro na atualização da sessão
        }
      }

      if (isRecurrenceUpdate) {
        setProgressPercentage(90);
      }
      setLoadingMessage("Finalizando...");

      // Recarregar dados após salvar
      dispatch(fetchAgendamentos());

      // Invalidar cache de sessões para garantir sincronização com dashboard de transações
      await mutate("/sessoes");

      if (isRecurrenceUpdate) {
        setProgressPercentage(100);
      }

      // Callback de sucesso e fechamento do modal
      onSuccess();
      onClose();
    } catch (error) {
      // Melhor tratamento de erro
      const errorMessage =
        typeof error === "string"
          ? error
          : error.message || "Erro ao atualizar agendamento";
      toast.error(`Erro ao atualizar agendamento: ${errorMessage}`);
      console.error("Erro ao atualizar agendamento:", error);
    } finally {
      setIsSubmitting(false);
      setLoadingMessage("");
      setShowProgress(false);
      setProgressPercentage(0);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/60 inset-0 fixed z-10" />
        <Dialog.Content className="fixed z-10 w-[95%] max-w-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white py-8 px-10 text-gray-900 shadow-lg rounded-lg max-h-[90vh] overflow-y-auto sm:px-4 sm:py-6 sm:max-h-[95vh]">
          <Dialog.Title className="text-2xl font-bold mb-4 text-center text-azul">
            Editar Agendamento
          </Dialog.Title>

          <Dialog.Close
            className="absolute right-6 top-6 bg-transparent text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            <X size={24} weight="bold" />
          </Dialog.Close>

          {/* Barra de progresso para edição de recorrências */}
          {showProgress && (
            <div className="mb-6 bg-gray-100 rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Processando agendamentos recorrentes...
                </span>
                <span className="text-sm text-gray-500">
                  {progressPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-azul h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              {loadingMessage && (
                <p className="text-xs text-gray-600 mt-2">{loadingMessage}</p>
              )}
            </div>
          )}

          {isLoadingAgendamento ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-azul"></div>
              <span className="ml-3">Carregando dados do agendamento...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Seleção de Terapeuta */}
                <div className="flex flex-col">
                  <label htmlFor="terapeuta_id" className="font-medium mb-1">
                    Terapeuta <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="terapeuta_id"
                    className={`border rounded p-2 ${
                      errors.terapeuta_id ? "border-red-500" : "border-gray-300"
                    }`}
                    {...register("terapeuta_id")}
                    disabled={isUserTerapeuta}
                  >
                    <option value="">Selecione um terapeuta</option>
                    {terapeutas
                      ?.slice()
                      .sort((a, b) => a.nome.localeCompare(b.nome))
                      .map((terapeuta) => (
                        <option key={terapeuta.id} value={terapeuta.id}>
                          {terapeuta.nome}
                        </option>
                      ))}
                  </select>
                  {errors.terapeuta_id && (
                    <span className="text-red-500 text-sm">
                      {errors.terapeuta_id.message?.toString()}
                    </span>
                  )}
                </div>

                {/* Seleção de Paciente */}
                <div className="flex flex-col">
                  <label htmlFor="paciente_id" className="font-medium mb-1">
                    Paciente <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="paciente_id"
                    className={`border rounded p-2 ${
                      errors.paciente_id ? "border-red-500" : "border-gray-300"
                    }`}
                    {...register("paciente_id")}
                    disabled={!terapeutaIdParaFiltro}
                  >
                    <option value="">
                      {terapeutaIdParaFiltro
                        ? "Selecione um paciente"
                        : "Escolha um terapeuta primeiro"}
                    </option>
                    {filteredPacientes
                      ?.slice()
                      .sort((a, b) => a.nome.localeCompare(b.nome))
                      .map((paciente) => (
                        <option key={paciente.id} value={paciente.id}>
                          {paciente.nome}
                        </option>
                      ))}
                  </select>
                  {errors.paciente_id && (
                    <span className="text-red-500 text-sm">
                      {errors.paciente_id.message?.toString()}
                    </span>
                  )}
                  {isUserTerapeuta && filteredPacientes?.length === 0 && (
                    <span className="text-sm text-gray-600 mt-1">
                      Mostrando apenas pacientes atribuídos a você
                    </span>
                  )}
                  {!isUserTerapeuta &&
                    terapeutaIdParaFiltro &&
                    filteredPacientes?.length === 0 && (
                      <span className="text-amber-600 text-sm">
                        Não há pacientes associados a este terapeuta.
                      </span>
                    )}
                </div>

                {/* Data do Agendamento */}
                <div className="flex flex-col">
                  <label htmlFor="dataAgendamento" className="font-medium mb-1">
                    Data <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="dataAgendamento"
                    render={({ field }) => {
                      // Adicionar verificação para garantir que temos uma data válida
                      const dateValue =
                        field.value instanceof Date &&
                        !isNaN(field.value.getTime())
                          ? field.value
                          : new Date();

                      return (
                        <>
                          <DatePicker
                            id="dataAgendamento"
                            selected={dateValue}
                            onChange={(date: Date | null) => {
                              field.onChange(date || new Date());
                            }}
                            dateFormat="dd/MM/yyyy"
                            locale="pt-BR"
                            className={`border rounded p-2 w-full ${
                              errors.dataAgendamento
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                        </>
                      );
                    }}
                  />
                  {errors.dataAgendamento && (
                    <span className="text-red-500 text-sm">
                      {errors.dataAgendamento.message?.toString()}
                    </span>
                  )}
                </div>

                {/* Horário do Agendamento */}
                <div className="flex flex-col">
                  <label
                    htmlFor="horarioAgendamento"
                    className="font-medium mb-1"
                  >
                    Horário <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="horarioAgendamento"
                    className={`border rounded p-2 ${
                      errors.horarioAgendamento
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    {...register("horarioAgendamento")}
                  >
                    {horariosDisponiveis.map((horario) => (
                      <option key={horario} value={horario}>
                        {horario}
                      </option>
                    ))}
                  </select>
                  {errors.horarioAgendamento && (
                    <span className="text-red-500 text-sm">
                      {errors.horarioAgendamento.message?.toString()}
                    </span>
                  )}
                </div>

                {/* Modalidade do Agendamento */}
                <div className="flex flex-col">
                  <label
                    htmlFor="modalidadeAgendamento"
                    className="font-medium mb-1"
                  >
                    Modalidade <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="modalidadeAgendamento"
                    className={`border rounded p-2 ${
                      errors.modalidadeAgendamento
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    {...register("modalidadeAgendamento")}
                  >
                    {modalidadesAgendamento.map((modalidade) => (
                      <option key={modalidade} value={modalidade}>
                        {modalidade}
                      </option>
                    ))}
                  </select>
                  {errors.modalidadeAgendamento && (
                    <span className="text-red-500 text-sm">
                      {errors.modalidadeAgendamento.message?.toString()}
                    </span>
                  )}
                </div>

                {/* Local do Agendamento */}
                <div className="flex flex-col">
                  <label
                    htmlFor="localAgendamento"
                    className="font-medium mb-1"
                  >
                    Local <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="localAgendamento"
                    className={`border rounded p-2 ${
                      errors.localAgendamento
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    {...register("localAgendamento")}
                    disabled={selectedModalidade === "Online"}
                  >
                    {locaisAgendamento.map((local) => (
                      <option key={local} value={local}>
                        {local}
                      </option>
                    ))}
                  </select>
                  {errors.localAgendamento && (
                    <span className="text-red-500 text-sm">
                      {errors.localAgendamento.message?.toString()}
                    </span>
                  )}
                </div>

                {/* Tipo do Agendamento */}
                <div className="flex flex-col">
                  <label htmlFor="tipoAgendamento" className="font-medium mb-1">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="tipoAgendamento"
                    className={`border rounded p-2 ${
                      errors.tipoAgendamento
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    {...register("tipoAgendamento")}
                  >
                    {tiposAgendamento.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                  {errors.tipoAgendamento && (
                    <span className="text-red-500 text-sm">
                      {errors.tipoAgendamento.message?.toString()}
                    </span>
                  )}
                </div>

                {/* Valor do Agendamento */}
                <div className="flex flex-col">
                  <label
                    htmlFor="valorAgendamento"
                    className="font-medium mb-1"
                  >
                    Valor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="valorAgendamento"
                    className={`border rounded p-2 ${
                      errors.valorAgendamento
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="R$ 0,00"
                    value={valorInput}
                    onChange={(e) => {
                      const maskedValue = maskPrice(e.target.value);
                      setValorInput(maskedValue);

                      // Extrai o valor numérico e define no formulário
                      const numericValue =
                        Number(maskedValue.replace(/[^\d]/g, "")) / 100;
                      setValue("valorAgendamento", numericValue);
                    }}
                  />
                  {errors.valorAgendamento && (
                    <span className="text-red-500 text-sm">
                      {errors.valorAgendamento.message?.toString()}
                    </span>
                  )}
                </div>

                {/* Status do Agendamento */}
                <div className="flex flex-col">
                  <label
                    htmlFor="statusAgendamento"
                    className="font-medium mb-1"
                  >
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="statusAgendamento"
                    className={`border rounded p-2 ${
                      errors.statusAgendamento
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    {...register("statusAgendamento")}
                  >
                    {statusAgendamento.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {errors.statusAgendamento && (
                    <span className="text-red-500 text-sm">
                      {errors.statusAgendamento.message?.toString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Opção para editar todos os agendamentos recorrentes */}
              {(agendamentoAtualizado?.recurrenceId ||
                agendamento?.recurrenceId) && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-amber-800">
                      {numeroRecorrencias > 0
                        ? `Este é um agendamento com ${numeroRecorrencias} recorrências`
                        : "Este é um agendamento recorrente"}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        Editar todas as recorrências
                      </span>
                      <Switch
                        checked={editarRecorrencia}
                        onChange={setEditarRecorrencia}
                        className={`${
                          editarRecorrencia ? "bg-azul" : "bg-gray-300"
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                      >
                        <span
                          className={`${
                            editarRecorrencia
                              ? "translate-x-6"
                              : "translate-x-1"
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>
                  </div>
                  <p className="text-sm text-amber-700 mt-2">
                    {editarRecorrencia
                      ? "As alterações serão aplicadas a todos os agendamentos desta recorrência."
                      : "As alterações serão aplicadas apenas a este agendamento."}
                  </p>

                  {/* Opção para alterar o dia da semana quando editando recorrências */}
                  {editarRecorrencia && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-blue-800">
                          Alterar dia da semana
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            Aplicar novo dia
                          </span>
                          <Switch
                            checked={alterarDiaSemana}
                            onChange={setAlterarDiaSemana}
                            className={`${
                              alterarDiaSemana ? "bg-blue-600" : "bg-gray-300"
                            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                          >
                            <span
                              className={`${
                                alterarDiaSemana
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                          </Switch>
                        </div>
                      </div>

                      {alterarDiaSemana && (
                        <div className="flex flex-col space-y-2">
                          <label className="text-sm font-medium text-blue-800">
                            Novo dia da semana:
                          </label>
                          <select
                            value={novoDiaSemana}
                            onChange={(e) =>
                              setNovoDiaSemana(Number(e.target.value))
                            }
                            className="border border-blue-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {diasDaSemana.map((dia) => (
                              <option key={dia.value} value={dia.value}>
                                {dia.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-blue-600">
                            Todos os agendamentos da recorrência serão movidos
                            para{" "}
                            {
                              diasDaSemana.find(
                                (d) => d.value === novoDiaSemana,
                              )?.label
                            }
                            .
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Observações do Agendamento */}
              <div className="flex flex-col">
                <label
                  htmlFor="observacoesAgendamento"
                  className="font-medium mb-1"
                >
                  Observações
                </label>
                <textarea
                  id="observacoesAgendamento"
                  className="border rounded p-2 min-h-[80px]"
                  {...register("observacoesAgendamento")}
                />
                {errors.observacoesAgendamento && (
                  <span className="text-red-500 text-sm">
                    {errors.observacoesAgendamento.message?.toString()}
                  </span>
                )}
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-azul text-white rounded hover:bg-sky-600 disabled:bg-gray-400 min-w-[150px] flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {loadingMessage || "Salvando..."}
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
