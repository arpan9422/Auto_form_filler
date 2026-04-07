import prisma from "../../config/database";
import { TransactionType, TransactionReason } from "../../generated/prisma";
import { withCache, cacheDel, cacheDelPattern, CacheKey, TTL } from "../../utils/cache";
import { sendEmailWithBrevo } from "../../utils/brevo";
import { logger } from "../../utils/logger";

// ── helpers ────────────────────────────────────────────────────────────

const startOfDay = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const startOfWeek = (d = new Date()) => {
  const s = startOfDay(d);
  s.setDate(s.getDate() - s.getDay());
  return s;
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
};

// ── 1. Dashboard overview ──────────────────────────────────────────────

export const getAdminDashboardService = () =>
  withCache(CacheKey.adminDashboard(), TTL.ADMIN_DASHBOARD, async () => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);

    const [
      totalUsers, newSignupsToday, newSignupsThisWeek,
      activeUsersToday, formsFilledToday, creditsUsedToday,
      totalRevenue, recentSignups, topSites, dailySignups, dailyForms,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.usageAnalytics.groupBy({ by: ["userId"], where: { createdAt: { gte: todayStart } }, _count: true }).then(r => r.length),
      prisma.usageAnalytics.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.usageAnalytics.aggregate({ where: { createdAt: { gte: todayStart } }, _sum: { creditsUsed: true } }).then(r => r._sum.creditsUsed ?? 0),
      prisma.purchase.aggregate({ where: { status: "SUCCESS" }, _sum: { amountPaid: true } }).then(r => r._sum.amountPaid ?? 0),
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, firstName: true, lastName: true, email: true, createdAt: true, credits: true } }),
      prisma.usageAnalytics.groupBy({ by: ["platform"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 5 }),
      Promise.all(Array.from({ length: 7 }, (_, i) => {
        const day = daysAgo(6 - i);
        const next = new Date(day); next.setDate(next.getDate() + 1);
        return prisma.user.count({ where: { createdAt: { gte: day, lt: next } } })
          .then(count => ({ day: day.toLocaleDateString("en-US", { weekday: "short" }), count }));
      })),
      Promise.all(Array.from({ length: 7 }, (_, i) => {
        const day = daysAgo(6 - i);
        const next = new Date(day); next.setDate(next.getDate() + 1);
        return prisma.usageAnalytics.count({ where: { createdAt: { gte: day, lt: next } } })
          .then(count => ({ day: day.toLocaleDateString("en-US", { weekday: "short" }), count }));
      })),
    ]);

    return {
      kpis: { totalUsers, newSignupsToday, newSignupsThisWeek, activeUsersToday, formsFilledToday, creditsUsedToday, totalRevenueINR: totalRevenue },
      charts: { dailySignups, dailyForms, topSites },
      recentSignups,
    };
  });

// ── 2. User management ─────────────────────────────────────────────────

export const listUsersService = async (page: number, limit: number, search?: string) => {
  const where = search ? {
    OR: [
      { email: { contains: search, mode: "insensitive" as const } },
      { firstName: { contains: search, mode: "insensitive" as const } },
      { lastName: { contains: search, mode: "insensitive" as const } },
    ],
  } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" },
      select: { id: true, email: true, firstName: true, lastName: true, credits: true, weeklyFreeCredits: true, onboardingDone: true, createdAt: true, updatedAt: true, _count: { select: { analytics: true } } },
    }),
    prisma.user.count({ where }),
  ]);
  return { users, total, page, limit, pages: Math.ceil(total / limit) };
};

export const getUserDetailService = (userId: string) =>
  prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      links: true, educations: true, works: true, projects: true, resumes: true, memories: true,
      transactions: { orderBy: { createdAt: "desc" }, take: 20 },
      purchases: { orderBy: { createdAt: "desc" }, take: 10 },
      analytics: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

export const searchUsersService = async (q: string) => {
  if (!q.trim()) return [];
  return prisma.user.findMany({
    where: {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 10,
    orderBy: { createdAt: "desc" },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
};

export const adjustUserCreditsService = async (userId: string, amount: number, reason: string) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const newCredits = Math.max(0, user.credits + amount);

  const [updated] = await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { credits: newCredits } }),
    prisma.creditTransaction.create({
      data: {
        userId,
        type: amount >= 0 ? TransactionType.CREDIT : TransactionType.DEBIT,
        amount: Math.abs(amount),
        reason: TransactionReason.ADMIN_ADJUSTMENT,
        metadata: { adminNote: reason, delta: amount },
      },
    }),
  ]);

  // Invalidate user-specific caches + admin dashboard (credits changed)
  cacheDel(
    CacheKey.userDashboardOverview(userId),
    CacheKey.userDashboardAnalytics(userId),
    CacheKey.userWallet(userId),
    CacheKey.adminDashboard(),
    CacheKey.adminCredits(),
  );

  return updated;
};

