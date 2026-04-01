import { OtpPurpose, Prisma } from "../../generated/prisma";
import prisma from "../../config/database";

export const findUserByEmail = async (email: string) =>
  prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

export const findUserByReferralCode = async (referralCode: string) =>
  prisma.user.findUnique({
    where: { referralCode: referralCode.toUpperCase() },
  });

export const createOtpCode = async (data: {
  email: string;
  otp: string;
  purpose: OtpPurpose;
  expiresAt: Date;
}) =>
  prisma.userOtp.create({
    data: {
      email: data.email.toLowerCase(),
      otp: data.otp,
      purpose: data.purpose,
      expiresAt: data.expiresAt,
    },
  });

export const invalidateOtpCodes = async (email: string, purpose: OtpPurpose) =>
  prisma.userOtp.updateMany({
    where: {
      email: email.toLowerCase(),
      purpose,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

export const findValidOtp = async (email: string, otp: string, purpose: OtpPurpose) =>
  prisma.userOtp.findFirst({
    where: {
      email: email.toLowerCase(),
      otp,
      purpose,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

export const markOtpAsUsed = async (otpId: string, tx?: Prisma.TransactionClient) =>
  ((tx ?? prisma) as typeof prisma).userOtp.update({
    where: { id: otpId },
    data: { usedAt: new Date() },
  });

export const createUser = async (
  data: {
    email: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    referralCode: string;
  },
  tx?: Prisma.TransactionClient
) =>
  ((tx ?? prisma) as typeof prisma).user.create({
    data: {
      email: data.email.toLowerCase(),
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      referralCode: data.referralCode.toUpperCase(),
    },
  });

export const storeRefreshToken = async (
  data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  },
  tx?: Prisma.TransactionClient
) =>
  ((tx ?? prisma) as typeof prisma).refreshToken.create({
    data,
  });

export const findRefreshToken = async (tokenHash: string) =>
  prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: true,
    },
  });

export const revokeRefreshToken = async (tokenHash: string) =>
  prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

export const revokeAllUserRefreshTokens = async (userId: string) =>
  prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

export const runInTransaction = async <T>(
  handler: (tx: Prisma.TransactionClient) => Promise<T>
) => prisma.$transaction(handler);
