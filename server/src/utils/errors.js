/**
 * Operational errors are safe to expose to API clients.
 * Anything else is treated as an unexpected error by the error handler.
 */
export class AppError extends Error {
  constructor({
    status = 500,
    code = "INTERNAL_ERROR",
    message = "Ocurrió un error inesperado",
    details,
    cause,
  } = {}) {
    super(message, { cause });
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(message, code = "BAD_REQUEST", details) {
    return new AppError({ status: 400, code, message, details });
  }

  static unauthorized(message = "Debes iniciar sesión", code = "UNAUTHORIZED") {
    return new AppError({ status: 401, code, message });
  }

  static forbidden(message = "No tienes permisos para esta acción", code = "FORBIDDEN") {
    return new AppError({ status: 403, code, message });
  }

  static notFound(message = "Recurso no encontrado", code = "NOT_FOUND") {
    return new AppError({ status: 404, code, message });
  }

  static conflict(message, code = "CONFLICT", details) {
    return new AppError({ status: 409, code, message, details });
  }
}
