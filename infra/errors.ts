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

export class NotFoundError extends BaseError {
  constructor({ message, action }: { message?: string; action?: string } = {}) {
    super({
      message: message || "Não foi possível encontrar este recurso no sistema.",
      action:
        action ||
        "Verifique se os parâmetros enviados na consulta estão certos.",
      statusCode: 404,
    });
  }
}

export class MethodNotAllowedError extends BaseError {
  constructor() {
    super({
      message: "Método não permitido para este endpoint.",
      action: "Verifique se o método HTTP enviado é válido para este endpoint.",
      statusCode: 405,
    });
  }
}

export class InternalServerError extends BaseError {
  constructor({ message, cause }: { message?: string; cause?: unknown } = {}) {
    super({
      message: message || "Um erro interno não esperado aconteceu.",
      action: "Entre em contato com o suporte.",
      statusCode: 500,
    });

    if (cause) {
      (this as { cause?: unknown }).cause = cause;
    }
  }
}

export class ServiceError extends BaseError {
  constructor({ message, cause }: { message?: string; cause?: unknown } = {}) {
    super({
      message: message || "Serviço indisponível no momento.",
      action: "Verifique se o serviço está disponível.",
      statusCode: 503,
    });

    if (cause) {
      (this as { cause?: unknown }).cause = cause;
    }
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
