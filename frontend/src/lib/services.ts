import api from "./api";

// ── Types ──────────────────────────────────────────────────────────────

export type Project = {
  id: string;
  name: string;
  description: string;
  projectLinks: string[];
  techStacks: string[];
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
  wallet: {
    credits: number;
    weeklyFreeCredits: number;
    freeLeftThisWeek: number;
    paidCredits: number;
  };
  stats: {
    creditsUsedThisWeek: number;
    freeLeftThisWeek: number;
    timeSavedMinutesThisWeek: number;
    paidCredits: number;
  };
  recentSites: { name: string; timeLabel: string }[];
  aiEdits: { thisWeek: number; quotaPercent: number };
};

export type DashboardAnalytics = {
  stats: {
    formsFilled: number;
    acceptedWithoutEdits: number;
    timeSavedSec: number;
    mostUsedSite: string;
  };
  topSites: { name: string; count: number; pct: number }[];
  weekData: { day: string; forms: number }[];
  insights: string[];
};

export type WalletSummary = {
  credits: number;
  weeklyFreeCredits: number;
  lastCreditResetAt: string;
};

export type WalletAnalytics = {
  today: number;
  thisWeek: number;
  lifetime: number;
  avgPerDay: number;
};

export type WalletBreakdown = {
  formFill: number;
  chatRefine: number;
  regenerate: number;
  resumeParse: number;
};

export type Transaction = {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  reason: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type Purchase = {
  id: string;
  creditsBought: number;
  amountPaid: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type ReferralStats = {
  referralCode: string;
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalCreditsEarned: number;
};

// ── Projects ───────────────────────────────────────────────────────────

export const projectsApi = {
  list: () => api.get<Project[]>("/projects"),
  create: (data: { name: string; description: string; projectLinks?: string[]; techStacks?: string[] }) =>
    api.post<Project>("/projects", data),
  update: (id: string, data: { name: string; description: string; projectLinks?: string[]; techStacks?: string[] }) =>
    api.put<Project>(`/projects/${id}`, data),
  remove: (id: string) => api.delete<{ message: string }>(`/projects/${id}`),
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
  getUploadUrl: (filename: string, contentType?: string) =>
    api.post<{ uploadUrl: string; fileUrl: string; key: string }>("/resume/upload-url", { filename, contentType }),
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

// ── Wallet ─────────────────────────────────────────────────────────────

export const walletApi = {
  summary: () => api.get<WalletSummary>("/wallet/summary"),
  analytics: () => api.get<WalletAnalytics>("/wallet/analytics"),
  breakdown: () => api.get<WalletBreakdown>("/wallet/breakdown"),
  transactions: () => api.get<{ transactions: Transaction[]; purchases: Purchase[] }>("/wallet/transactions"),
  topup: (data: { creditsBought: number; amountPaid: number; currency: string; paymentProvider?: string; paymentRef?: string }) =>
    api.post<{ message: string; purchase: Purchase }>("/wallet/topup", data),
};

// ── Referrals ──────────────────────────────────────────────────────────

export const referralApi = {
  me: () => api.get<ReferralStats>("/refferals/me"),
};
