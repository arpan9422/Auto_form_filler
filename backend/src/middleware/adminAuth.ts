import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { validateAdminSession } from "../modules/admin/admin.auth.service";
import { Admin } from "../generated/prisma";

export interface AdminRequest extends Request {
  admin?: Admin;
}

export const authenticateAdmin = async (req: AdminRequest, _res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      next(new AppError("Admin authentication required", 401));
      return;
    }
    const admin = await validateAdminSession(token);
    req.admin = admin;
    next();
  } catch (err) {
    next(err);
  }
};
