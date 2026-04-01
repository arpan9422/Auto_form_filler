import {
  TransactionReason,
  TransactionType,
  UsageAnalytics,
} from "../../generated/prisma";
import { AppError } from "../../utils/AppError";
import {
  createCreditTransactionEntry,
  createPurchaseRecord,
  creditUserWallet,
  findWalletUserById,
  getPurchasesByUserId,
  getUsageAnalytics,
  getWalletTransactions,
  runWalletTransaction,
} from "./wallet.repository";

const sumCreditsByReason = (
  reasons: TransactionReason[],
  items: { reason: TransactionReason; amount: number }[]
) =>
  items
    .filter((item) => reasons.includes(item.reason))
    .reduce((total: number, item) => total + item.amount, 0);

export const getWalletSummaryService = async (userId: string) => {
  const user = await findWalletUserById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  return {
    credits: user.credits,
    weeklyFreeCredits: user.weeklyFreeCredits,
    lastCreditResetAt: user.lastCreditResetAt,
  };
};

export const getWalletAnalyticsService = async (userId: string) => {
  const items = await getUsageAnalytics(userId);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - todayStart.getDay());

  const today = items
    .filter((item: UsageAnalytics) => item.createdAt >= todayStart)
    .reduce((total: number, item: UsageAnalytics) => total + item.creditsUsed, 0);

  const thisWeek = items
    .filter((item: UsageAnalytics) => item.createdAt >= weekStart)
    .reduce((total: number, item: UsageAnalytics) => total + item.creditsUsed, 0);

  const lifetime = items.reduce(
    (total: number, item: UsageAnalytics) => total + item.creditsUsed,
    0
  );

  const firstUsage = items.at(-1)?.createdAt;
  const daysTracked = firstUsage
    ? Math.max(1, Math.ceil((now.getTime() - firstUsage.getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  return {
    today,
    thisWeek,
    lifetime,
    avgPerDay: Number((lifetime / daysTracked).toFixed(2)),
  };
};

export const getWalletBreakdownService = async (userId: string) => {
  const transactions = await getWalletTransactions(userId);

  return {
    formFill: sumCreditsByReason([TransactionReason.FORM_FILL], transactions),
    chatRefine: sumCreditsByReason([TransactionReason.CHAT_REFINE], transactions),
    regenerate: sumCreditsByReason([TransactionReason.REGENERATE], transactions),
    resumeParse: sumCreditsByReason([TransactionReason.RESUME_PARSE], transactions),
  };
};

export const getWalletTransactionHistoryService = async (userId: string) => {
  const [transactions, purchases] = await Promise.all([
    getWalletTransactions(userId),
    getPurchasesByUserId(userId),
  ]);

  return {
    transactions,
    purchases,
  };
};

export const topupWalletService = async (
  userId: string,
  payload: {
    creditsBought: number;
    amountPaid: number;
    currency: string;
    paymentProvider?: string;
    paymentRef?: string;
  }
) => {
  const user = await findWalletUserById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  return runWalletTransaction(async tx => {
    await creditUserWallet(userId, payload.creditsBought, tx);

    const purchase = await createPurchaseRecord(
      {
        userId,
        creditsBought: payload.creditsBought,
        amountPaid: payload.amountPaid,
        currency: payload.currency,
        paymentProvider: payload.paymentProvider,
        paymentRef: payload.paymentRef,
      },
      tx
    );

    await createCreditTransactionEntry(
      {
        userId,
        type: TransactionType.CREDIT,
        amount: payload.creditsBought,
        reason: TransactionReason.TOPUP,
        metadata: {
          amountPaid: payload.amountPaid,
          currency: payload.currency,
          paymentProvider: payload.paymentProvider,
          paymentRef: payload.paymentRef,
        },
      },
      tx
    );

    return {
      message: "Wallet topped up successfully",
      purchase,
    };
  });
};
