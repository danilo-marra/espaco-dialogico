export interface Terapeuta {
  id: string; // era id
  nome: string; // era nome
  foto?: string | null; // era foto
  telefone: string; // era telefone
  email: string; // era email
  endereco: string; // era endereco
  dt_entrada: Date | string; // era dt_entrada
  chave_pix: string; // era chave_pix
  created_at?: string; // novo
  updated_at?: string; // novo
}

export interface Paciente {
  id: string;
  nomePaciente: string;
  dtNascimento: Date;
  terapeutaInfo: Terapeuta;
  nomeResponsavel: string;
  telefoneResponsavel: string;
  emailResponsavel: string;
  cpfResponsavel: string;
  enderecoResponsavel: string;
  origem: "Indicação" | "Instagram" | "Busca no Google" | "Outros" | undefined;
  dt_entradaPaciente: Date;
}
