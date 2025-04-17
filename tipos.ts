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
  terapeuta_id: string; // ID do terapeuta
  paciente_id: string; // ID do paciente

  // Informações relacionadas
  terapeutaInfo?: Terapeuta; // Objeto completo do terapeuta (opcional para criar sessões)
  pacienteInfo?: Paciente; // Objeto completo do paciente (opcional para criar sessões)

  // Detalhes da sessão
  tipoSessao: "Anamnese" | "Atendimento" | "Avaliação" | "Visitar Escolar";
  valorSessao: number;
  valorRepasse?: number; // Valor de repasse específico para esta sessão (opcional)
  statusSessao:
    | "Pagamento Pendente"
    | "Pagamento Realizado"
    | "Nota Fiscal Emitida"
    | "Nota Fiscal Enviada"
    | undefined;

  // Datas
  dtSessao1?: Date;
  dtSessao2?: Date;
  dtSessao3?: Date;
  dtSessao4?: Date;
  dtSessao5?: Date;
  dtSessao6?: Date;

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
