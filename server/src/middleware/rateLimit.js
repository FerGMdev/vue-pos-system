import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export function createRateLimiter({
  windowMs = env.RATE_LIMIT_WINDOW_MS,
  max = env.RATE_LIMIT_MAX,
  code = "RATE_LIMITED",
  message = "Demasiadas solicitudes. Intenta de nuevo en unos minutos.",
} = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => env.isTest,
    handler: (req, res) => {
      res.status(429).json({
        error: {
          code,
          message,
          requestId: req.id,
        },
      });
    },
  });
}
