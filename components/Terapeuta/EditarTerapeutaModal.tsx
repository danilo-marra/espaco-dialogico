import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import type { Terapeuta } from "tipos";
import {
  TerapeutaFormSchema,
  type TerapeutaFormInputs,
} from "./terapeutaSchema";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { maskDate, maskPhone } from "utils/formatter";
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
import { updateTerapeuta } from "store/terapeutasSlice";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { handleTerapeutaError } from "infra/errors";
import { PDFUploader } from "../common/PDFUploader";

interface EditarTerapeutaModalProps {
  terapeuta: Terapeuta;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditarTerapeutaModal({
  terapeuta,
  open,
  onClose,
  onSuccess,
}: EditarTerapeutaModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(TerapeutaFormSchema),
    defaultValues: {
      nome: terapeuta.nome,
      telefone: terapeuta.telefone,
      email: terapeuta.email,
      crp: terapeuta.crp || "",
      dt_nascimento: terapeuta.dt_nascimento
        ? new Date(terapeuta.dt_nascimento)
        : null,
      dt_entrada: new Date(terapeuta.dt_entrada),
      chave_pix: terapeuta.chave_pix,
    },
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [curriculoPDF, setCurriculoPDF] = useState<File | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [nascimentoInputValue, setNascimentoInputValue] = useState<string>("");

  useEffect(() => {
    if (terapeuta?.dt_entrada) {
      const formattedDate = format(
        new Date(terapeuta.dt_entrada),
        "dd/MM/yyyy",
        {
          locale: ptBR,
        },
      );
      setInputValue(formattedDate);
    }

    if (terapeuta?.dt_nascimento) {
      const formattedNascimento = format(
        new Date(terapeuta.dt_nascimento),
        "dd/MM/yyyy",
        {
          locale: ptBR,
        },
      );
      setNascimentoInputValue(formattedNascimento);
    }
  }, [terapeuta]);

  const handleUpdateTerapeuta = async (data: TerapeutaFormInputs) => {
    try {
      const updatedTerapeuta = {
        ...terapeuta,
        ...data,
        foto: terapeuta.foto,
        curriculo_arquivo: curriculoPDF
          ? "pending-upload"
          : terapeuta.curriculo_arquivo,
      };

      await dispatch(
        updateTerapeuta({
          terapeuta: updatedTerapeuta,
          foto: selectedFile || undefined,
          curriculoPdf: curriculoPDF || undefined,
        }),
      ).unwrap();
      toast.success(`Terapeuta ${terapeuta.nome} atualizado com sucesso.`);
      reset();
      setSelectedFile(null);
      setCurriculoPDF(null);
      setInputValue("");
      setNascimentoInputValue("");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(handleTerapeutaError(error));
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-gray-500/25 fixed inset-0 z-50" />
        <Dialog.Content className="fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[768px] translate-x-[-50%] translate-y-[-50%] rounded-md bg-white p-6 overflow-y-auto z-50">
          <Dialog.Title className="text-xl font-medium text-azul mb-4">
            Editar Terapeuta
          </Dialog.Title>
          <Dialog.Description>
            <VisuallyHidden>Editar dados do terapeuta</VisuallyHidden>
          </Dialog.Description>

          <form
            onSubmit={handleSubmit(handleUpdateTerapeuta)}
            className="space-y-4"
          >
            <h3 className="font-medium text-azul text-xl mt-6">
              Dados do Terapeuta
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="nome"
                placeholder="Nome do terapeuta"
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-red-500">{errors.nome.message}</p>
              )}
              <input
                type="file"
                accept="image/*"
                className="shadow-rosa/50 focus:shadow-rosa block w-full rounded-md px-4 py-2 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="foto"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <input
                type="text"
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="telefone"
                placeholder="Telefone do terapeuta"
                {...register("telefone", {
                  onChange: (e) => {
                    const masked = maskPhone(e.target.value);
                    e.target.value = masked;
                  },
                })}
              />
              {errors.telefone && (
                <p className="text-red-500">{errors.telefone.message}</p>
              )}
              <input
                type="email"
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="email"
                placeholder="Email do terapeuta"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-500">{errors.email.message}</p>
              )}
              <input
                type="text"
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="crp"
                placeholder="CRP (opcional)"
                {...register("crp")}
              />
              {errors.crp && (
                <p className="text-red-500">{errors.crp.message}</p>
              )}

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
                          placeholder="Data de nascimento (opcional)"
                          value={nascimentoInputValue}
                          onChange={(e) => {
                            // Aplica a máscara de data
                            const masked = maskDate(e.target.value);
                            setNascimentoInputValue(masked);

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
                              nascimentoInputValue,
                              "dd/MM/yyyy",
                              new Date(),
                              { locale: ptBR },
                            );
                            if (
                              !isValid(parsedDate) &&
                              nascimentoInputValue !== ""
                            ) {
                              setNascimentoInputValue("");
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
                            setNascimentoInputValue(formattedDate);
                            field.onChange(date);
                          } else {
                            setNascimentoInputValue("");
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
                <p className="text-red-500">{errors.dt_nascimento.message}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo do Currículo (PDF - opcional)
                </label>
                <PDFUploader
                  onFileSelect={(file) => setCurriculoPDF(file)}
                  currentFileUrl={terapeuta.curriculo_arquivo}
                  label="Arraste um arquivo PDF aqui ou clique para selecionar"
                />
              </div>

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
                          value={inputValue}
                          onChange={(e) => {
                            // Aplica a máscara de data
                            const masked = maskDate(e.target.value);
                            setInputValue(masked);

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
                              inputValue,
                              "dd/MM/yyyy",
                              new Date(),
                              { locale: ptBR },
                            );
                            if (!isValid(parsedDate)) {
                              setInputValue("");
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
                            setInputValue(formattedDate);
                            field.onChange(date);
                          } else {
                            setInputValue("");
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
                <p className="text-red-500">{errors.dt_entrada.message}</p>
              )}
              <input
                type="text"
                className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                id="chave_pix"
                placeholder="Chave PIX"
                {...register("chave_pix")}
              />
            </div>

            <div className="flex justify-end gap-2">
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
