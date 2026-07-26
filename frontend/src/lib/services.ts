import api from "./api";

// ── Types ──────────────────────────────────────────────────────────────

export type Project = {
  id: string;
  name: string;
  description: string;
  projectLinks: string[];
  techStacks: string[];
  priority: number;
  createdAt: string;
};

export type Answer = {
  id: string;
  title: string;
  category: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
};

export type Resume = {
  id: string;
  label: string;
  target?: string | null;
  description?: string | null;
  pdfUrl: string;
  isDefault: boolean;
  createdAt: string;
};

export type Memory = {
  id: string;
  type: "PERSONAL" | "PROJECT" | "ANSWER" | "RESUME" | "PREFERENCE" | "CUSTOM";
  value: string;
  createdAt: string;
};

export type DashboardOverview = {
  stats: {
    timeSavedMinutesThisWeek: number;
    formsFilled: number;
    totalTokens?: number;
  };
  recentSites: { name: string; timeLabel: string }[];
  aiEdits: { thisWeek: number; quotaPercent: number };
  totalTokens?: number;
};

export type DashboardAnalytics = {
  stats: {
    formsFilled: number;
    acceptedWithoutEdits: number;
    timeSavedSec: number;
    mostUsedSite: string;
    totalTokens: number;
  };
  topSites: { name: string; count: number; pct: number }[];
  weekData: { day: string; forms: number }[];
  insights: string[];
  recentFills?: {
    id: string;
    platform: string;
    websiteUrl: string | null;
    date: string;
    fieldsFilled: number;
    totalFields: number;
    tokensUsed: number;
    fieldsAnswered: { key: string; label: string }[];
    fieldsUnanswered: { key: string; label: string; reason: string }[];
  }[];
};

// ── Projects ───────────────────────────────────────────────────────────

export const projectsApi = {
  list: () => api.get<Project[]>("/projects"),
  create: (data: { name: string; description: string; projectLinks?: string[]; techStacks?: string[]; priority?: number }) =>
    api.post<Project>("/projects", data),
  update: (id: string, data: { name: string; description: string; projectLinks?: string[]; techStacks?: string[]; priority?: number }) =>
    api.put<Project>(`/projects/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/projects/${id}`),
  voiceDescribe: (audio: string, projectName?: string) =>
    api.post<{ transcript: string; description: string; warning?: string }>("/projects/voice-describe", { audio, projectName }),
  githubAnalyze: (repoUrl: string) =>
    api.post<{
      name: string; fullName: string; stars: number; forks: number;
      topics: string[]; languages: string[];
      description: string; techStack: string[];
      problemSolved: string; howItWorks: string;
      fileStructure: string; keyFeatures: string[];
      warning?: string;
    }>("/projects/github-analyze", { repoUrl }),
};

// ── Custom Answers ─────────────────────────────────────────────────────

export const answersApi = {
  list: () => api.get<Answer[]>("/custom-answers"),
  create: (data: { title: string; category: string; answer: string }) =>
    api.post<Answer>("/custom-answers", data),
  update: (id: string, data: { title: string; category: string; answer: string }) =>
    api.put<Answer>(`/custom-answers/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/custom-answers/${id}`),
};

// ── Resumes ────────────────────────────────────────────────────────────

export const resumesApi = {
  list: () => api.get<Resume[]>("/resume"),
  uploadPdf: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<{ fileUrl: string; key: string }>("/resume/upload", formData);
  },
  create: (data: { label: string; target?: string; description?: string; pdfUrl: string; isDefault?: boolean }) =>
    api.post<Resume>("/resume", data),
  update: (id: string, data: { label: string; target?: string; description?: string; pdfUrl: string; isDefault?: boolean }) =>
    api.put<Resume>(`/resume/${id}`, data),
  setDefault: (id: string) => api.patch<Resume>(`/resume/${id}/default`),
  remove: (id: string) => api.delete<{ message: string }>(`/resume/${id}`),
};

// ── Memory ─────────────────────────────────────────────────────────────

export const memoryApi = {
  list: () => api.get<Memory[]>("/memory"),
  create: (data: { type: Memory["type"]; value: string }) =>
    api.post<Memory>("/memory", data),
  update: (id: string, data: { type: Memory["type"]; value: string }) =>
    api.put<Memory>(`/memory/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/memory/${id}`),
};

// ── Dashboard ──────────────────────────────────────────────────────────

export const dashboardApi = {
  overview: () => api.get<DashboardOverview>("/dashboard/overview"),
  analytics: () => api.get<DashboardAnalytics>("/dashboard/analytics"),
};

// ── GitHub OAuth ───────────────────────────────────────────────────────

export const githubApi = {
  getAuthUrl: () => api.get<{ url: string }>("/github/auth-url"),
  getStatus: () => api.get<{ connected: boolean; login?: string; connectedAt?: string }>("/github/status"),
  disconnect: () => api.delete<{ message: string }>("/github/disconnect"),
};

// ── AI Chat Agent (LangGraph & Episodic Memory) ─────────────────────────

export interface ChatEpisodeSummary {
  id: string;
  title: string;
  summary?: string;
  updatedAt: string;
  createdAt: string;
}

export interface ChatEpisodeDetail extends ChatEpisodeSummary {
  messages: Array<{
    id: string;
    role: "user" | "ai";
    content: string;
    sources?: string[];
    createdAt: string;
  }>;
}

export const aiChatApi = {
  chat: (data: { message: string; history?: Array<{ role: string; content: string }>; episodeId?: string }) =>
    api.post<{ episodeId: string; response: string; sources: string[] }>("/ai/agent/chat", data),
  listEpisodes: () =>
    api.get<{ episodes: ChatEpisodeSummary[] }>("/ai/agent/episodes"),
  getEpisode: (id: string) =>
    api.get<{ episode: ChatEpisodeDetail }>(`/ai/agent/episodes/${id}`),
  deleteEpisode: (id: string) =>
    api.delete<{ success: boolean }>(`/ai/agent/episodes/${id}`),
};

// ── Universal LLM Gateway (Multi-Provider AI Switcher) ────────────────────────

export interface GatewayProviderModel {
  id: string;
  name: string;
}

export interface GatewayProvider {
  id: string;
  name: string;
  description: string;
  color: string;
  requiresApiKey: boolean;
  defaultBaseURL: string;
  models: GatewayProviderModel[];
}

export interface GatewayConfig {
  id?: string;
  provider: string;
  model: string;
  apiKey?: string;
  hasKey?: boolean;
  baseURL?: string;
  temperature?: number;
}

export interface GatewayTestResponse {
  success: boolean;
  latencyMs: number;
  provider: string;
  model: string;
  message?: string;
  error?: string;
  rawResponse?: unknown;
}

export const llmGatewayApi = {
  getProviders: () =>
    api.get<{ providers: GatewayProvider[] }>("/ai/gateway/providers"),
  getConfig: () =>
    api.get<GatewayConfig>("/ai/gateway/config"),
  updateConfig: (config: Partial<GatewayConfig>) =>
    api.put<{ message: string; config: GatewayConfig }>("/ai/gateway/config", config),
  testConnection: (config: Partial<GatewayConfig>) =>
    api.post<GatewayTestResponse>("/ai/gateway/test", config),
};
