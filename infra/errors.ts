// Versão TypeScript do errors.js para facilitar o uso no frontend

export class BaseError extends Error {
  action: string;
  statusCode: number;

  constructor({
    message,
    action,
    statusCode = 500,
  }: {
    message: string;
    action: string;
    statusCode?: number;
  }) {
    super(message);
    this.name = this.constructor.name;
    this.action = action;
    this.statusCode = statusCode;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ValidationError extends BaseError {
  constructor({ message, action }: { message: string; action?: string }) {
    super({
      message,
      action: action || "Corrija os dados e tente novamente.",
      statusCode: 400,
    });
  }
}

export class TerapeutaError extends ValidationError {
  constructor(message: string) {
    super({
      message,
      action: "Verifique os dados do terapeuta e tente novamente.",
    });
  }
}

// Função para tratamento de erros de Terapeuta no frontend
export function handleTerapeutaError(error: any): string {
  if (error instanceof TerapeutaError) {
    return `${error.message} ${error.action}`;
  }

  // Se for um erro de resposta da API
  if (error && typeof error === "object" && "name" in error) {
    const apiError = error as {
      name?: string;
      message?: string;
      action?: string;
    };

    if (apiError.name === "ValidationError" && apiError.message) {
      return apiError.message;
    }

    if (apiError.message) {
      return apiError.message;
    }
  }

  // Fallback para erros genéricos
  if (error instanceof Error) {
    return error.message;
  }

  return "Erro desconhecido ao processar terapeuta";
}
