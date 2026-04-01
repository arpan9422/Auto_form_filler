import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  getMyReferralStatsService,
  validateReferralCodeService,
} from "./refferal.service";

export const validateReferralCode = async (req: Request, res: Response) => {
  const result = await validateReferralCodeService(req.body.referralCode);
  res.status(200).json(result);
};

export const getMyReferralStats = async (req: AuthRequest, res: Response) => {
  const result = await getMyReferralStatsService(req.userId!);
  res.status(200).json(result);
};
