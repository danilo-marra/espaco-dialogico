import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useFetchPacientes } from "../../hooks/useFetchPacientes";
import { useFetchTerapeutas } from "../../hooks/useFetchTerapeutas";
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
  const [valorInput, setValorInput] = useState<string>("");
  const [editarRecorrencia, setEditarRecorrencia] = useState(false);
  const [alterarDiaSemana, setAlterarDiaSemana] = useState(false);
  const [novoDiaSemana, setNovoDiaSemana] = useState<number>(0); // 0 = Domingo, 1 = Segunda, etc.
  const [agendamentoAtualizado, setAgendamentoAtualizado] =
    useState<Agendamento | null>(null);
  const [isLoadingAgendamento, setIsLoadingAgendamento] = useState(false);

  // Buscar todos os agendamentos do Redux para ter dados atualizados
  const agendamentos = useSelector(
    (state: RootState) => state.agendamentos.data,
  );

  const { pacientes } = useFetchPacientes();
  const { terapeutas } = useFetchTerapeutas();

  // Configuração do formulário com zod e react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
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
    }
  }, [open, agendamento?.id, agendamentos, agendamento]);

  // Carregar os dados do agendamento quando o modal abrir ou quando o agendamento atualizado for obtido
  useEffect(() => {
    // Usar agendamentoAtualizado se disponível, caso contrário usar agendamento das props
    const agendamentoToUse = agendamentoAtualizado || agendamento;

    if (agendamentoToUse && !isLoadingAgendamento) {
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
    }
  }, [agendamento, agendamentoAtualizado, setValue, isLoadingAgendamento]);

  // Selecionar paciente e terapeuta
  const selectedTerapeutaId = watch("terapeuta_id");
  const selectedModalidade = watch("modalidadeAgendamento");

  // Efeito para ajustar o local de agendamento quando a modalidade muda
  useEffect(() => {
    if (selectedModalidade === "Online") {
      setValue("localAgendamento", "Não Precisa de Sala");
    }
  }, [selectedModalidade, setValue]);

  // Filtrar pacientes pelo terapeuta selecionado
  const filteredPacientes = selectedTerapeutaId
    ? pacientes?.filter((p) => p.terapeuta_id === selectedTerapeutaId)
    : [];

  // Handler para envio do formulário
  const onSubmit = async (data: AgendamentoFormInputs) => {
    setIsSubmitting(true);

    try {
      // Formatar a data para o formato esperado pela API
      const formattedData = {
        ...data,
        dataAgendamento: formatDateForAPI(data.dataAgendamento),
      };

      // Se o agendamento tem recorrência e o usuário optou por editar todas as recorrências
      const agendamentoToUse = agendamentoAtualizado || agendamento;

      if (agendamentoToUse.recurrenceId && editarRecorrencia) {
        // Preparar dados adicionais se alterando dia da semana
        const dadosAtualizacao = {
          ...formattedData,
          updateAllRecurrences: true,
          recurrenceId: agendamentoToUse.recurrenceId,
          ...(alterarDiaSemana && { novoDiaSemana }),
        };

        // Enviar uma requisição para atualizar todos os agendamentos com o mesmo recurrenceId
        await dispatch(
          updateAgendamento({
            id: agendamentoToUse.id,
            agendamento: dadosAtualizacao,
          }),
        ).unwrap();

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

      // Recarregar dados após salvar
      dispatch(fetchAgendamentos());

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
                    disabled={!selectedTerapeutaId}
                  >
                    <option value="">
                      {selectedTerapeutaId
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
                  {selectedTerapeutaId && filteredPacientes?.length === 0 && (
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
                      Este é um agendamento recorrente
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
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-azul text-white rounded hover:bg-sky-600 disabled:bg-gray-400"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
