import crypto from "crypto";
import { AdminRole } from "../../generated/prisma";
import { AppError } from "../../utils/AppError";
import { generateOtp } from "../../utils/auth";
import { sendEmailWithBrevo } from "../../utils/brevo";
import { logger } from "../../utils/logger";
import {
  findAdminByEmail,
  findAdminById,
  createAdmin,
  listAdmins,
  updateAdmin,
  deleteAdmin,
  createAdminOtp,
  invalidateAdminOtps,
  findValidAdminOtp,
  markAdminOtpUsed,
  createAdminSession,
  findAdminSession,
  revokeAdminSession,
} from "./admin.auth.repository";

// ── OTP login ──────────────────────────────────────────────────────────

export const sendAdminOtpService = async (email: string) => {
  const admin = await findAdminByEmail(email);
  if (!admin) throw new AppError("No admin account found with this email", 404);
  if (!admin.isActive) throw new AppError("This admin account is suspended", 403);

  const otp = generateOtp();
  await invalidateAdminOtps(admin.id);
  await createAdminOtp(admin.id, otp);

  await sendEmailWithBrevo({
    to: [{ email: admin.email, name: admin.name }],
    subject: "Form Pilot Admin — Your OTP",
    textContent: `Your admin OTP is ${otp}. It expires in 10 minutes.`,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6">
        <h2>Admin Login OTP</h2>
        <p>Hi ${admin.name},</p>
        <p>Your one-time password is:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:18px 0;color:#f59e0b">${otp}</div>
        <p>Expires in 10 minutes. Do not share this with anyone.</p>
      </div>
    `,
  });

  logger.info("admin-auth", "OTP sent", { email: admin.email, role: admin.role });
  return { message: "OTP sent to admin email", expiresInMinutes: 10 };
};

export const verifyAdminOtpService = async (email: string, otp: string) => {
  const admin = await findAdminByEmail(email);
  if (!admin) throw new AppError("No admin account found", 404);
  if (!admin.isActive) throw new AppError("This admin account is suspended", 403);

  const otpRecord = await findValidAdminOtp(admin.id, otp);
  if (!otpRecord) throw new AppError("Invalid or expired OTP", 400);

  await markAdminOtpUsed(otpRecord.id);

  // Generate a secure random session token
  const sessionToken = crypto.randomBytes(48).toString("hex");
  await createAdminSession(admin.id, sessionToken);

  logger.info("admin-auth", "Admin logged in", { email: admin.email, role: admin.role });

  return {
    token: sessionToken,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  };
};

export const logoutAdminService = async (token: string) => {
  await revokeAdminSession(token);
  return { message: "Logged out successfully" };
};

// ── Admin management (SUPER_ADMIN only) ───────────────────────────────

export const addAdminService = async (
  actorId: string,
  data: { email: string; name: string; role: AdminRole }
) => {
  const actor = await findAdminById(actorId);
  if (!actor || actor.role !== "SUPER_ADMIN") {
    throw new AppError("Only Super Admins can add new admins", 403);
  }

  const existing = await findAdminByEmail(data.email);
  if (existing) throw new AppError("An admin with this email already exists", 409);

  const newAdmin = await createAdmin({ ...data, createdById: actorId });
  logger.info("admin-auth", "New admin created", { email: newAdmin.email, role: newAdmin.role, by: actor.email });
  return newAdmin;
};

export const listAdminsService = async (actorId: string) => {
  const actor = await findAdminById(actorId);
  if (!actor || actor.role !== "SUPER_ADMIN") {
    throw new AppError("Only Super Admins can list admins", 403);
  }
  return listAdmins();
};

export const updateAdminService = async (
  actorId: string,
  targetId: string,
  data: Partial<{ name: string; role: AdminRole; isActive: boolean }>
) => {
  const actor = await findAdminById(actorId);
  if (!actor || actor.role !== "SUPER_ADMIN") {
    throw new AppError("Only Super Admins can update admins", 403);
  }
  if (actorId === targetId && data.isActive === false) {
    throw new AppError("You cannot deactivate your own account", 400);
  }
  return updateAdmin(targetId, data);
};

export const deleteAdminService = async (actorId: string, targetId: string) => {
  const actor = await findAdminById(actorId);
  if (!actor || actor.role !== "SUPER_ADMIN") {
    throw new AppError("Only Super Admins can delete admins", 403);
  }
  if (actorId === targetId) throw new AppError("You cannot delete your own account", 400);
  await deleteAdmin(targetId);
  return { message: "Admin deleted" };
};

// ── Session validation (used by middleware) ────────────────────────────

export const validateAdminSession = async (token: string) => {
  const session = await findAdminSession(token);
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new AppError("Invalid or expired admin session", 401);
  }
  if (!session.admin.isActive) {
    throw new AppError("This admin account is suspended", 403);
  }
  return session.admin;
};
