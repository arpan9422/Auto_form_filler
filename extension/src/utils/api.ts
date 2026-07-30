// API utility for extension
const API_URL = "http://127.0.0.1:5000/api";
const TOKEN_COOKIE_NAME = "token";
const FRONTEND_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  for (const url of FRONTEND_ORIGINS) {
    try {
      const cookie = await chrome.cookies.get({ url, name: TOKEN_COOKIE_NAME });
      if (cookie?.value) return cookie.value;
    } catch (err) {
      console.warn(`[FormPilot] Could not get cookie for ${url}:`, err);
    }
  }
  const { token } = await chrome.storage.local.get("token");
  return token || null;
}

export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ token });
}

export async function removeToken(): Promise<void> {
  await chrome.storage.local.remove("token");
}

// ─── Low-level request ────────────────────────────────────────────────────────

export async function apiRequest(
  endpoint: string,
  method: string = "GET",
  body?: unknown,
  signal?: AbortSignal
) {
  const token = await getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal
  });
  
  console.log(`[FormPilot] API Request to ${endpoint} returned status ${response.status}`);
  return response.json();
}

// ─── Typed LLM layer API calls ────────────────────────────────────────────────

export interface AgentFillPayload {
  fields: unknown[];
  currentFormState?: Record<string, string>;
  domain?: string;
  formId?: string;
  sessionId?: string;
  rawHtml?: string;
  url?: string;
}

export interface AgentFillResponse {
  answers: Record<string, string>;
  unresolved: Array<{ fieldKey: string; reason: string }>;
  warnings: string[];
  trace: { 
    usedRag: boolean; 
    usedTools: string[];
    tokenUsage?: { prompt: number; completion: number; total: number };
  };
}

export async function recordAnalytics(payload: any): Promise<void> {
  try {
    console.log("[FormPilot] Recording analytics...");
    await apiRequest("/dashboard/analytics", "POST", payload);
  } catch (err) {
    console.warn("[FormPilot] Failed to record analytics", err);
  }
}

/**
 * Call the LangGraph autofill agent endpoint.
 * Falls through to the legacy /generate endpoint if this fails.
 */
export async function agentFill(payload: AgentFillPayload, signal?: AbortSignal): Promise<AgentFillResponse | null> {
  try {
    console.log("[FormPilot] Calling agentFill API...");
    const data = await apiRequest("/ai/agent/fill", "POST", payload, signal);
    if (data && typeof data.answers === "object" && !data.error) {
      console.log("[FormPilot] agentFill success");
      return data as AgentFillResponse;
    }
    console.log("[FormPilot] agentFill returned invalid data");
    return null;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log("[FormPilot] agentFill aborted");
      throw err;
    }
    console.warn("[FormPilot] agentFill error", err);
    return null;
  }
}

/**
 * Call the legacy deterministic /generate endpoint.
 */
export async function legacyFill(fields: unknown[]): Promise<Record<string, string> | null> {
  try {
    const data = await apiRequest("/ai/generate", "POST", { fields });
    if (data && typeof data === "object" && !data.error) {
      return data as Record<string, string>;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Call the LangGraph refine agent endpoint.
 * Returns only the delta fields that should be updated.
 */
export async function agentRefine(
  message: string,
  formState: Record<string, string>,
  sessionId?: string
): Promise<Record<string, string> | null> {
  try {
    const data = await apiRequest("/ai/agent/refine", "POST", {
      message,
      formState,
      sessionId,
    });
    if (data && typeof data === "object" && !data.error) {
      return data as Record<string, string>;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Call the LangGraph conversational Chat Agent endpoint.
 */
export async function agentChat(
  message: string,
  history: Array<{ role: string; content: string }> = [],
  episodeId?: string
): Promise<{ response: string; episodeId?: string } | null> {
  try {
    const data = await apiRequest("/ai/agent/chat", "POST", {
      message,
      history,
      episodeId,
    });
    if (data && typeof data === "object" && !data.error) {
      return data as { response: string; episodeId?: string };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Domain inference (used to help the classifier) ──────────────────────────

export function inferDomain(hostname: string): string {
  if (hostname.includes("linkedin.com")) return "LinkedIn";
  if (hostname.includes("workday.com") || hostname.includes("myworkdayjobs.com")) return "Workday";
  if (hostname.includes("greenhouse.io") || hostname.includes("boards.greenhouse")) return "Greenhouse";
  if (hostname.includes("lever.co")) return "Lever";
  if (hostname.includes("smartrecruiters.com")) return "SmartRecruiters";
  if (hostname.includes("ashbyhq.com")) return "Ashby";
  if (hostname.includes("jobs.google.com")) return "Google Jobs";
  if (hostname.includes("indeed.com")) return "Indeed";
  return hostname.replace(/^www\./, "");
}
