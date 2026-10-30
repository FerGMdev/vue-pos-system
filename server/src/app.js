import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { createErrorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { createRateLimiter } from "./middleware/rateLimit.js";
import { requestId } from "./middleware/requestId.js";
import { createApiRouter } from "./routes/index.js";

export function createApp({ services, auth, config, logger }) {
  const app = express();

  app.disable("x-powered-by");
  if (env.TRUST_PROXY) app.set("trust proxy", 1);

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      autoLogging: {
        ignore: (req) => req.url === "/api/health",
      },
      customLogLevel: (_req, res, error) => {
        if (error || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
    })
  );

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
      maxAge: 86400,
    })
  );
  app.use(express.json({ limit: "100kb" }));

  const authMiddleware = createAuthMiddleware({ auth });
  const generalLimiter = createRateLimiter();

  app.use(
    "/api",
    generalLimiter,
    createApiRouter({ services, auth: authMiddleware, config })
  );

  app.use(notFoundHandler);
  app.use(createErrorHandler({ logger }));

  return app;
}
