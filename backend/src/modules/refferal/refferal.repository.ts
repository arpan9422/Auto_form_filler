import { Prisma } from "../../generated/prisma";
import prisma from "../../config/database";

export const findReferralByReferredEmail = async (referredEmail: string) =>
  prisma.referral.findUnique({
    where: { referredEmail: referredEmail.toLowerCase() },
  });

export const createReferralRecord = async (
  data: {
    referrerId: string;
    referredUserId: string;
    referredEmail: string;
    referralCode: string;
    referredByCode: string;
    rewardCredits: number;
    rewardCreditsToReferrer: number;
    rewardCreditsToReferred: number;
  },
  tx?: Prisma.TransactionClient
) =>
  ((tx ?? prisma) as typeof prisma).referral.create({
    data: {
      ...data,
      referredEmail: data.referredEmail.toLowerCase(),
    },
  });

export const getReferralStatsByUserId = async (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralCode: true,
      referralsMade: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

export const findReferralCodeOwner = async (referralCode: string) =>
  prisma.user.findUnique({
    where: {
      referralCode: referralCode.toUpperCase(),
    },
    select: {
      id: true,
      email: true,
      referralCode: true,
      firstName: true,
      lastName: true,
    },
  });
