import React from "react";
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
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useDispatch } from "react-redux";
import { AppDispatch } from "store/store";
import {
  addAgendamento,
  addAgendamentoRecorrente,
} from "store/agendamentosSlice";
import { z } from "zod";
import { maskPrice } from "utils/formatter";

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
  const [selectedDiasSemana, setSelectedDiasSemana] = useState<DiaSemana[]>([]);
  const [valorInput, setValorInput] = useState<string>("");

  const { pacientes } = useFetchPacientes();
  const { terapeutas } = useFetchTerapeutas();

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
    defaultValues: {
      paciente_id: "",
      terapeuta_id: "",
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
    },
  });

  // Selecionar paciente e terapeuta
  const selectedTerapeutaId = watch("terapeuta_id");
  const selectedModalidade = watch("modalidadeAgendamento");
  const selectedPeriodicidade = watch("periodicidade");

  // Limpar o paciente selecionado quando mudar de terapeuta
  useEffect(() => {
    if (selectedTerapeutaId) {
      setValue("paciente_id", "");
    }
  }, [selectedTerapeutaId, setValue]);

  // Filtrar pacientes pelo terapeuta selecionado
  const filteredPacientes = selectedTerapeutaId
    ? pacientes?.filter((p) => p.terapeuta_id === selectedTerapeutaId)
    : [];

  // Efeito para ajustar o local de agendamento quando a modalidade muda
  useEffect(() => {
    if (selectedModalidade === "Online") {
      setValue("localAgendamento", "Não Precisa de Sala");
    }
  }, [selectedModalidade, setValue]);

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

    try {
      let requestData = { ...data };

      // Se não tiver periodicidade, cria um agendamento simples
      if (data.periodicidade === "Não repetir") {
        delete requestData.diasDaSemana;
        delete requestData.dataFimRecorrencia;

        // Formatar a data para ISO string (apenas a parte da data)
        const formattedRequestData = {
          ...requestData,
          dataAgendamento: format(data.dataAgendamento, "yyyy-MM-dd"),
        };

        // Usando o Redux action em vez do axios diretamente
        await dispatch(addAgendamento(formattedRequestData)).unwrap();

        // Reiniciar o formulário e chamar callbacks sem exibir toast
        reset();
        onSuccess(); // O componente pai será responsável pelo toast
        onClose();
      }
      // Caso contrário, cria agendamentos recorrentes
      else {
        // Criar um ID único para a recorrência
        const recurrenceId = crypto.randomUUID();

        // Formatar as datas para ISO string
        const formattedDataAgendamento = format(
          data.dataAgendamento,
          "yyyy-MM-dd",
        );
        const formattedDataFim = format(
          data.dataFimRecorrencia as Date,
          "yyyy-MM-dd",
        );

        // Preparar objeto base de agendamento
        const agendamentoBase = {
          paciente_id: data.paciente_id,
          terapeuta_id: data.terapeuta_id,
          dataAgendamento: formattedDataAgendamento,
          horarioAgendamento: data.horarioAgendamento,
          localAgendamento: data.localAgendamento,
          modalidadeAgendamento: data.modalidadeAgendamento,
          tipoAgendamento: data.tipoAgendamento,
          valorAgendamento: data.valorAgendamento,
          statusAgendamento: data.statusAgendamento,
          observacoesAgendamento: data.observacoesAgendamento,
        };

        // Usando o Redux action para agendamentos recorrentes
        await dispatch(
          addAgendamentoRecorrente({
            recurrenceId,
            agendamentoBase,
            diasDaSemana: data.diasDaSemana as DiaSemana[],
            dataFimRecorrencia: formattedDataFim,
            periodicidade: data.periodicidade,
          }),
        ).unwrap();

        // Reiniciar o formulário e chamar callbacks sem exibir toast
        reset();
        onSuccess(); // O componente pai será responsável pelo toast
        onClose();
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
    }
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="bg-black/60 inset-0 fixed z-10" />
      <Dialog.Content className="fixed z-10 w-[95%] max-w-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white py-8 px-10 text-gray-900 shadow-lg rounded-lg max-h-[90vh] overflow-y-auto sm:px-4 sm:py-6 sm:max-h-[95vh]">
        <Dialog.Title className="text-2xl font-bold mb-4 text-center text-azul">
          Novo Agendamento
        </Dialog.Title>

        <Dialog.Close
          className="absolute right-6 top-6 bg-transparent text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          <X size={24} weight="bold" />
        </Dialog.Close>

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
                    minDate={new Date()}
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
              {isSubmitting ? "Salvando..." : "Salvar Agendamento"}
            </button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
