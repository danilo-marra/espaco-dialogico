import { X } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { maskDate, maskPhone, maskCPF } from "utils/formatter";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { type AppDispatch } from "store/store";
import { addPaciente } from "store/pacientesSlice";
import { useFetchTerapeutas } from "hooks/useFetchTerapeutas";

import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  PacienteFormSchema,
  type PacienteFormInputsWithoutFoto,
} from "./pacienteSchema";
import { toast } from "sonner";

interface NovoPacienteModalProps {
  onSuccess?: () => void;
  onClose: () => void;
}

export function NovoPacienteModal({
  onSuccess,
  onClose,
}: NovoPacienteModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { terapeutas } = useFetchTerapeutas();
  const [inputDataNascimento, setInputDataNascimento] = useState<string>("");
  const [inputDataEntrada, setInputDataEntrada] = useState<string>("");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<PacienteFormInputsWithoutFoto>({
    resolver: zodResolver(PacienteFormSchema),
  });

  async function handleCreateNewPaciente(data: PacienteFormInputsWithoutFoto) {
    try {
      // Enviar os dados diretamente sem transformação, usando os nomes de campos do backend
      try {
        await dispatch(addPaciente(data)).unwrap();
        toast.success(`Paciente ${data.nome} cadastrado com sucesso!`);
        reset();
        setInputDataNascimento("");
        setInputDataEntrada("");
        onSuccess?.();
        onClose();
      } catch (error) {
        toast.error(error.toString());
      }
    } catch (error) {
      console.error("Erro ao cadastrar Paciente:", error);
      toast.error(error.toString());
    }
  }

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="bg-gray-500/25 data-[state=open]:animate-overlayShow fixed inset-0 z-50" />
      <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[768px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none overflow-y-auto z-50">
        <Dialog.Title className="sr-only">Cadastrar Novo Paciente</Dialog.Title>
        <Dialog.Description>
          <VisuallyHidden>Cadastrar Novo Paciente</VisuallyHidden>
        </Dialog.Description>
        <form
          onSubmit={handleSubmit(handleCreateNewPaciente)}
          className="space-y-6 p-6 bg-white rounded-lg"
        >
          <h3 className="font-medium text-azul text-xl mt-6">
            Dados do Paciente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium">
                Nome do paciente
              </label>
              <input
                type="text"
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="nome"
                placeholder="Nome do paciente"
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.nome.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="terapeuta_id"
                className="block text-sm font-medium"
              >
                Terapeuta responsável
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
                htmlFor="dt_nascimento"
                className="block text-sm font-medium"
              >
                Data de nascimento
              </label>
              <Controller
                control={control}
                name="dt_nascimento"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <input
                          type="text"
                          className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 pr-10 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                          id="dt_nascimento"
                          placeholder="Data de nascimento (dd/MM/yyyy)"
                          value={inputDataNascimento}
                          onChange={(e) => {
                            // Aplica a máscara de data
                            const masked = maskDate(e.target.value);
                            setInputDataNascimento(masked);

                            // Tenta parsear a data
                            const parsedDate = parse(
                              masked,
                              "dd/MM/yyyy",
                              new Date(),
                              {
                                locale: ptBR,
                              },
                            );
                            if (isValid(parsedDate)) {
                              field.onChange(parsedDate);
                            } else {
                              field.onChange(null);
                            }
                          }}
                          onBlur={() => {
                            // Validação final ao perder o foco
                            const parsedDate = parse(
                              inputDataNascimento,
                              "dd/MM/yyyy",
                              new Date(),
                              { locale: ptBR },
                            );
                            if (!isValid(parsedDate)) {
                              setInputDataNascimento("");
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
                        selected={field.value}
                        onSelect={(date) => {
                          if (date && isValid(date)) {
                            const formattedDate = format(date, "dd/MM/yyyy", {
                              locale: ptBR,
                            });
                            setInputDataNascimento(formattedDate);
                            field.onChange(date);
                          } else {
                            setInputDataNascimento("");
                            field.onChange(null);
                          }
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        locale={ptBR}
                        className="rounded-md border"
                        classNames={{
                          months: "space-y-4",
                          month: "space-y-4",
                          caption:
                            "flex justify-center pt-1 relative items-center",
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
              {errors.dt_nascimento && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.dt_nascimento.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="origem" className="block text-sm font-medium">
                Origem
              </label>
              <select
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="origem"
                {...register("origem")}
              >
                <option value="">Selecione a origem</option>
                <option value="Indicação">Indicação</option>
                <option value="Instagram">Instagram</option>
                <option value="Busca no Google">Busca no Google</option>
                <option value="Outros">Outros</option>
              </select>
              {errors.origem && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.origem.message}
                </p>
              )}
            </div>
          </div>

          <h3 className="font-medium text-azul text-xl mt-6">
            Dados do Responsável
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="nome_responsavel"
                className="block text-sm font-medium"
              >
                Nome do responsável
              </label>
              <input
                type="text"
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="nome_responsavel"
                placeholder="Nome do responsável"
                {...register("nome_responsavel")}
              />
              {errors.nome_responsavel && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.nome_responsavel.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="telefone_responsavel"
                className="block text-sm font-medium"
              >
                Telefone do responsável
              </label>
              <input
                type="text"
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="telefone_responsavel"
                placeholder="(00) 00000-0000"
                {...register("telefone_responsavel", {
                  onChange: (e) => {
                    const masked = maskPhone(e.target.value);
                    e.target.value = masked;
                  },
                })}
              />
              {errors.telefone_responsavel && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.telefone_responsavel.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email_responsavel"
                className="block text-sm font-medium"
              >
                Email do responsável
              </label>
              <input
                type="email"
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="email_responsavel"
                placeholder="Email do responsável"
                {...register("email_responsavel")}
              />
              {errors.email_responsavel && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email_responsavel.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="cpf_responsavel"
                className="block text-sm font-medium"
              >
                CPF do responsável
              </label>
              <input
                type="text"
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="cpf_responsavel"
                placeholder="000.000.000-00"
                {...register("cpf_responsavel", {
                  onChange: (e) => {
                    const masked = maskCPF(e.target.value);
                    e.target.value = masked;
                  },
                })}
              />
              {errors.cpf_responsavel && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.cpf_responsavel.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="endereco_responsavel"
                className="block text-sm font-medium"
              >
                Endereço do responsável
              </label>
              <input
                type="text"
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="endereco_responsavel"
                placeholder="Endereço completo do responsável"
                {...register("endereco_responsavel")}
              />
              {errors.endereco_responsavel && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.endereco_responsavel.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="dt_entrada" className="block text-sm font-medium">
              Data de entrada
            </label>
            <Controller
              control={control}
              name="dt_entrada"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <input
                        type="text"
                        className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 pr-10 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                        id="dt_entrada"
                        placeholder="Data de entrada (dd/MM/yyyy)"
                        value={inputDataEntrada}
                        onChange={(e) => {
                          // Aplica a máscara de data
                          const masked = maskDate(e.target.value);
                          setInputDataEntrada(masked);

                          // Tenta parsear a data
                          const parsedDate = parse(
                            masked,
                            "dd/MM/yyyy",
                            new Date(),
                            {
                              locale: ptBR,
                            },
                          );
                          if (isValid(parsedDate)) {
                            field.onChange(parsedDate);
                          } else {
                            field.onChange(null);
                          }
                        }}
                        onBlur={() => {
                          // Validação final ao perder o foco
                          const parsedDate = parse(
                            inputDataEntrada,
                            "dd/MM/yyyy",
                            new Date(),
                            { locale: ptBR },
                          );
                          if (!isValid(parsedDate)) {
                            setInputDataEntrada("");
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
                      selected={field.value}
                      onSelect={(date) => {
                        if (date && isValid(date)) {
                          const formattedDate = format(date, "dd/MM/yyyy", {
                            locale: ptBR,
                          });
                          setInputDataEntrada(formattedDate);
                          field.onChange(date);
                        } else {
                          setInputDataEntrada("");
                          field.onChange(null);
                        }
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      locale={ptBR}
                      className="rounded-md border"
                      classNames={{
                        months: "space-y-4",
                        month: "space-y-4",
                        caption:
                          "flex justify-center pt-1 relative items-center",
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
            {errors.dt_entrada && (
              <p className="text-red-500 text-sm mt-1">
                {errors.dt_entrada.message}
              </p>
            )}
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
