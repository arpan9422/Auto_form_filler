import { Request, Response } from "express";
import { AdminRequest } from "../../middleware/adminAuth";
import { AdminRole } from "../../generated/prisma";
import {
  sendAdminOtpService,
  verifyAdminOtpService,
  logoutAdminService,
  addAdminService,
  listAdminsService,
  updateAdminService,
  deleteAdminService,
} from "./admin.auth.service";

export const sendOtp = async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  res.json(await sendAdminOtpService(email));
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body as { email: string; otp: string };
  res.json(await verifyAdminOtpService(email, otp));
};

export const logout = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1] ?? "";
  res.json(await logoutAdminService(token));
};

export const addAdmin = async (req: AdminRequest, res: Response) => {
  const { email, name, role } = req.body as { email: string; name: string; role: AdminRole };
  res.status(201).json(await addAdminService(req.admin!.id, { email, name, role }));
};

export const listAdmins = async (req: AdminRequest, res: Response) => {
  res.json(await listAdminsService(req.admin!.id));
};

export const updateAdmin = async (req: AdminRequest, res: Response) => {
  const { name, role, isActive } = req.body as { name?: string; role?: AdminRole; isActive?: boolean };
  res.json(await updateAdminService(req.admin!.id, req.params.adminId, { name, role, isActive }));
};

export const deleteAdmin = async (req: AdminRequest, res: Response) => {
  res.json(await deleteAdminService(req.admin!.id, req.params.adminId));
};

export const getMe = async (req: AdminRequest, res: Response) => {
  res.json(req.admin);
};
