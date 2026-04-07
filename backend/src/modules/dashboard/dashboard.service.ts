import prisma from "../../config/database";
import { AppError } from "../../utils/AppError";
import { withCache, CacheKey, TTL } from "../../utils/cache";

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfWeek = (date: Date) => {
  const s = startOfDay(date);
  s.setDate(s.getDate() - s.getDay());
  return s;
};

const fmt = (date: Date) =>
  date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export const getDashboardOverviewService = (userId: string) =>
  withCache(CacheKey.userDashboardOverview(userId), TTL.USER_DASHBOARD, async () => {
    const [user, usageItems] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { credits: true, weeklyFreeCredits: true } }),
      prisma.usageAnalytics.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
    ]);
    if (!user) throw new AppError("User not found", 404);

    const weekStart = startOfWeek(new Date());
    const weekItems = usageItems.filter((i) => i.createdAt >= weekStart);
    const freeLeft = Math.max(user.weeklyFreeCredits - weekItems.length, 0);

    return {
      wallet: {
        credits: user.credits,
        weeklyFreeCredits: user.weeklyFreeCredits,
        freeLeftThisWeek: freeLeft,
        paidCredits: Math.max(user.credits - freeLeft, 0),
      },
      stats: {
        creditsUsedThisWeek: weekItems.reduce((t, i) => t + i.creditsUsed, 0),
        freeLeftThisWeek: freeLeft,
        timeSavedMinutesThisWeek: Math.round(weekItems.reduce((t, i) => t + i.timeSavedSec, 0) / 60),
        paidCredits: user.credits,
      },
      recentSites: usageItems.slice(0, 3).map((i) => ({ name: i.platform, timeLabel: fmt(i.createdAt) })),
      aiEdits: {
        thisWeek: weekItems.reduce((t, i) => t + i.aiEdits, 0),
        quotaPercent: Math.min(100, Math.round((weekItems.reduce((t, i) => t + i.aiEdits, 0) / 20) * 100)),
      },
    };
  });

export const getDashboardAnalyticsService = (userId: string) =>
  withCache(CacheKey.userDashboardAnalytics(userId), TTL.USER_DASHBOARD, async () => {
    const usageItems = await prisma.usageAnalytics.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });

    const formsFilled = usageItems.length;
    const acceptedWithoutEdits = formsFilled
      ? Math.round((usageItems.filter((i) => i.acceptedDirect).length / formsFilled) * 100)
      : 0;
    const timeSavedSec = usageItems.reduce((t, i) => t + i.timeSavedSec, 0);

    const platformCounts = usageItems.reduce<Record<string, number>>((acc, i) => {
      acc[i.platform] = (acc[i.platform] ?? 0) + 1;
      return acc;
    }, {});
    const sorted = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);
    const topPlatform = sorted[0]?.[0] ?? "No activity yet";
    const total = sorted.reduce((t, [, c]) => t + c, 0) || 1;

    const last7Days = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      const dayStart = startOfDay(d);
      const nextDay = new Date(dayStart);
      nextDay.setDate(nextDay.getDate() + 1);
      return {
        day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        forms: usageItems.filter((i) => i.createdAt >= dayStart && i.createdAt < nextDay).length,
      };
    });

    return {
      stats: { formsFilled, acceptedWithoutEdits, timeSavedSec, mostUsedSite: topPlatform },
      topSites: sorted.slice(0, 5).map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) })),
      weekData: last7Days,
      insights: [
        formsFilled ? `You've filled ${formsFilled} forms with Autofill so far.` : "Start using Autofill to unlock analytics insights here.",
        acceptedWithoutEdits ? `${acceptedWithoutEdits}% of your generated answers were accepted without edits.` : "No accepted-answer data yet.",
        sorted.length ? `${topPlatform} is your most active platform right now.` : "Your most-used websites will appear here once activity is recorded.",
      ],
    };
  });
