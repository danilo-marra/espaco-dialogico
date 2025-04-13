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
  terapeutaInfo: Terapeuta;
  pacienteInfo: Paciente;
  statusSessao:
    | "Pagamento Pendente"
    | "Pagamento Realizado"
    | "Nota Fiscal Emitida"
    | "Nota Fiscal Enviada"
    | undefined;
  tipoSessao: "Anamnese" | "Atendimento" | "Avaliação" | "Visitar Escolar";
  valorSessao: number;
  dtSessao1?: Date;
  dtSessao2?: Date;
  dtSessao3?: Date;
  dtSessao4?: Date;
  dtSessao5?: Date;
  dtSessao6?: Date;
}
