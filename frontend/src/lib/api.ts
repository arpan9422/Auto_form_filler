import { getToken, getRefreshToken, setToken, setRefreshToken, removeToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type RequestOptions = {
  body?: unknown;
  headers?: HeadersInit;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
};

export type ApiErrorResponse = {
  error?: string;
  message?: string;
};

export class ApiError extends Error {
  status: number;
  data?: ApiErrorResponse;

  constructor(message: string, status: number, data?: ApiErrorResponse) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Singleton refresh promise — prevents multiple concurrent refresh calls
let refreshPromise: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new ApiError("No refresh token", 401);

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    // Refresh itself failed — clear everything and redirect to auth
    removeToken();
    if (typeof window !== "undefined") window.location.href = "/auth";
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  const { accessToken, refreshToken: newRefreshToken } = data as {
    accessToken: string;
    refreshToken: string;
  };

  setToken(accessToken);
  if (newRefreshToken) setRefreshToken(newRefreshToken);

  return accessToken;
}

async function refreshAccessToken(): Promise<string> {
  // Deduplicate concurrent refresh calls
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<{ data: T }> {
  const token = getToken();
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  // On 401, attempt a token refresh once then retry the original request
  if (response.status === 401 && !isRetry) {
    try {
      const newToken = await refreshAccessToken();
      // Retry with the fresh token
      const retryHeaders = new Headers(options.headers);
      retryHeaders.set("Content-Type", "application/json");
      retryHeaders.set("Authorization", `Bearer ${newToken}`);

      const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method ?? "GET",
        headers: retryHeaders,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });

      const retryText = await retryResponse.text();
      const retryData = retryText ? (JSON.parse(retryText) as T | ApiErrorResponse) : null;

      if (!retryResponse.ok) {
        const errorData = (retryData ?? {}) as ApiErrorResponse;
        throw new ApiError(
          errorData.error || errorData.message || "Something went wrong. Please try again.",
          retryResponse.status,
          errorData
        );
      }

      return { data: retryData as T };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError("Session expired. Please log in again.", 401);
    }
  }

  const responseText = await response.text();
  const data = responseText ? (JSON.parse(responseText) as T | ApiErrorResponse) : null;

  if (!response.ok) {
    const errorData = (data ?? {}) as ApiErrorResponse;
    throw new ApiError(
      errorData.error || errorData.message || "Something went wrong. Please try again.",
      response.status,
      errorData
    );
  }

  return { data: data as T };
}

const api = {
  get: <T>(path: string, headers?: HeadersInit) =>
    request<T>(path, { method: "GET", headers }),
  post: <T>(path: string, body?: unknown, headers?: HeadersInit) =>
    request<T>(path, { method: "POST", body, headers }),
  put: <T>(path: string, body?: unknown, headers?: HeadersInit) =>
    request<T>(path, { method: "PUT", body, headers }),
  patch: <T>(path: string, body?: unknown, headers?: HeadersInit) =>
    request<T>(path, { method: "PATCH", body, headers }),
  delete: <T>(path: string, headers?: HeadersInit) =>
    request<T>(path, { method: "DELETE", headers }),
};

export default api;
