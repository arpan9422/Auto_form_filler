import { Prisma } from "../../generated/prisma";
import prisma from "../../config/database";

export const getResumesByUserId = async (userId: string) =>
  prisma.resume.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

export const findResumeById = async (id: string) =>
  prisma.resume.findUnique({
    where: { id },
  });

export const createResumeDb = async (
  data: {
    userId: string;
    label: string;
    target?: string;
    description?: string;
    pdfUrl: string;
    isDefault?: boolean;
  },
  tx?: Prisma.TransactionClient
) =>
  ((tx ?? prisma) as typeof prisma).resume.create({
    data,
  });

export const updateResumeDb = async (
  id: string,
  data: {
    label: string;
    target?: string;
    description?: string;
    pdfUrl: string;
    isDefault?: boolean;
  },
  tx?: Prisma.TransactionClient
) =>
  ((tx ?? prisma) as typeof prisma).resume.update({
    where: { id },
    data,
  });

export const deleteResumeDb = async (id: string, tx?: Prisma.TransactionClient) =>
  ((tx ?? prisma) as typeof prisma).resume.delete({
    where: { id },
  });

export const clearDefaultResumeFlag = async (
  userId: string,
  tx?: Prisma.TransactionClient
) =>
  ((tx ?? prisma) as typeof prisma).resume.updateMany({
    where: { userId },
    data: { isDefault: false },
  });

export const runResumeTransaction = async <T>(
  handler: (tx: Prisma.TransactionClient) => Promise<T>
) => prisma.$transaction(handler);
