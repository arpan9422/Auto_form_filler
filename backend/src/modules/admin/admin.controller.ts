import { Request, Response } from "express";
import {
  getAdminDashboardService,
  listUsersService,
  searchUsersService,
  getUserDetailService,
  adjustUserCreditsService,
  deleteUserService,
  getCreditStatsService,
  listPaymentsService,
  listFormActivityService,
  getDomainStatsService,
  getLogsService,
  getRequestLogsService,
  getAiUsageService,
  getReferralStatsService,
  sendBroadcastEmailService,
} from "./admin.service";

const p = (v: unknown, fallback: number) => {
  const n = parseInt(String(v), 10);
  return isNaN(n) || n < 1 ? fallback : n;
};

// ── Dashboard ──────────────────────────────────────────────────────────

export const getDashboard = async (_req: Request, res: Response) => {
  res.json(await getAdminDashboardService());
};

// ── Users ──────────────────────────────────────────────────────────────

export const listUsers = async (req: Request, res: Response) => {
  const page = p(req.query.page, 1);
  const limit = p(req.query.limit, 20);
  const search = req.query.search as string | undefined;
  res.json(await listUsersService(page, limit, search));
};

export const searchUsers = async (req: Request, res: Response) => {
  const q = (req.query.q as string) ?? "";
  res.json(await searchUsersService(q));
};

export const getUserDetail = async (req: Request, res: Response) => {
  res.json(await getUserDetailService(req.params.userId));
};

export const adjustCredits = async (req: Request, res: Response) => {
  const { amount, reason } = req.body as { amount: number; reason: string };
  res.json(await adjustUserCreditsService(req.params.userId, amount, reason ?? "Admin adjustment"));
};

export const deleteUser = async (req: Request, res: Response) => {
  res.json(await deleteUserService(req.params.userId));
};

// ── Credits ────────────────────────────────────────────────────────────

export const getCreditStats = async (_req: Request, res: Response) => {
  res.json(await getCreditStatsService());
};

// ── Payments ───────────────────────────────────────────────────────────

export const listPayments = async (req: Request, res: Response) => {
  res.json(await listPaymentsService(p(req.query.page, 1), p(req.query.limit, 20)));
};

// ── Form activity ──────────────────────────────────────────────────────

export const listFormActivity = async (req: Request, res: Response) => {
  res.json(await listFormActivityService(p(req.query.page, 1), p(req.query.limit, 50)));
};

export const getDomainStats = async (_req: Request, res: Response) => {
  res.json(await getDomainStatsService());
};

// ── Logs ───────────────────────────────────────────────────────────────

export const getAppLogs = async (req: Request, res: Response) => {
  const { level, context } = req.query as Record<string, string>;
  res.json(await getLogsService(p(req.query.page, 1), p(req.query.limit, 50), level, context));
};

export const getRequestLogs = async (req: Request, res: Response) => {
  const statusCode = req.query.statusCode ? parseInt(req.query.statusCode as string, 10) : undefined;
  const path = req.query.path as string | undefined;
  res.json(await getRequestLogsService(p(req.query.page, 1), p(req.query.limit, 50), statusCode, path));
};

// ── AI usage ───────────────────────────────────────────────────────────

export const getAiUsage = async (_req: Request, res: Response) => {
  res.json(await getAiUsageService());
};

// ── Referrals ──────────────────────────────────────────────────────────

export const getReferralStats = async (_req: Request, res: Response) => {
  res.json(await getReferralStatsService());
};

// ── Email broadcast ────────────────────────────────────────────────────

export const sendBroadcastEmail = async (req: Request, res: Response) => {
  const { target, subject, htmlContent, textContent } = req.body as {
    target: { type: "single"; userId: string } | { type: "multiple"; userIds: string[] } | { type: "all" };
    subject: string;
    htmlContent: string;
    textContent?: string;
  };
  const result = await sendBroadcastEmailService(target, { subject, htmlContent, textContent });
  res.status(202).json(result); // 202 Accepted — processing in background
};
