import { X } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { maskDate, maskPrice, calcularRepasse } from "utils/formatter";
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { type AppDispatch } from "store/store";
import { addSessao } from "store/sessoesSlice";
import { useFetchTerapeutas } from "hooks/useFetchTerapeutas";
import { useFetchPacientes } from "hooks/useFetchPacientes";
import { Sessao } from "tipos";

import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { SessaoFormInputs, SessaoFormSchema } from "./sessaoSchema";
import { toast } from "sonner";

interface NovaSessaoModalProps {
  onSuccess?: () => void;
  onClose: () => void;
}

export function NovaSessaoModal({ onSuccess, onClose }: NovaSessaoModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { terapeutas } = useFetchTerapeutas();
  const { pacientes } = useFetchPacientes();

  // Estados para os inputs de data
  const [inputDataSessao1, setInputDataSessao1] = useState<string>("");
  const [inputDataSessao2, setInputDataSessao2] = useState<string>("");
  const [inputDataSessao3, setInputDataSessao3] = useState<string>("");
  const [inputDataSessao4, setInputDataSessao4] = useState<string>("");
  const [inputDataSessao5, setInputDataSessao5] = useState<string>("");
  const [inputDataSessao6, setInputDataSessao6] = useState<string>("");
  const [valorInput, setValorInput] = useState<string>("");

  // Estados para valor de repasse personalizado
  const [usarRepassePersonalizado, setUsarRepassePersonalizado] =
    useState<boolean>(false);
  const [valorRepasseInput, setValorRepasseInput] = useState<string>("");

  // Estado para armazenar o terapeuta selecionado
  const [selectedTerapeuta, setSelectedTerapeuta] = useState<any>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<SessaoFormInputs>({
    resolver: zodResolver(SessaoFormSchema),
    defaultValues: {
      statusSessao: "Pagamento Pendente",
    },
  });

  // Observar o terapeuta selecionado para filtrar pacientes
  const selectedTerapeutaId = watch("terapeuta_id");
  const valorSessao = watch("valorSessao");

  // Efeito para atualizar o terapeuta selecionado
  useEffect(() => {
    if (selectedTerapeutaId && terapeutas) {
      const terapeuta = terapeutas.find((t) => t.id === selectedTerapeutaId);
      setSelectedTerapeuta(terapeuta);

      // Atualizar o valor de repasse automático quando o terapeuta ou valor mudar
      if (terapeuta && valorSessao && !usarRepassePersonalizado) {
        const repasseCalculado = calcularRepasse(
          valorSessao,
          terapeuta.dt_entrada,
        );
        setValorRepasseInput(
          `R$ ${repasseCalculado.toFixed(2).replace(".", ",")}`,
        );
      }
    }
  }, [selectedTerapeutaId, terapeutas, valorSessao, usarRepassePersonalizado]);

  // Filtrar pacientes pelo terapeuta selecionado
  const filteredPacientes = selectedTerapeutaId
    ? pacientes?.filter((p) => p.terapeuta_id === selectedTerapeutaId)
    : pacientes;

  // Efeito para atualizar o valor de repasse quando o checkbox é alterado
  useEffect(() => {
    if (!usarRepassePersonalizado && selectedTerapeuta && valorSessao) {
      // Se não usar repasse personalizado, defina como undefined para usar o cálculo automático
      setValue("valorRepasse", undefined);

      // Atualiza o input para mostrar o valor calculado automaticamente
      const repasseCalculado = calcularRepasse(
        valorSessao,
        selectedTerapeuta.dt_entrada,
      );
      setValorRepasseInput(
        `R$ ${repasseCalculado.toFixed(2).replace(".", ",")}`,
      );
    }
  }, [usarRepassePersonalizado, setValue, selectedTerapeuta, valorSessao]);

  async function handleCreateNewSessao(data: SessaoFormInputs) {
    try {
      // Se não estiver usando valor personalizado, defina como undefined
      if (!usarRepassePersonalizado) {
        data.valorRepasse = undefined;
      }

      // Preparar os dados para envio usando Omit<Sessao, "id" | "pacienteInfo" | "terapeutaInfo">
      const sessaoData: Omit<Sessao, "id" | "pacienteInfo" | "terapeutaInfo"> =
        {
          terapeuta_id: data.terapeuta_id,
          paciente_id: data.paciente_id,
          tipoSessao: data.tipoSessao,
          valorSessao: data.valorSessao,
          valorRepasse: data.valorRepasse,
          statusSessao: data.statusSessao,
          dtSessao1: data.dtSessao1,
          dtSessao2: data.dtSessao2 || null,
          dtSessao3: data.dtSessao3 || null,
          dtSessao4: data.dtSessao4 || null,
          dtSessao5: data.dtSessao5 || null,
          dtSessao6: data.dtSessao6 || null,
        };

      // Enviar dados para a API
      await dispatch(addSessao(sessaoData)).unwrap();

      // Exibir mensagem de sucesso
      toast.success("Sessão cadastrada com sucesso!");

      // Limpar formulário
      reset();
      setInputDataSessao1("");
      setInputDataSessao2("");
      setInputDataSessao3("");
      setInputDataSessao4("");
      setInputDataSessao5("");
      setInputDataSessao6("");
      setValorInput("");
      setUsarRepassePersonalizado(false);
      setValorRepasseInput("");

      // Chamar funções de callback
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erro ao cadastrar sessão:", error);
      toast.error(
        typeof error === "string" ? error : "Erro ao cadastrar sessão",
      );
    }
  }

  // Função auxiliar para renderizar um input de data com calendário
  const renderDateInput = (
    fieldName:
      | "dtSessao1"
      | "dtSessao2"
      | "dtSessao3"
      | "dtSessao4"
      | "dtSessao5"
      | "dtSessao6",
    inputState: string,
    setInputState: React.Dispatch<React.SetStateAction<string>>,
    label: string,
    isRequired = false,
  ) => {
    return (
      <div className="mb-4">
        <label htmlFor={fieldName} className="block text-sm font-medium">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <Controller
          control={control}
          name={fieldName}
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative">
                  <input
                    type="text"
                    className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 pr-10 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                    id={fieldName}
                    placeholder="DD/MM/AAAA"
                    value={inputState}
                    onChange={(e) => {
                      const masked = maskDate(e.target.value);
                      setInputState(masked);

                      const parsedDate = parse(
                        masked,
                        "dd/MM/yyyy",
                        new Date(),
                        { locale: ptBR },
                      );

                      if (isValid(parsedDate)) {
                        field.onChange(parsedDate);
                      } else {
                        field.onChange(null);
                      }
                    }}
                    onBlur={() => {
                      const parsedDate = parse(
                        inputState,
                        "dd/MM/yyyy",
                        new Date(),
                        { locale: ptBR },
                      );

                      if (!isValid(parsedDate)) {
                        setInputState("");
                        field.onChange(null);
                      }
                    }}
                    autoComplete="off"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none h-5 w-5 text-gray-400" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4 bg-white rounded-md shadow-lg">
                <Calendar
                  mode="single"
                  selected={field.value as Date}
                  onSelect={(date) => {
                    if (date && isValid(date)) {
                      const formattedDate = format(date, "dd/MM/yyyy", {
                        locale: ptBR,
                      });
                      setInputState(formattedDate);
                      field.onChange(date);
                    } else {
                      setInputState("");
                      field.onChange(null);
                    }
                  }}
                  disabled={(date) => date < new Date("1900-01-01")}
                  initialFocus
                  locale={ptBR}
                  className="rounded-md border"
                  classNames={{
                    months: "space-y-4",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button:
                      "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell:
                      "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                    day_selected:
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle:
                      "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors[fieldName] && (
          <p className="text-red-500 text-sm mt-1">
            {errors[fieldName]?.message as string}
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="bg-gray-500/25 data-[state=open]:animate-overlayShow fixed inset-0" />
      <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[768px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none overflow-y-auto">
        <Dialog.Title className="sr-only">Cadastrar Nova Sessão</Dialog.Title>
        <Dialog.Description>
          <VisuallyHidden>Cadastrar Nova Sessão</VisuallyHidden>
        </Dialog.Description>
        <form
          onSubmit={handleSubmit(handleCreateNewSessao)}
          className="space-y-6 p-6 bg-white rounded-lg"
        >
          <h3 className="font-medium text-azul text-xl">Dados da Sessão</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="terapeuta_id"
                className="block text-sm font-medium"
              >
                Terapeuta <span className="text-red-500">*</span>
              </label>
              <select
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="terapeuta_id"
                {...register("terapeuta_id")}
              >
                <option value="">Selecione um terapeuta</option>
                {terapeutas?.map((terapeuta) => (
                  <option key={terapeuta.id} value={terapeuta.id}>
                    {terapeuta.nome}
                  </option>
                ))}
              </select>
              {errors.terapeuta_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.terapeuta_id.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="paciente_id"
                className="block text-sm font-medium"
              >
                Paciente <span className="text-red-500">*</span>
              </label>
              <select
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="paciente_id"
                {...register("paciente_id")}
                disabled={!selectedTerapeutaId}
              >
                <option value="">
                  {selectedTerapeutaId
                    ? "Selecione um paciente"
                    : "Escolha um terapeuta primeiro"}
                </option>
                {filteredPacientes?.map((paciente) => (
                  <option key={paciente.id} value={paciente.id}>
                    {paciente.nome}
                  </option>
                ))}
              </select>
              {errors.paciente_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.paciente_id.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="tipoSessao" className="block text-sm font-medium">
                Tipo de Sessão <span className="text-red-500">*</span>
              </label>
              <select
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="tipoSessao"
                {...register("tipoSessao")}
              >
                <option value="">Selecione o tipo</option>
                <option value="Anamnese">Anamnese</option>
                <option value="Atendimento">Atendimento</option>
                <option value="Avaliação">Avaliação</option>
                <option value="Visitar Escolar">Visita Escolar</option>
              </select>
              {errors.tipoSessao && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.tipoSessao.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="valorSessao"
                className="block text-sm font-medium"
              >
                Valor da Sessão <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="valorSessao"
                placeholder="R$ 0,00"
                value={valorInput}
                onChange={(e) => {
                  const maskedValue = maskPrice(e.target.value);
                  setValorInput(maskedValue);

                  // Extrai o valor numérico e define no formulário
                  const numericValue =
                    Number(maskedValue.replace(/[^\d]/g, "")) / 100;
                  setValue("valorSessao", numericValue);
                }}
              />
              {errors.valorSessao && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.valorSessao.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="statusSessao"
                className="block text-sm font-medium"
              >
                Status <span className="text-red-500">*</span>
              </label>
              <select
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="statusSessao"
                {...register("statusSessao")}
              >
                <option value="Pagamento Pendente">Pagamento Pendente</option>
                <option value="Pagamento Realizado">Pagamento Realizado</option>
                <option value="Nota Fiscal Emitida">Nota Fiscal Emitida</option>
                <option value="Nota Fiscal Enviada">Nota Fiscal Enviada</option>
              </select>
              {errors.statusSessao && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.statusSessao.message}
                </p>
              )}
            </div>

            {/* Seção de Valor de Repasse Personalizado */}
            <div className="md:col-span-2 border border-gray-200 p-4 rounded-md bg-gray-50">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="usarRepassePersonalizado"
                  className="mr-2"
                  checked={usarRepassePersonalizado}
                  onChange={(e) =>
                    setUsarRepassePersonalizado(e.target.checked)
                  }
                />
                <label
                  htmlFor="usarRepassePersonalizado"
                  className="text-sm font-medium"
                >
                  Usar valor de repasse personalizado
                </label>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="valorRepasse"
                    className="block text-sm font-medium"
                  >
                    {usarRepassePersonalizado
                      ? "Valor de Repasse Personalizado"
                      : "Valor de Repasse Automático"}
                  </label>
                  <input
                    type="text"
                    className={`shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px] ${
                      !usarRepassePersonalizado ? "bg-gray-100" : ""
                    }`}
                    id="valorRepasse"
                    placeholder="R$ 0,00"
                    value={valorRepasseInput}
                    disabled={!usarRepassePersonalizado}
                    onChange={(e) => {
                      const maskedValue = maskPrice(e.target.value);
                      setValorRepasseInput(maskedValue);

                      if (usarRepassePersonalizado) {
                        // Extrai o valor numérico e define no formulário
                        const numericValue =
                          Number(maskedValue.replace(/[^\d]/g, "")) / 100;
                        setValue("valorRepasse", numericValue);
                      }
                    }}
                  />
                </div>

                {!usarRepassePersonalizado && selectedTerapeuta && (
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mt-6">
                      Cálculo baseado em: {selectedTerapeuta.nome} (
                      {selectedTerapeuta.dt_entrada &&
                        format(
                          new Date(selectedTerapeuta.dt_entrada),
                          "dd/MM/yyyy",
                          { locale: ptBR },
                        )}
                      )
                    </div>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 mt-2">
                {!usarRepassePersonalizado
                  ? "O valor de repasse será calculado automaticamente com base no tempo de casa do terapeuta."
                  : "Este valor substituirá o cálculo automático baseado no tempo de casa do terapeuta."}
              </div>
            </div>
          </div>

          <h3 className="font-medium text-azul text-xl mt-6">
            Datas das Sessões
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sessão 1 - Obrigatória */}
            <div>
              {renderDateInput(
                "dtSessao1",
                inputDataSessao1,
                setInputDataSessao1,
                "Data da 1ª Sessão",
                true,
              )}
            </div>

            <div>
              {renderDateInput(
                "dtSessao2",
                inputDataSessao2,
                setInputDataSessao2,
                "Data da 2ª Sessão",
              )}
            </div>

            <div>
              {renderDateInput(
                "dtSessao3",
                inputDataSessao3,
                setInputDataSessao3,
                "Data da 3ª Sessão",
              )}
            </div>

            <div>
              {renderDateInput(
                "dtSessao4",
                inputDataSessao4,
                setInputDataSessao4,
                "Data da 4ª Sessão",
              )}
            </div>

            <div>
              {renderDateInput(
                "dtSessao5",
                inputDataSessao5,
                setInputDataSessao5,
                "Data da 5ª Sessão",
              )}
            </div>

            <div>
              {renderDateInput(
                "dtSessao6",
                inputDataSessao6,
                setInputDataSessao6,
                "Data da 6ª Sessão",
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              className={`bg-azul text-branco hover:bg-azul/75 focus:shadow-azul inline-flex h-[35px] items-center justify-center rounded-[4px] px-[15px] font-medium leading-none focus:shadow-[0_0_0_2px] focus:outline-none ${
                isSubmitting ? "cursor-not-allowed" : ""
              }`}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Carregando..." : "Confirmar"}
            </button>
          </div>
        </form>

        <Dialog.Close
          className="text-rosa hover:bg-rosa/50 focus:shadow-azul absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
          aria-label="Close"
        >
          <X />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
