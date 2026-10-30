import { ZodError } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

export function notFoundHandler(req, _res, next) {
  next(
    AppError.notFound(
      `Ruta ${req.method} ${req.originalUrl} no encontrada`,
      "ROUTE_NOT_FOUND"
    )
  );
}

export function createErrorHandler({ logger }) {
  // Express identifies error middleware by its four arguments.
  return function errorHandler(error, req, res, next) {
    if (res.headersSent) return next(error);

    let status = error.status ?? 500;
    let code = error.code ?? "INTERNAL_ERROR";
    let message = error.message ?? "Ocurrió un error inesperado";
    let details = error.details;

    if (error instanceof ZodError) {
      status = 400;
      code = "VALIDATION_ERROR";
      message = "Los datos enviados no son válidos";
      details = error.issues.map((issue) => ({
        path: issue.path.join(".") || "body",
        message: issue.message,
      }));
    } else if (error.type === "entity.parse.failed") {
      status = 400;
      code = "INVALID_JSON";
      message = "El cuerpo de la solicitud no es JSON válido";
    } else if (String(error.message ?? "").includes("Not allowed by CORS")) {
      status = 403;
      code = "CORS_NOT_ALLOWED";
      message = "El origen de la solicitud no está permitido";
    }

    if (status >= 500) {
      logger.error(
        { err: error, requestId: req.id, path: req.originalUrl },
        "Error no controlado"
      );
      code = "INTERNAL_ERROR";
      message = env.isProduction
        ? "Ocurrió un error inesperado. Intenta nuevamente."
        : error.message;
      details = undefined;
    } else {
      logger.warn(
        { requestId: req.id, code, path: req.originalUrl },
        "Solicitud rechazada"
      );
    }

    res.status(status).json({
      error: {
        code,
        message,
        ...(details ? { details } : {}),
        requestId: req.id,
      },
    });
  };
}
