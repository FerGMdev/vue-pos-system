import { AppError } from "../utils/errors.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function mapFirebaseAuthError(error) {
  const code = error?.code ?? "";

  if (code.includes("id-token-expired")) {
    return AppError.unauthorized(
      "Tu sesión expiró. Vuelve a iniciar sesión.",
      "TOKEN_EXPIRED"
    );
  }

  return AppError.unauthorized(
    "Sesión inválida o expirada. Vuelve a iniciar sesión.",
    "INVALID_TOKEN"
  );
}

export function createAuthMiddleware({ auth }) {
  const requireAuth = asyncHandler(async (req, _res, next) => {
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw AppError.unauthorized(
        "Debes iniciar sesión para realizar esta acción",
        "AUTH_REQUIRED"
      );
    }

    try {
      const decoded = await auth.verifyIdToken(token, true);
      req.user = {
        uid: decoded.uid,
        email: decoded.email ?? null,
        role: decoded.role ?? (decoded.admin === true ? "admin" : null),
      };
      next();
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  });

  function requireRole(...roles) {
    return function roleGuard(req, _res, next) {
      if (!req.user) {
        return next(AppError.unauthorized());
      }
      if (!roles.includes(req.user.role)) {
        return next(
          AppError.forbidden(
            "No tienes permisos para realizar esta acción",
            "ROLE_REQUIRED"
          )
        );
      }
      return next();
    };
  }

  return { requireAuth, requireRole };
}
