import { firebaseAuth } from "@/config/firebase";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);

export class ApiError extends Error {
  constructor(message, { status = 0, code = "UNKNOWN_ERROR", details, requestId } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

async function readResponse(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function getAuthToken() {
  const user = firebaseAuth?.currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken();
  } catch {
    window.dispatchEvent(new CustomEvent("pos:unauthorized"));
    throw new ApiError("Tu sesión expiró. Vuelve a iniciar sesión.", {
      status: 401,
      code: "TOKEN_EXPIRED",
    });
  }
}

/**
 * Thin fetch wrapper: timeout, JSON handling, auth header and a single error shape.
 */
export async function apiRequest(
  path,
  { method = "GET", body, auth = false, timeout = DEFAULT_TIMEOUT, signal } = {}
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";

    if (auth) {
      const token = await getAuthToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = await readResponse(response);

    if (!response.ok) {
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent("pos:unauthorized"));
      }

      throw new ApiError(
        payload?.error?.message || "No se pudo completar la solicitud",
        {
          status: response.status,
          code: payload?.error?.code || "HTTP_ERROR",
          details: payload?.error?.details,
          requestId: payload?.error?.requestId,
        }
      );
    }

    return payload?.data ?? null;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error?.name === "AbortError") {
      throw new ApiError(
        "La solicitud tardó demasiado. Revisa tu conexión e intenta nuevamente.",
        { code: "TIMEOUT" }
      );
    }

    throw new ApiError(
      "No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.",
      { code: "NETWORK_ERROR" }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
