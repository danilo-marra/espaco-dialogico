import { InternalServerError, MethodNotAllowedError } from "infra/errors";

const ERROR_STATUS_FALLBACK = {
  ValidationError: 400,
  NotFoundError: 404,
};

function serializeKnownError(error) {
  const statusCode =
    error.statusCode || error.status_code || ERROR_STATUS_FALLBACK[error.name];

  return {
    statusCode,
    body: {
      name: error.name,
      message: error.message,
      action: error.action,
      status_code: statusCode,
    },
  };
}

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, request, response) {
  if (error?.name === "ValidationError" || error?.name === "NotFoundError") {
    const { statusCode, body } = serializeKnownError(error);
    return response.status(statusCode).json(body);
  }

  const publicErrorObject = new InternalServerError({
    statusCode: error.statusCode,
    cause: error,
  });

  console.error(publicErrorObject);

  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
};

export default controller;
