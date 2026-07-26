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

async function request<T>(path: string, options: RequestOptions = {}): Promise<{ data: T }> {
  const headers = new Headers(options.headers);

  // Automatically attach auth token if available
  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body: BodyInit | undefined = undefined;

  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      body = options.body;
      // Do not set Content-Type; fetch will set it to multipart/form-data with boundary automatically
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
  });

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
