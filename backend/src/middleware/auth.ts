// JWT Authentication Middleware
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      next(new AppError("Authentication required", 401));
      return;
    }

    const decoded = verifyAccessToken(token);
    if (decoded.type !== "access") {
      next(new AppError("Invalid access token", 401));
      return;
    }

    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    next(new AppError("Invalid token", 401));
  }
};
