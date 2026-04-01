import {
  Prisma,
  PurchaseStatus,
  TransactionReason,
  TransactionType,
} from "../../generated/prisma";
import prisma from "../../config/database";

export const findWalletUserById = async (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
  });

export const creditUserWallet = async (
  userId: string,
  amount: number,
  tx?: Prisma.TransactionClient
) =>
  ((tx ?? prisma) as typeof prisma).user.update({
    where: { id: userId },
    data: {
      credits: {
        increment: amount,
      },
    },
  });

export const debitUserWallet = async (
  userId: string,
  amount: number,
  tx?: Prisma.TransactionClient
) =>
  ((tx ?? prisma) as typeof prisma).user.update({
    where: { id: userId },
    data: {
      credits: {
        decrement: amount,
      },
    },
  });

export const createCreditTransactionEntry = async (
  data: {
    userId: string;
    type: TransactionType;
    amount: number;
    reason: TransactionReason;
    metadata?: Prisma.InputJsonValue;
  },
  tx?: Prisma.TransactionClient
) =>
  ((tx ?? prisma) as typeof prisma).creditTransaction.create({
    data,
  });

export const getWalletTransactions = async (userId: string) =>
  prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

export const getUsageAnalytics = async (userId: string) =>
  prisma.usageAnalytics.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

export const createPurchaseRecord = async (
  data: {
    userId: string;
    creditsBought: number;
    amountPaid: number;
    currency: string;
    paymentProvider?: string;
    paymentRef?: string;
  },
  tx?: Prisma.TransactionClient
) =>
  ((tx ?? prisma) as typeof prisma).purchase.create({
    data: {
      ...data,
      status: PurchaseStatus.SUCCESS,
    },
  });

export const getPurchasesByUserId = async (userId: string) =>
  prisma.purchase.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

export const runWalletTransaction = async <T>(
  handler: (tx: Prisma.TransactionClient) => Promise<T>
) => prisma.$transaction(handler);
