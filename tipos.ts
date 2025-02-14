export interface Terapeuta {
  id: string;
  nomeTerapeuta: string;
  telefoneTerapeuta: string;
  emailTerapeuta: string;
  enderecoTerapeuta: string;
  dtEntrada: Date;
  chavePix: string;
  foto?: string | null; // Torna 'foto' opcional
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
  dtEntradaPaciente: Date;
}
