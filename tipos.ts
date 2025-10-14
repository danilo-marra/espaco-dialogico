export interface Terapeuta {
  id: string;
  nome: string;
  foto?: string | null;
  telefone: string;
  email: string;
  crp?: string; // Número do Conselho Regional de Psicologia (opcional)
  dt_nascimento?: Date | string | null; // Data de nascimento (opcional)
  curriculo_arquivo?: string | null; // URL do arquivo PDF do currículo (opcional)
  dt_entrada: Date | string;
  chave_pix: string;
  user_id?: string | null; // ID do usuário associado (para vincular com o sistema de login)
  created_at?: string;
  updated_at?: string;
  isNew?: boolean; // Flag para indicar se é um novo registro (primeiro acesso)
}

export interface Paciente {
  id: string;
  nome: string;
  dt_nascimento?: Date | string | null;
  terapeuta_id: string;
  terapeutaInfo?: Terapeuta;
  nome_responsavel: string;
  telefone_responsavel: string;
  email_responsavel: string;
  cpf_responsavel: string;
  endereco_responsavel: string;
  origem?: "Indicação" | "Instagram" | "Busca no Google" | "Outros" | null;
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
  tipoSessao: "Anamnese" | "Atendimento" | "Avaliação" | "Visitar Escolar";
  valorSessao: number;

  // Campos específicos da sessão
  valorRepasse?: number;
  repasseRealizado?: boolean;
  pagamentoRealizado?: boolean;
  notaFiscal?: "Não Emitida" | "Emitida" | "Enviada";

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
  localAgendamento:
    | "Sala Verde"
    | "Sala Azul"
    | "Sala 321"
    | "Não Precisa de Sala";
  modalidadeAgendamento: "Presencial" | "Online";
  tipoAgendamento:
    | "Sessão"
    | "Orientação Parental"
    | "Visita Escolar"
    | "Supervisão"
    | "Outros";
  valorAgendamento: number;
  statusAgendamento: "Confirmado" | "Cancelado";
  observacoesAgendamento: string;
  sessaoRealizada?: boolean;
  falta?: boolean; // Indica se houve falta ou desmarcação com menos de 24h

  // Campos para recorrência
  periodicidade?: "Não repetir" | "Semanal" | "Quinzenal";
  diasDaSemana?: string[];
  dataFimRecorrencia?: Date | string | null;
}

export interface Transacao {
  id: string;
  tipo: "entrada" | "saida";
  categoria: string;
  descricao: string;
  valor: number;
  data: Date | string;
  usuario_id: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResumoFinanceiro {
  periodo: string; // "YYYY-MM" para mês/ano
  receitaSessoes: number;
  repasseTerapeutas: number;
  entradasManuais: number;
  saidasManuais: number;
  totalEntradas: number;
  totalSaidas: number;
  saldoFinal: number;
  quantidadeSessoes: number;
}
