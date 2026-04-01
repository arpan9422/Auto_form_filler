// API utility for extension
const API_URL = "http://localhost:5000/api";

export async function getToken(): Promise<string | null> {
  const { token } = await chrome.storage.local.get("token");
  return token || null;
}

export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ token });
}

export async function removeToken(): Promise<void> {
  await chrome.storage.local.remove("token");
}

export async function apiRequest(
  endpoint: string,
  method: string = "GET",
  body?: any
) {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return response.json();
}
