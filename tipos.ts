export interface Terapeuta {
  idTerapeuta: string;
  nomeTerapeuta: string;
  fotoTerapeuta?: string | null; // Torna 'foto' opcional
  telefoneTerapeuta: string;
  emailTerapeuta: string;
  enderecoTerapeuta: string;
  dt_entradaTerapeuta: Date;
  chave_pixTerapeuta: string;
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
