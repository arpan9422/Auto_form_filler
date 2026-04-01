import prisma from "../../config/database";
import { AppError } from "../../utils/AppError";

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfWeek = (date: Date) => {
  const dayStart = startOfDay(date);
  const weekStart = new Date(dayStart);
  weekStart.setDate(dayStart.getDate() - dayStart.getDay());
  return weekStart;
};

const formatShortDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const getDashboardOverviewService = async (userId: string) => {
  const [user, usageItems] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        weeklyFreeCredits: true,
      },
    }),
    prisma.usageAnalytics.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekItems = usageItems.filter((item) => item.createdAt >= weekStart);

  return {
    wallet: {
      credits: user.credits,
      weeklyFreeCredits: user.weeklyFreeCredits,
      freeLeftThisWeek: Math.max(user.weeklyFreeCredits - weekItems.length, 0),
      paidCredits: Math.max(user.credits - Math.max(user.weeklyFreeCredits - weekItems.length, 0), 0),
    },
    stats: {
      creditsUsedThisWeek: weekItems.reduce((total, item) => total + item.creditsUsed, 0),
      freeLeftThisWeek: Math.max(user.weeklyFreeCredits - weekItems.length, 0),
      timeSavedMinutesThisWeek: Math.round(
        weekItems.reduce((total, item) => total + item.timeSavedSec, 0) / 60
      ),
      paidCredits: user.credits,
    },
    recentSites: usageItems.slice(0, 3).map((item) => ({
      name: item.platform,
      timeLabel: formatShortDate(item.createdAt),
    })),
    aiEdits: {
      thisWeek: weekItems.reduce((total, item) => total + item.aiEdits, 0),
      quotaPercent: Math.min(
        100,
        Math.round((weekItems.reduce((total, item) => total + item.aiEdits, 0) / 20) * 100)
      ),
    },
  };
};

export const getDashboardAnalyticsService = async (userId: string) => {
  const usageItems = await prisma.usageAnalytics.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const formsFilled = usageItems.length;
  const acceptedWithoutEdits = usageItems.length
    ? Math.round(
        (usageItems.filter((item) => item.acceptedDirect).length / usageItems.length) * 100
      )
    : 0;
  const timeSavedSec = usageItems.reduce((total, item) => total + item.timeSavedSec, 0);

  const platformCounts = usageItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.platform] = (acc[item.platform] ?? 0) + 1;
    return acc;
  }, {});

  const sortedPlatforms = Object.entries(platformCounts).sort((left, right) => right[1] - left[1]);
  const topPlatform = sortedPlatforms[0]?.[0] ?? "No activity yet";

  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dayStart = startOfDay(date);
    const nextDay = new Date(dayStart);
    nextDay.setDate(nextDay.getDate() + 1);

    return {
      day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
      forms: usageItems.filter(
        (item) => item.createdAt >= dayStart && item.createdAt < nextDay
      ).length,
    };
  });

  const totalPlatformUsage = sortedPlatforms.reduce((total, [, count]) => total + count, 0) || 1;

  return {
    stats: {
      formsFilled,
      acceptedWithoutEdits,
      timeSavedSec,
      mostUsedSite: topPlatform,
    },
    topSites: sortedPlatforms.slice(0, 5).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / totalPlatformUsage) * 100),
    })),
    weekData: last7Days,
    insights: [
      formsFilled
        ? `You've filled ${formsFilled} forms with Autofill so far.`
        : "Start using Autofill to unlock analytics insights here.",
      acceptedWithoutEdits
        ? `${acceptedWithoutEdits}% of your generated answers were accepted without edits.`
        : "No accepted-answer data yet.",
      sortedPlatforms.length
        ? `${topPlatform} is your most active platform right now.`
        : "Your most-used websites will appear here once activity is recorded.",
    ],
  };
};
