import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { X } from "@phosphor-icons/react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "store/store";
import { updateSessao } from "store/sessoesSlice";
import { useFetchTerapeutas } from "hooks/useFetchTerapeutas";
import { useFetchPacientes } from "hooks/useFetchPacientes";

import { Sessao } from "tipos";
import {
  SessaoEditSchema, // Mudando de SessaoEditFormSchema para SessaoEditSchema
  type SessaoEditFormInputs,
} from "./sessaoSchema";

interface EditarSessaoModalProps {
  sessao: Sessao;
  onSuccess?: () => void;
  onClose: () => void;
  open: boolean;
}

export function EditarSessaoModal({
  sessao,
  onSuccess,
  onClose,
  open,
}: EditarSessaoModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { terapeutas } = useFetchTerapeutas();
  const { pacientes } = useFetchPacientes();

  const [sessionDateDisplay, setSessionDateDisplay] = useState<string>("");
  const [valorInput, setValorInput] = useState<string>("");
  const [valorRepasseInput, setValorRepasseInput] = useState<string>("");
  const [useCustomRepasse, setUseCustomRepasse] = useState<boolean>(false);

  // Estado para armazenar os nomes do terapeuta e paciente para exibição
  const [terapeutaNome, setTerapeutaNome] = useState<string>("");
  const [pacienteNome, setPacienteNome] = useState<string>("");
  const [repasseCalculado, setRepasseCalculado] = useState<number>(0);
  const [percentualRepasseCalculado, setPercentualRepasseCalculado] =
    useState<number>(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<SessaoEditFormInputs>({
    resolver: zodResolver(SessaoEditSchema),
    defaultValues: {
      terapeuta_id: sessao?.terapeuta_id || "",
      paciente_id: sessao?.paciente_id || "",
      tipoSessao: sessao?.tipoSessao,
      valorSessao: sessao?.valorSessao,
      valorRepasse: sessao?.valorRepasse,
      statusSessao: sessao?.statusSessao,
      dtSessao1: sessao?.dtSessao1 ? new Date(sessao.dtSessao1) : undefined,
      dtSessao2: sessao?.dtSessao2 ? new Date(sessao.dtSessao2) : undefined,
      dtSessao3: sessao?.dtSessao3 ? new Date(sessao.dtSessao3) : undefined,
      dtSessao4: sessao?.dtSessao4 ? new Date(sessao.dtSessao4) : undefined,
      dtSessao5: sessao?.dtSessao5 ? new Date(sessao.dtSessao5) : undefined,
      dtSessao6: sessao?.dtSessao6 ? new Date(sessao.dtSessao6) : undefined,
    },
  });

  // Observar mudanças no valor da sessão para atualizar o valor de repasse calculado
  const valorSessao = watch("valorSessao");

  // Inicializar os estados dos inputs de data e valor
  useEffect(() => {
    if (sessao) {
      // Garantir que os valores de terapeuta_id e paciente_id estejam definidos
      setValue("terapeuta_id", sessao.terapeuta_id);
      setValue("paciente_id", sessao.paciente_id);

      // Obter os nomes do terapeuta e paciente para exibição
      if (sessao.terapeutaInfo?.nome) {
        setTerapeutaNome(sessao.terapeutaInfo.nome);
      } else if (terapeutas) {
        const terapeuta = terapeutas.find((t) => t.id === sessao.terapeuta_id);
        if (terapeuta) {
          setTerapeutaNome(terapeuta.nome);
        }
      }

      if (sessao.pacienteInfo?.nome) {
        setPacienteNome(sessao.pacienteInfo.nome);
      } else if (pacientes) {
        const paciente = pacientes.find((p) => p.id === sessao.paciente_id);
        if (paciente) {
          setPacienteNome(paciente.nome);
        }
      }

      if (sessao.dtSessao1) {
        setSessionDateDisplay(
          format(new Date(sessao.dtSessao1), "dd/MM/yyyy", { locale: ptBR }),
        );
      }

      // Formatando o valor da sessão
      setValorInput(sessao.valorSessao.toString().replace(".", ","));

      // Configurar o valor de repasse personalizado se existir
      if (sessao.valorRepasse !== undefined) {
        setUseCustomRepasse(true);
        setValorRepasseInput(sessao.valorRepasse.toString().replace(".", ","));
        setValue("valorRepasse", sessao.valorRepasse);
      } else {
        setUseCustomRepasse(false);

        // Calcular o repasse baseado na regra padrão
        if (sessao.terapeutaInfo?.dt_entrada) {
          // Calcular percentual para exibição
          const dataEntrada = new Date(sessao.terapeutaInfo.dt_entrada);
          const hoje = new Date();
          const diferencaEmMilissegundos =
            hoje.getTime() - dataEntrada.getTime();
          const umAnoEmMilissegundos = 365.25 * 24 * 60 * 60 * 1000;
          const anosNaClinica = diferencaEmMilissegundos / umAnoEmMilissegundos;
          const percentual = anosNaClinica >= 1 ? 50 : 45;
          setPercentualRepasseCalculado(percentual);

          // Calcular o valor de repasse com base no percentual definido
          const repasseValue = sessao.valorSessao * (percentual / 100);
          setRepasseCalculado(repasseValue);
        }
      }
    }
  }, [sessao, setValue, terapeutas, pacientes]);

  // Efeito para calcular o valor de repasse padrão quando o valor da sessão é alterado
  useEffect(() => {
    if (!useCustomRepasse && sessao?.terapeutaInfo?.dt_entrada && valorSessao) {
      // Calcular percentual para exibição
      const dataEntrada = new Date(sessao.terapeutaInfo.dt_entrada);
      const hoje = new Date();
      const diferencaEmMilissegundos = hoje.getTime() - dataEntrada.getTime();
      const umAnoEmMilissegundos = 365.25 * 24 * 60 * 60 * 1000;
      const anosNaClinica = diferencaEmMilissegundos / umAnoEmMilissegundos;
      const percentual = anosNaClinica >= 1 ? 50 : 45;
      setPercentualRepasseCalculado(percentual);

      // Calcular o valor de repasse com base no percentual e no valor atual
      const repasseValue = valorSessao * (percentual / 100);
      setRepasseCalculado(repasseValue);
    }
  }, [valorSessao, useCustomRepasse, sessao]);

  async function handleUpdateSessao(data: SessaoEditFormInputs) {
    try {
      // Preparar os dados para envio
      const sessaoData: Partial<
        Omit<Sessao, "id" | "pacienteInfo" | "terapeutaInfo">
      > = {
        tipoSessao: data.tipoSessao,
        valorSessao: data.valorSessao,
        statusSessao: data.statusSessao,
      };

      // Adicionar o valorRepasse apenas se estamos usando um valor personalizado
      if (useCustomRepasse) {
        sessaoData.valorRepasse = data.valorRepasse;
      } else {
        // Se não estamos usando um valor personalizado, enviar null para remover qualquer valor personalizado anterior
        sessaoData.valorRepasse = null;
      }

      // Enviar dados para a API através do Redux
      await dispatch(
        updateSessao({
          id: sessao.id,
          sessao: sessaoData,
        }),
      ).unwrap();

      // Chamar funções de callback
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar sessão:", error);
      toast.error(
        typeof error === "string" ? error : "Erro ao atualizar sessão",
      );
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-gray-500/25 data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[768px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none overflow-y-auto">
          <Dialog.Title className="text-xl font-medium text-azul mb-4">
            Editar Sessão
          </Dialog.Title>
          <Dialog.Description>
            <VisuallyHidden>Editar dados da sessão</VisuallyHidden>
          </Dialog.Description>
          <form
            onSubmit={handleSubmit(handleUpdateSessao)}
            className="space-y-6 p-6 bg-white rounded-lg"
          >
            <h3 className="font-medium text-azul text-xl">
              Dados da Sessão
              {sessionDateDisplay ? ` do dia ${sessionDateDisplay}` : ""}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="terapeuta_id"
                  className="block text-sm font-medium"
                >
                  Terapeuta <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px] bg-gray-100 cursor-not-allowed"
                  id="terapeuta_id"
                  value={terapeutaNome}
                  disabled
                />
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
                <input
                  type="text"
                  className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px] bg-gray-100 cursor-not-allowed"
                  id="paciente_id"
                  value={pacienteNome}
                  disabled
                />
                {errors.paciente_id && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.paciente_id.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="tipoSessao"
                  className="block text-sm font-medium"
                >
                  Tipo de Sessão
                </label>
                <input
                  type="text"
                  className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px] bg-gray-100 cursor-not-allowed"
                  id="tipoSessao"
                  value={sessao.tipoSessao}
                  disabled
                  readOnly
                />
              </div>

              <div>
                <label
                  htmlFor="valorSessao"
                  className="block text-sm font-medium"
                >
                  Valor <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-[10px] text-gray-500">
                    R$
                  </span>
                  <input
                    type="text"
                    className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md pl-8 pr-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                    id="valorSessao"
                    placeholder="0,00"
                    value={valorInput}
                    onChange={(e) => {
                      // Limpar o valor (manter apenas os números)
                      const numericValue = e.target.value.replace(/\D/g, "");
                      // Converter para valor decimal
                      const decimalValue = Number(numericValue) / 100;
                      // Atualizar o valor no formulário
                      setValue("valorSessao", decimalValue);
                      // Formatar para exibição
                      setValorInput(decimalValue.toFixed(2).replace(".", ","));
                    }}
                  />
                </div>
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
                  Status do Pagamento <span className="text-red-500">*</span>
                </label>
                <select
                  className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md px-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                  id="statusSessao"
                  {...register("statusSessao")}
                >
                  <option value="Pagamento Pendente">Pagamento Pendente</option>
                  <option value="Pagamento Realizado">
                    Pagamento Realizado
                  </option>
                  <option value="Nota Fiscal Emitida">
                    Nota Fiscal Emitida
                  </option>
                  <option value="Nota Fiscal Enviada">
                    Nota Fiscal Enviada
                  </option>
                </select>
                {errors.statusSessao && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.statusSessao.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="valorRepasse"
                  className="block text-sm font-medium"
                >
                  Valor de Repasse
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-[10px] text-gray-500">
                    R$
                  </span>
                  <input
                    type="text"
                    className="shadow-rosa/50 focus:shadow-rosa block w-full h-[40px] rounded-md pl-8 pr-4 text-[15px] leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
                    id="valorRepasse"
                    placeholder="0,00"
                    value={valorRepasseInput}
                    onChange={(e) => {
                      // Limpar o valor (manter apenas os números)
                      const numericValue = e.target.value.replace(/\D/g, "");
                      // Converter para valor decimal
                      const decimalValue = Number(numericValue) / 100;
                      // Atualizar o valor no formulário
                      setValue("valorRepasse", decimalValue);
                      // Formatar para exibição
                      setValorRepasseInput(
                        decimalValue.toFixed(2).replace(".", ","),
                      );
                    }}
                    disabled={!useCustomRepasse}
                  />
                </div>
                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    id="useCustomRepasse"
                    checked={useCustomRepasse}
                    onChange={(e) => setUseCustomRepasse(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="useCustomRepasse" className="text-sm">
                    Usar valor de repasse personalizado
                  </label>
                </div>
                {!useCustomRepasse && (
                  <p className="text-sm mt-1">
                    Valor calculado automaticamente: R${" "}
                    {repasseCalculado.toFixed(2).replace(".", ",")} (
                    {percentualRepasseCalculado}%)
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded mr-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-azul hover:bg-azul/75 text-white px-4 py-2 rounded"
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
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
    </Dialog.Root>
  );
}
