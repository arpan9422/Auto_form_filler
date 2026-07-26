import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { AppError } from "../utils/AppError";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    let user = await prisma.user.findFirst();

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "local@user.local",
          firstName: "Local",
          lastName: "User",
          referralCode: "LOCAL_USER"
        }
      });
    }

    req.userId = user.id;
    req.userEmail = user.email;
    next();
  } catch (error) {
    next(new AppError("Failed to initialize local user session", 500));
  }
};
