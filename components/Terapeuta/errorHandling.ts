export class TerapeutaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TerapeutaError";
  }
}

export function handleTerapeutaError(error: unknown): string {
  if (error instanceof TerapeutaError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Erro desconhecido ao processar terapeuta";
}
