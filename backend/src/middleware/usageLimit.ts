import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import prisma from "../config/database";
import { FREE_TIER_LIMIT } from "../utils/constants";

export const checkUsageLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Free usage is tracked with the weekly free credits bucket.
    if (user.weeklyFreeCredits <= 0) {
      return res.status(429).json({
        error: "Weekly free credit limit reached",
        message: `You've used all ${FREE_TIER_LIMIT} free weekly credits.`,
        limit: FREE_TIER_LIMIT,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
