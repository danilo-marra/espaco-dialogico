import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as Dialog from "@radix-ui/react-dialog";
import DatePicker, { registerLocale } from "react-datepicker";
import ptBR from "date-fns/locale/pt-BR";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { AppDispatch } from "store/store";
import {
  addAgendamento,
  addAgendamentoRecorrente,
} from "store/agendamentosSlice";
import { agendamentoSchema } from "./agendamentoSchema";
import useAuth from "hooks/useAuth";
import { useFetchPacientes } from "hooks/useFetchPacientes";
import { useFetchTerapeutas } from "hooks/useFetchTerapeutas";
import { useTerapeutaData } from "hooks/useTerapeutaData";
import { mutate } from "swr";
import { X } from "@phosphor-icons/react";
import "react-datepicker/dist/react-datepicker.css";
import { maskPrice } from "utils/formatter";
import { formatDateForAPI } from "utils/dateUtils";

// Função utilitária para gerar UUID compatível
function generateUUID(): string {
  // Se crypto.randomUUID estiver disponível (Node.js 16+ ou navegadores modernos)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: gerar UUID v4 manualmente
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Registrar locale pt-BR
registerLocale("pt-BR", ptBR as any);

// Tipos de agendamento disponíveis
const tiposAgendamento = [
  "Sessão",
  "Orientação Parental",
  "Visita Escolar",
  "Supervisão",
  "Outros",
];

// Status de agendamento
const statusAgendamento = ["Confirmado", "Cancelado"];

// Modalidades de atendimento
const modalidadesAgendamento = ["Presencial", "Online"];

// Locais de agendamento
const locaisAgendamento = ["Sala Verde", "Sala Azul", "Não Precisa de Sala"];

// Periodicidade de agendamento
const periodicidadeAgendamento = ["Não repetir", "Semanal", "Quinzenal"];

// Dias da semana
const diasDaSemana = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

// Definição do tipo para os dias da semana
type DiaSemana = (typeof diasDaSemana)[number];

// Horários disponíveis (8h às 20h, a cada 30min)
const horariosDisponiveis: string[] = [];
for (let hora = 8; hora <= 20; hora++) {
  horariosDisponiveis.push(`${hora.toString().padStart(2, "0")}:00`);
  horariosDisponiveis.push(`${hora.toString().padStart(2, "0")}:30`);
}

// Tipo para o formulário baseado no schema Zod
type AgendamentoFormInputs = z.infer<typeof agendamentoSchema>;

// Tipo para as props do componente
type NovoAgendamentoModalProps = {
  initialDate?: Date;
  onSuccess: () => void;
  onClose: () => void;
};

export function NovoAgendamentoModal({
  initialDate,
  onSuccess,
  onClose,
}: NovoAgendamentoModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [selectedDiasSemana, setSelectedDiasSemana] = useState<DiaSemana[]>([]);
  const [valorInput, setValorInput] = useState<string>("");
  const [progressPercentage, setProgressPercentage] = useState<number>(0); // Estado para barra de progresso
  const [showProgress, setShowProgress] = useState<boolean>(false); // Estado para mostrar/ocultar barra de progresso

  const { user } = useAuth();
  const isTerapeuta = user?.role === "terapeuta";

  // Para terapeutas, usar dados específicos
  const {
    terapeuta: currentTerapeuta,
    pacientes: terapeutaPacientes,
    isLoading: terapeutaDataLoading,
  } = useTerapeutaData();

  // Para admin/secretaria, usar dados completos
  const { pacientes: allPacientes } = useFetchPacientes();
  const { terapeutas } = useFetchTerapeutas();

  // Determinar quais dados usar baseado no role
  const pacientes = isTerapeuta ? terapeutaPacientes : allPacientes;

  // Configuração do formulário com zod e react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<AgendamentoFormInputs>({
    resolver: zodResolver(agendamentoSchema),
    mode: "onChange", // Validação em tempo real
    defaultValues: {
      paciente_id: "",
      terapeuta_id: isTerapeuta ? currentTerapeuta?.id || "" : "",
      dataAgendamento: initialDate || null,
      horarioAgendamento: "",
      localAgendamento: "Sala Verde",
      modalidadeAgendamento: "Presencial",
      tipoAgendamento: "Sessão",
      valorAgendamento: 0,
      statusAgendamento: "Confirmado",
      observacoesAgendamento: "",
      periodicidade: "Não repetir",
      diasDaSemana: [] as DiaSemana[],
      dataFimRecorrencia: null,
      sessaoRealizada: false,
      falta: false,
    },
  });

  // Efeito para definir o terapeuta automaticamente se for usuário terapeuta
  useEffect(() => {
    if (isTerapeuta && currentTerapeuta?.id) {
      setValue("terapeuta_id", currentTerapeuta.id);
    }
  }, [isTerapeuta, currentTerapeuta, setValue]);

  // Selecionar paciente e terapeuta
  const selectedTerapeutaId = watch("terapeuta_id");
  const selectedModalidade = watch("modalidadeAgendamento");
  const selectedPeriodicidade = watch("periodicidade");
  const selectedDataAgendamento = watch("dataAgendamento");
  const selectedDataFimRecorrencia = watch("dataFimRecorrencia");
  const selectedDiasDaSemana = watch("diasDaSemana");
  const selectedStatus = watch("statusAgendamento");

  // CORREÇÃO: Função para calcular número de agendamentos recorrentes
  // PROBLEMA: Lógica diferente da API - não considerava a periodicidade corretamente
  // SOLUÇÃO: Replicar exatamente a lógica da API que considera intervalos de periodicidade
  // RESULTADO: Agora retorna a quantidade exata que será criada pela API
  const calcularNumeroRecorrencias = () => {
    if (
      selectedPeriodicidade === "Não repetir" ||
      !selectedDataAgendamento ||
      !selectedDataFimRecorrencia ||
      !selectedDiasDaSemana ||
      selectedDiasDaSemana.length === 0
    ) {
      return { recorrencias: 0, limitado: false };
    }

    const dataInicio = new Date(selectedDataAgendamento);
    const dataFim = new Date(selectedDataFimRecorrencia);

    if (dataInicio >= dataFim) return { recorrencias: 0, limitado: false };

    // Mapear dias da semana para números
    const diasDaSemanaMap = {
      Domingo: 0,
      "Segunda-feira": 1,
      "Terça-feira": 2,
      "Quarta-feira": 3,
      "Quinta-feira": 4,
      "Sexta-feira": 5,
      Sábado: 6,
    };

    const diasDaSemanaNumeros = selectedDiasDaSemana.map(
      (dia) => diasDaSemanaMap[dia],
    );

    // Determinar o intervalo da periodicidade (igual à API)
    const intervaloDias = selectedPeriodicidade === "Semanal" ? 7 : 14;

    // Contar agendamentos usando a mesma lógica da API
    const dataAgendamentos = [];
    let currentDate = new Date(dataInicio);

    while (currentDate <= dataFim) {
      const diaDaSemana = currentDate.getDay();

      if (diasDaSemanaNumeros.includes(diaDaSemana)) {
        dataAgendamentos.push(new Date(currentDate));
      }

      // CORREÇÃO CRÍTICA: Usar a mesma lógica da API para avançar datas
      // Se adicionamos um agendamento, avançar pelo intervalo da periodicidade
      // Se não adicionamos, avançar apenas 1 dia
      if (
        dataAgendamentos.length > 0 &&
        dataAgendamentos[dataAgendamentos.length - 1].getTime() ===
          currentDate.getTime()
      ) {
        // Adicionar o intervalo completo quando encontramos um dia válido
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + intervaloDias);
      } else {
        // Caso contrário, avançar apenas um dia para verificar o próximo
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const numeroRecorrencias = dataAgendamentos.length;

    // Limite máximo de 35 agendamentos
    const LIMITE_MAXIMO = 35;
    const limitado = numeroRecorrencias > LIMITE_MAXIMO;
    const numeroFinal = limitado ? LIMITE_MAXIMO : numeroRecorrencias;

    return {
      recorrencias: numeroFinal,
      original: numeroRecorrencias,
      limitado,
    };
  };

  const {
    recorrencias: numeroRecorrencias,
    original: _numeroOriginal,
    limitado: foiLimitado,
  } = calcularNumeroRecorrencias();

  // Limpar o paciente selecionado quando mudar de terapeuta
  useEffect(() => {
    if (selectedTerapeutaId) {
      setValue("paciente_id", "", { shouldValidate: true });
    }
  }, [selectedTerapeutaId, setValue]);

  // Filtrar pacientes pelo terapeuta selecionado ou mostrar todos os pacientes do terapeuta logado
  const filteredPacientes = isTerapeuta
    ? pacientes // Para terapeutas, já vem filtrado do hook
    : selectedTerapeutaId
      ? pacientes?.filter((p) => p.terapeuta_id === selectedTerapeutaId)
      : [];

  // Efeito para ajustar o local de agendamento quando a modalidade muda
  useEffect(() => {
    if (selectedModalidade === "Online") {
      setValue("localAgendamento", "Não Precisa de Sala");
    }
  }, [selectedModalidade, setValue]);

  // Efeito para desmarcar sessaoRealizada e falta automaticamente quando status for "Cancelado"
  useEffect(() => {
    if (selectedStatus === "Cancelado") {
      setValue("sessaoRealizada", false);
      setValue("falta", false);
    }
  }, [selectedStatus, setValue]);

  // Manipular alterações nos dias da semana selecionados
  const handleDiaSemanaChange = (dia: DiaSemana, checked: boolean) => {
    const currentDias = watch("diasDaSemana") || [];

    if (checked) {
      const updatedDias = [...currentDias, dia] as DiaSemana[];
      setValue("diasDaSemana", updatedDias);
      setSelectedDiasSemana(updatedDias);
    } else {
      const updatedDias = currentDias.filter((d) => d !== dia);
      setValue("diasDaSemana", updatedDias);
      setSelectedDiasSemana(updatedDias);
    }
  };

  // Handler para envio do formulário
  const onSubmit = async (data: AgendamentoFormInputs) => {
    setIsSubmitting(true);
    setLoadingMessage("Preparando agendamento...");

    try {
      let requestData = { ...data };

      // Se não tiver periodicidade, cria um agendamento simples
      if (data.periodicidade === "Não repetir") {
        setLoadingMessage("Criando agendamento...");

        delete requestData.diasDaSemana;
        delete requestData.dataFimRecorrencia;

        // Formatar a data para ISO string (apenas a parte da data)
        const formattedRequestData = {
          ...requestData,
          dataAgendamento: formatDateForAPI(data.dataAgendamento),
          sessaoRealizada: data.sessaoRealizada, // garantir envio
        };

        // Usando o Redux action em vez do axios diretamente
        await dispatch(addAgendamento(formattedRequestData)).unwrap();

        setLoadingMessage("Finalizando...");

        // Reiniciar o formulário e chamar callbacks sem exibir toast
        reset();

        // Revalidar manualmente os dados de sessões para agendamentos simples também
        mutate("/sessoes");

        onSuccess(); // O componente pai será responsável pelo toast
        onClose();
      }
      // Caso contrário, cria agendamentos recorrentes
      else {
        // Ativar barra de progresso para agendamentos recorrentes
        setShowProgress(true);
        setProgressPercentage(10);

        setLoadingMessage(
          `Criando ${numeroRecorrencias} agendamentos recorrentes...`,
        );

        // Criar um ID único para a recorrência
        const recurrenceId = generateUUID();

        setProgressPercentage(25);

        // Formatar as datas para ISO string
        const formattedDataAgendamento = formatDateForAPI(data.dataAgendamento);
        const formattedDataFim = formatDateForAPI(
          data.dataFimRecorrencia as Date,
        );

        // Preparar objeto base de agendamento - usando estrutura mais explícita
        const agendamentoBase = {
          paciente_id: String(data.paciente_id || ""),
          terapeuta_id: String(data.terapeuta_id || ""),
          dataAgendamento: formattedDataAgendamento,
          horarioAgendamento: String(data.horarioAgendamento || ""),
          localAgendamento: String(data.localAgendamento || ""),
          modalidadeAgendamento: String(data.modalidadeAgendamento || ""),
          tipoAgendamento: String(data.tipoAgendamento || ""),
          valorAgendamento: Number(data.valorAgendamento || 0),
          statusAgendamento: String(data.statusAgendamento || ""),
          observacoesAgendamento: String(data.observacoesAgendamento || ""),
          sessaoRealizada: data.sessaoRealizada, // garantir envio
        };

        // Verificar se terapeuta_id e paciente_id estão presentes
        if (
          !agendamentoBase.terapeuta_id ||
          agendamentoBase.terapeuta_id.trim() === ""
        ) {
          toast.error("Erro: Selecione um terapeuta");
          setIsSubmitting(false);
          setLoadingMessage("");
          setShowProgress(false);
          setProgressPercentage(0);
          return;
        }

        if (
          !agendamentoBase.paciente_id ||
          agendamentoBase.paciente_id.trim() === ""
        ) {
          toast.error("Erro: Selecione um paciente");
          setIsSubmitting(false);
          setLoadingMessage("");
          setShowProgress(false);
          setProgressPercentage(0);
          return;
        }

        setProgressPercentage(50);

        // Usando o Redux action para agendamentos recorrentes
        const result = await dispatch(
          addAgendamentoRecorrente({
            recurrenceId,
            agendamentoBase,
            diasDaSemana: data.diasDaSemana as DiaSemana[],
            dataFimRecorrencia: formattedDataFim,
            periodicidade: data.periodicidade,
          }),
        ).unwrap();

        setProgressPercentage(75);
        setLoadingMessage("Criando sessões correspondentes...");

        // Aguardar um pouco para mostrar a mensagem
        await new Promise((resolve) => setTimeout(resolve, 500));

        setProgressPercentage(90);
        setLoadingMessage("Finalizando...");

        // Reiniciar o formulário e chamar callbacks sem exibir toast
        reset();

        // Revalidar manualmente os dados de sessões
        mutate("/sessoes");

        setProgressPercentage(100);

        // Mostrar mensagem personalizada se houve limitação
        if (result.metadata?.limiteLabelizado) {
          toast.success(
            `${result.metadata.numeroFinalCriado} agendamentos criados (limitado a máximo de 35)`,
            { autoClose: 5000 },
          );
          // Chamar onSuccess para garantir o refresh, mesmo com limitação
          onSuccess();
          onClose();
        } else {
          onSuccess();
          onClose();
        }
      }
    } catch (error) {
      // Melhor tratamento de erro
      const errorMessage =
        typeof error === "string"
          ? error
          : error.message || "Erro ao criar agendamento";
      toast.error(`Erro ao criar agendamento: ${errorMessage}`);
      console.error("Erro ao criar agendamento:", error);
    } finally {
      setIsSubmitting(false);
      setLoadingMessage("");
      setShowProgress(false);
      setProgressPercentage(0);
    }
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="bg-black/60 inset-0 fixed z-50" />
      <Dialog.Content className="fixed z-50 w-[95%] max-w-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white py-8 px-10 text-gray-900 shadow-lg rounded-lg max-h-[90vh] overflow-y-auto sm:px-4 sm:py-6 sm:max-h-[95vh]">
        <Dialog.Title className="text-2xl font-bold mb-4 text-center text-azul">
          Novo Agendamento
        </Dialog.Title>

        <Dialog.Close
          className="absolute right-6 top-6 bg-transparent text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          <X size={24} weight="bold" />
        </Dialog.Close>

        {/* Barra de progresso para criação de recorrências */}
        {showProgress && (
          <div className="mb-6 bg-gray-100 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Criando agendamentos recorrentes...
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seleção de Terapeuta */}
            <div className="flex flex-col">
              <label htmlFor="terapeuta_id" className="font-medium mb-1">
                Terapeuta <span className="text-red-500">*</span>
              </label>
              {isTerapeuta ? (
                // Para terapeutas, mostrar apenas o nome (read-only)
                <div className="border rounded p-2 bg-gray-100 text-gray-700">
                  {terapeutaDataLoading
                    ? "Carregando dados do terapeuta..."
                    : currentTerapeuta?.nome || "Terapeuta não encontrado"}
                </div>
              ) : (
                // Para admin/secretaria, mostrar seleção completa
                <select
                  id="terapeuta_id"
                  className={`border rounded p-2 ${
                    errors.terapeuta_id ? "border-red-500" : "border-gray-300"
                  }`}
                  {...register("terapeuta_id")}
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
              )}
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
                disabled={isTerapeuta ? false : !selectedTerapeutaId}
              >
                <option value="">
                  {isTerapeuta
                    ? "Selecione um paciente"
                    : selectedTerapeutaId
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
              {((isTerapeuta && filteredPacientes?.length === 0) ||
                (!isTerapeuta &&
                  selectedTerapeutaId &&
                  filteredPacientes?.length === 0)) && (
                <span className="text-amber-600 text-sm">
                  {isTerapeuta
                    ? "Você não tem pacientes associados."
                    : "Não há pacientes associados a este terapeuta."}
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
                render={({ field }) => (
                  <DatePicker
                    id="dataAgendamento"
                    selected={field.value}
                    onChange={(date: Date | null) => {
                      field.onChange(date);
                    }}
                    dateFormat="dd/MM/yyyy"
                    locale="pt-BR"
                    placeholderText="Selecione uma data"
                    className={`border rounded p-2 w-full ${
                      errors.dataAgendamento
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                )}
              />
              {errors.dataAgendamento && (
                <span className="text-red-500 text-sm">
                  {errors.dataAgendamento.message?.toString()}
                </span>
              )}
            </div>

            {/* Horário do Agendamento */}
            <div className="flex flex-col">
              <label htmlFor="horarioAgendamento" className="font-medium mb-1">
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
                <option value="">Selecione um horário</option>
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
              <label htmlFor="localAgendamento" className="font-medium mb-1">
                Local <span className="text-red-500">*</span>
              </label>
              <select
                id="localAgendamento"
                className={`border rounded p-2 ${
                  errors.localAgendamento ? "border-red-500" : "border-gray-300"
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
                  errors.tipoAgendamento ? "border-red-500" : "border-gray-300"
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
              <label htmlFor="valorAgendamento" className="font-medium mb-1">
                Valor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="valorAgendamento"
                className={`border rounded p-2 ${
                  errors.valorAgendamento ? "border-red-500" : "border-gray-300"
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
              <label htmlFor="statusAgendamento" className="font-medium mb-1">
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

            {/* Sessão Realizada */}
            <div className="flex items-center col-span-1 md:col-span-2">
              <Controller
                name="sessaoRealizada"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="sessaoRealizada"
                    className="mr-2 h-4 w-4"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={selectedStatus === "Cancelado"}
                  />
                )}
              />
              <label
                htmlFor="sessaoRealizada"
                className={`font-medium ${selectedStatus === "Cancelado" ? "text-gray-400" : ""}`}
              >
                Sessão Realizada (gera registro de sessão)
                {selectedStatus === "Cancelado" && (
                  <span className="text-sm text-gray-500 block">
                    Agendamentos cancelados não podem ter sessão realizada
                  </span>
                )}
              </label>
            </div>

            {/* Falta / desmarcação com menos de 24h (sempre visível) */}
            <div className="flex items-center col-span-1 md:col-span-2">
              <input
                type="checkbox"
                id="falta"
                className="mr-2 h-4 w-4"
                disabled={selectedStatus === "Cancelado"}
                {...register("falta")}
              />
              <label
                htmlFor="falta"
                className={`font-medium ${selectedStatus === "Cancelado" ? "text-gray-400" : "text-orange-600"}`}
              >
                Falta / desmarcação com menos de 24h
              </label>
            </div>

            {/* Periodicidade do Agendamento */}
            <div className="flex flex-col">
              <label htmlFor="periodicidade" className="font-medium mb-1">
                Periodicidade
              </label>
              <select
                id="periodicidade"
                className="border rounded p-2 border-gray-300"
                {...register("periodicidade")}
              >
                {periodicidadeAgendamento.map((periodicidade) => (
                  <option key={periodicidade} value={periodicidade}>
                    {periodicidade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dias da Semana (apenas se periodicidade for Semanal ou Quinzenal) */}
          {selectedPeriodicidade !== "Não repetir" && (
            <div className="flex flex-col">
              <label htmlFor="diasDaSemana" className="font-medium mb-2">
                Dias da Semana <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {diasDaSemana.map((dia) => (
                  <div key={dia} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`dia-${dia}`}
                      className="mr-2 h-4 w-4"
                      checked={selectedDiasSemana.includes(dia)}
                      onChange={(e) =>
                        handleDiaSemanaChange(dia, e.target.checked)
                      }
                    />
                    <label htmlFor={`dia-${dia}`}>{dia}</label>
                  </div>
                ))}
              </div>
              {errors.diasDaSemana && (
                <span className="text-red-500 text-sm">
                  {errors.diasDaSemana.message?.toString()}
                </span>
              )}
            </div>
          )}

          {/* Data Fim da Recorrência (apenas se periodicidade for Semanal ou Quinzenal) */}
          {selectedPeriodicidade !== "Não repetir" && (
            <div className="flex flex-col">
              <label htmlFor="dataFimRecorrencia" className="font-medium mb-1">
                Data Fim da Recorrência <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="dataFimRecorrencia"
                render={({ field }) => (
                  <DatePicker
                    id="dataFimRecorrencia"
                    selected={field.value}
                    onChange={(date: Date | null) => {
                      field.onChange(date);
                    }}
                    dateFormat="dd/MM/yyyy"
                    locale="pt-BR"
                    className="border rounded p-2 w-full border-gray-300"
                    placeholderText="Selecione a data final"
                  />
                )}
              />
              {errors.dataFimRecorrencia && (
                <span className="text-red-500 text-sm">
                  {errors.dataFimRecorrencia.message?.toString()}
                </span>
              )}

              {/* Exibir número de agendamentos */}
              {numeroRecorrencias > 0 && (
                <div
                  className={`mt-2 p-2 rounded text-sm ${
                    foiLimitado
                      ? "bg-orange-100 text-orange-700 border border-orange-300"
                      : numeroRecorrencias > 20
                        ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                        : "bg-blue-100 text-blue-700 border border-blue-300"
                  }`}
                >
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-4 4a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">
                      {foiLimitado ? (
                        <>
                          Serão criados {numeroRecorrencias} agendamentos
                          (limite máximo)
                        </>
                      ) : (
                        <>Serão criados {numeroRecorrencias} agendamentos</>
                      )}
                    </span>
                  </div>
                  {foiLimitado && (
                    <div className="mt-1 text-xs">
                      ⚠️ O período selecionado excede o limite máximo de 35
                      agendamentos. O sistema criará automaticamente apenas os
                      primeiros 35 agendamentos.
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
              className="px-4 py-2 bg-azul text-white rounded hover:bg-sky-600 disabled:bg-gray-400 min-w-[160px] flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {loadingMessage || "Salvando..."}
                </>
              ) : (
                "Salvar Agendamento"
              )}
            </button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