export const deleteUserService = async (userId: string) => {
  await prisma.user.delete({ where: { id: userId } });
  // Wipe all caches for this user + admin dashboard
  void cacheDelPattern(`user:${userId}:*`);
  cacheDel(CacheKey.adminDashboard(), CacheKey.adminCredits());
  return { message: "User deleted" };
};

// ── 3. Credits & billing ───────────────────────────────────────────────

export const getCreditStatsService = () =>
  withCache(CacheKey.adminCredits(), TTL.ADMIN_STATS, async () => {
    const [totalPurchased, totalConsumed, totalUsers, purchases] = await Promise.all([
      prisma.creditTransaction.aggregate({ where: { type: TransactionType.CREDIT }, _sum: { amount: true } }).then(r => r._sum.amount ?? 0),
      prisma.creditTransaction.aggregate({ where: { type: TransactionType.DEBIT }, _sum: { amount: true } }).then(r => r._sum.amount ?? 0),
      prisma.user.count(),
      prisma.purchase.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { email: true, firstName: true, lastName: true } } } }),
    ]);
    return { totalPurchased, totalConsumed, totalUsers, recentPurchases: purchases };
  });

// ── 4. Payment management ──────────────────────────────────────────────

export const listPaymentsService = async (page: number, limit: number) => {
  const [payments, total] = await Promise.all([
    prisma.purchase.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" }, include: { user: { select: { email: true, firstName: true, lastName: true } } } }),
    prisma.purchase.count(),
  ]);
  return { payments, total, page, limit, pages: Math.ceil(total / limit) };
};

// ── 5. Form activity ───────────────────────────────────────────────────

export const listFormActivityService = async (page: number, limit: number) => {
  const [rows, total] = await Promise.all([
    prisma.usageAnalytics.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" }, include: { user: { select: { email: true, firstName: true, lastName: true } } } }),
    prisma.usageAnalytics.count(),
  ]);
  return { rows, total, page, limit, pages: Math.ceil(total / limit) };
};

export const getDomainStatsService = () =>
  withCache(CacheKey.adminDomains(), TTL.ADMIN_STATS, async () => {
    const stats = await prisma.usageAnalytics.groupBy({
      by: ["platform"], _count: { id: true }, _avg: { timeSavedSec: true, fieldsFilled: true },
      _sum: { creditsUsed: true }, orderBy: { _count: { id: "desc" } }, take: 20,
    });
    return stats.map(s => ({
      platform: s.platform, totalFills: s._count.id,
      avgTimeSavedSec: Math.round(s._avg.timeSavedSec ?? 0),
      avgFieldsFilled: Math.round(s._avg.fieldsFilled ?? 0),
      totalCreditsUsed: s._sum.creditsUsed ?? 0,
    }));
  });

// ── 6. Logs ────────────────────────────────────────────────────────────

export const getLogsService = async (page: number, limit: number, level?: string, context?: string) => {
  const where = {
    ...(level ? { level: level as never } : {}),
    ...(context ? { context: { contains: context, mode: "insensitive" as const } } : {}),
  };
  const [logs, total] = await Promise.all([
    prisma.appLog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.appLog.count({ where }),
  ]);
  return { logs, total, page, limit, pages: Math.ceil(total / limit) };
};

export const getRequestLogsService = async (page: number, limit: number, statusCode?: number, path?: string) => {
  const where = {
    ...(statusCode ? { statusCode } : {}),
    ...(path ? { path: { contains: path, mode: "insensitive" as const } } : {}),
  };
  const [logs, total] = await Promise.all([
    prisma.requestLog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.requestLog.count({ where }),
  ]);
  return { logs, total, page, limit, pages: Math.ceil(total / limit) };
};

// ── 7. AI usage ────────────────────────────────────────────────────────

