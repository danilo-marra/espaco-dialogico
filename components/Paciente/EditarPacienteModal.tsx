import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import type { Paciente } from "tipos";
import {
  PacienteFormSchema,
  type PacienteFormInputsWithoutFoto,
} from "./pacienteSchema";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { maskDate, maskPhone, maskCPF } from "utils/formatter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "store/store";
import { updatePaciente } from "store/pacientesSlice";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useFetchTerapeutas } from "hooks/useFetchTerapeutas";
import { calculateAge } from "utils/dateUtils";

interface EditarPacienteModalProps {
  paciente: Paciente;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditarPacienteModal({
  paciente,
  open,
  onClose,
  onSuccess,
}: EditarPacienteModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { terapeutas } = useFetchTerapeutas();
  const [inputDataNascimento, setInputDataNascimento] = useState<string>("");
  const [inputDataEntrada, setInputDataEntrada] = useState<string>("");
  const [age, setAge] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
    getValues,
    setValue,
  } = useForm<PacienteFormInputsWithoutFoto>({
    resolver: zodResolver(PacienteFormSchema),
    defaultValues: {
      nome: paciente.nome,
      dt_nascimento: new Date(paciente.dt_nascimento),
      terapeuta_id: paciente.terapeuta_id || "",
      nome_responsavel: paciente.nome_responsavel,
      telefone_responsavel: paciente.telefone_responsavel,
      email_responsavel: paciente.email_responsavel,
      cpf_responsavel: paciente.cpf_responsavel,
      endereco_responsavel: paciente.endereco_responsavel,
      origem: paciente.origem || "",
      dt_entrada: new Date(paciente.dt_entrada),
    },
  });

  // Ensure terapeuta_id is set if available on mount
  useEffect(() => {
    if (!getValues("terapeuta_id") && paciente.terapeuta_id) {
      setValue("terapeuta_id", paciente.terapeuta_id);
    }
  }, [paciente, getValues, setValue]);

  useEffect(() => {
    if (paciente?.dt_nascimento) {
      const formattedDate = format(
        new Date(paciente.dt_nascimento),
        "dd/MM/yyyy",
        {
          locale: ptBR,
        },
      );
      setInputDataNascimento(formattedDate);
      setAge(calculateAge(paciente.dt_nascimento));
    }

    if (paciente?.dt_entrada) {
      const formattedDate = format(
        new Date(paciente.dt_entrada),
        "dd/MM/yyyy",
        {
          locale: ptBR,
        },
      );
      setInputDataEntrada(formattedDate);
    }
  }, [paciente]);

  const handleUpdatePaciente = async (data: PacienteFormInputsWithoutFoto) => {
    try {
      // Validate terapeuta_id before submission
      if (!data.terapeuta_id) {
        toast.error("O terapeuta responsável é obrigatório.");
        return;
      }

      const updatedPaciente = {
        ...paciente,
        ...data,
        terapeuta_id: data.terapeuta_id, // Explicitly include terapeuta_id
      };

      await dispatch(updatePaciente(updatedPaciente)).unwrap();
      toast.success(`Paciente ${paciente.nome} atualizado com sucesso.`);
      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.toString());
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-gray-500/25 fixed inset-0 z-50" />
        <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[768px] translate-x-[-50%] translate-y-[-50%] rounded-md bg-white p-6 overflow-y-auto z-50">
          <Dialog.Title className="text-xl font-medium text-azul mb-4">
            Editar Paciente
          </Dialog.Title>
          <Dialog.Description>
            <VisuallyHidden>Editar dados do paciente</VisuallyHidden>
          </Dialog.Description>

          <form
            onSubmit={handleSubmit(handleUpdatePaciente)}
            className="space-y-4"
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
                                setAge(calculateAge(parsedDate));
                              } else {
                                field.onChange(null);
                                setAge(null);
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
                {age !== null && (
                  <p className="text-sm text-gray-500 mt-1">
                    Idade: {age} anos
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

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-azul text-white rounded hover:bg-azul/75"
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
