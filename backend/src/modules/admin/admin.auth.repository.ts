import prisma from "../../config/database";
import { AdminRole } from "../../generated/prisma";
import { hashToken } from "../../utils/jwt";

const OTP_EXPIRY_MINUTES = 10;

export const findAdminByEmail = (email: string) =>
  prisma.admin.findUnique({ where: { email: email.toLowerCase() } });

export const findAdminById = (id: string) =>
  prisma.admin.findUnique({ where: { id } });

export const createAdmin = (data: {
  email: string;
  name: string;
  role: AdminRole;
  createdById?: string;
}) =>
  prisma.admin.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      role: data.role,
      createdById: data.createdById ?? null,
    },
  });

export const listAdmins = () =>
  prisma.admin.findMany({ orderBy: { createdAt: "desc" } });

export const updateAdmin = (id: string, data: Partial<{ name: string; role: AdminRole; isActive: boolean }>) =>
  prisma.admin.update({ where: { id }, data });

export const deleteAdmin = (id: string) =>
  prisma.admin.delete({ where: { id } });

// ── OTP ────────────────────────────────────────────────────────────────

export const createAdminOtp = (adminId: string, otp: string) =>
  prisma.adminOtp.create({
    data: {
      adminId,
      otp,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  });

export const invalidateAdminOtps = (adminId: string) =>
  prisma.adminOtp.updateMany({
    where: { adminId, usedAt: null },
    data: { usedAt: new Date() },
  });

export const findValidAdminOtp = (adminId: string, otp: string) =>
  prisma.adminOtp.findFirst({
    where: {
      adminId,
      otp,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

export const markAdminOtpUsed = (otpId: string) =>
  prisma.adminOtp.update({ where: { id: otpId }, data: { usedAt: new Date() } });

// ── Sessions ───────────────────────────────────────────────────────────

export const createAdminSession = (adminId: string, token: string) =>
  prisma.adminSession.create({
    data: {
      adminId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

export const findAdminSession = (token: string) =>
  prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: true },
  });

export const revokeAdminSession = (token: string) =>
  prisma.adminSession.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