export const getAiUsageService = () =>
  withCache(CacheKey.adminAiUsage(), TTL.ADMIN_STATS, async () => {
    const [totalForms, aiEditStats, acceptanceStats] = await Promise.all([
      prisma.usageAnalytics.count(),
      prisma.usageAnalytics.aggregate({ _sum: { aiEdits: true, creditsUsed: true }, _avg: { aiEdits: true, timeSavedSec: true } }),
      prisma.usageAnalytics.groupBy({ by: ["acceptedDirect"], _count: { id: true } }),
    ]);
    const accepted = acceptanceStats.find(s => s.acceptedDirect)?._count.id ?? 0;
    const edited = acceptanceStats.find(s => !s.acceptedDirect)?._count.id ?? 0;
    return {
      totalForms,
      totalAiEdits: aiEditStats._sum.aiEdits ?? 0,
      totalCreditsUsed: aiEditStats._sum.creditsUsed ?? 0,
      avgAiEditsPerForm: Number((aiEditStats._avg.aiEdits ?? 0).toFixed(2)),
      avgTimeSavedSec: Math.round(aiEditStats._avg.timeSavedSec ?? 0),
      acceptedDirectly: accepted,
      editedByUser: edited,
      acceptanceRate: totalForms ? Math.round((accepted / totalForms) * 100) : 0,
    };
  });

// ── 8. Referrals ───────────────────────────────────────────────────────

export const getReferralStatsService = () =>
  withCache(CacheKey.adminReferrals(), TTL.ADMIN_STATS, async () => {
    const [total, topReferrers] = await Promise.all([
      prisma.referral.count(),
      prisma.referral.groupBy({ by: ["referrerId"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 10 }),
    ]);
    const users = await prisma.user.findMany({
      where: { id: { in: topReferrers.map(r => r.referrerId) } },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    return {
      totalReferrals: total,
      topReferrers: topReferrers.map(r => ({ user: userMap[r.referrerId], referralCount: r._count.id })),
    };
  });

// ── 9. Email broadcast ─────────────────────────────────────────────────

type EmailTarget =
  | { type: "single"; userId: string }
  | { type: "multiple"; userIds: string[] }
  | { type: "all" };

type BroadcastPayload = {
  subject: string;
  htmlContent: string;
  textContent?: string;
};

/**
 * Send emails to one user, a list of users, or all users.
 * The actual sending is fully async — the API returns immediately with a job summary,
 * and emails are dispatched in the background without blocking the response.
 */
export const sendBroadcastEmailService = async (
  target: EmailTarget,
  payload: BroadcastPayload
): Promise<{ queued: number; message: string }> => {
  // Resolve recipient list
  let recipients: { email: string; name: string }[] = [];

  if (target.type === "single") {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: target.userId },
      select: { email: true, firstName: true, lastName: true },
    });
    recipients = [{ email: user.email, name: `${user.firstName} ${user.lastName}` }];
  } else if (target.type === "multiple") {
    const users = await prisma.user.findMany({
      where: { id: { in: target.userIds } },
      select: { email: true, firstName: true, lastName: true },
    });
    recipients = users.map(u => ({ email: u.email, name: `${u.firstName} ${u.lastName}` }));
  } else {
    // all — fetch in batches to avoid loading millions of rows
    let cursor: string | undefined;
    do {
      const batch = await prisma.user.findMany({
        take: 500,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: "asc" },
        select: { id: true, email: true, firstName: true, lastName: true },
      });
      if (batch.length === 0) break;
      recipients.push(...batch.map(u => ({ email: u.email, name: `${u.firstName} ${u.lastName}` })));
      cursor = batch[batch.length - 1]?.id;
      if (batch.length < 500) break;
    } while (true);
  }

  const total = recipients.length;

  // Fire-and-forget: send in background, 5 at a time to respect rate limits
  void (async () => {
    const CONCURRENCY = 5;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += CONCURRENCY) {
      const batch = recipients.slice(i, i + CONCURRENCY);
      await Promise.allSettled(
        batch.map(r =>
          sendEmailWithBrevo({
            to: [{ email: r.email, name: r.name }],
            subject: payload.subject,
            htmlContent: payload.htmlContent,
            textContent: payload.textContent,
          }).then(() => { sent++; }).catch((err) => {
            failed++;
            logger.warn("broadcast-email", "Failed to send", { email: r.email, message: (err as Error).message });
          })
        )
      );
      // Small delay between batches to avoid hammering Brevo
      if (i + CONCURRENCY < recipients.length) {
        await new Promise(res => setTimeout(res, 200));
      }
    }

    logger.info("broadcast-email", "Broadcast complete", { total, sent, failed, subject: payload.subject });
  })();

  return { queued: total, message: `Email broadcast queued for ${total} recipient(s). Sending in background.` };
};
