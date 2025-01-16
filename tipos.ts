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
