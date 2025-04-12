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
  dtNascimento: Date;
  terapeutaInfo: Terapeuta;
  nomeResponsavel: string;
  telefoneResponsavel: string;
  emailResponsavel: string;
  cpfResponsavel: string;
  enderecoResponsavel: string;
  origem: "Indicação" | "Instagram" | "Busca no Google" | "Outros" | undefined;
  dt_entrada: Date;
}
