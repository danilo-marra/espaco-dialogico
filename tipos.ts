export interface Terapeuta {
  id: string;
  nome: string;
  foto?: string | null;
  telefone: string;
  email: string;
  endereco: string;
  dt_entrada: Date | string;
  chave_pix: string;
  created_at?: string;
  updated_at?: string;
}

export interface Paciente {
  id: string;
  nome: string;
  dt_nascimento: Date | string;
  terapeuta_id: string;
  terapeutaInfo?: Terapeuta;
  nome_responsavel: string;
  telefone_responsavel: string;
  email_responsavel: string;
  cpf_responsavel: string;
  endereco_responsavel: string;
  origem: "Indicação" | "Instagram" | "Busca no Google" | "Outros";
  dt_entrada: Date | string;
  created_at?: string;
  updated_at?: string;
}

export interface Sessao {
  id: string;
  terapeuta_id: string;
  paciente_id: string;
  agendamento_id: string;

  // Informações relacionadas (opcionais)
  terapeutaInfo?: Terapeuta;
  pacienteInfo?: Paciente;
  agendamentoInfo?: Agendamento;

  // Campos mapeados do Agendamento
  tipoSessao: "Anamnese" | "Atendimento" | "Avaliação" | "Visitar Escolar"; // Convertido de tipoAgendamento
  valorSessao: number; // Valor copiado de valorAgendamento

  // Campos específicos da sessão
  valorRepasse?: number;
  statusSessao:
    | "Pagamento Pendente"
    | "Pagamento Realizado"
    | "Nota Fiscal Emitida"
    | "Nota Fiscal Enviada";

  // Data da sessão (pode ser derivada de dataAgendamento)
  dtSessao1: Date | string;
  dtSessao2?: Date | string;
  dtSessao3?: Date | string;
  dtSessao4?: Date | string;
  dtSessao5?: Date | string;
  dtSessao6?: Date | string;

  // Datas de controle
  created_at?: string;
  updated_at?: string;
}

export interface Agendamento {
  id: string;
  paciente_id: string;
  terapeuta_id: string;
  recurrenceId?: string;
  terapeutaInfo?: Terapeuta;
  pacienteInfo?: Paciente;
  dataAgendamento: Date | string;
  horarioAgendamento: string;
  localAgendamento: "Sala Verde" | "Sala Azul" | "Não Precisa de Sala";
  modalidadeAgendamento: "Presencial" | "Online";
  tipoAgendamento:
    | "Sessão"
    | "Orientação Parental"
    | "Visita Escolar"
    | "Supervisão"
    | "Outros";
  valorAgendamento: number;
  statusAgendamento: "Confirmado" | "Remarcado" | "Cancelado";
  observacoesAgendamento: string;

  // Campos para recorrência
  periodicidade?: "Não repetir" | "Semanal" | "Quinzenal";
  diasDaSemana?: string[];
  dataFimRecorrencia?: Date | string | null;
}
