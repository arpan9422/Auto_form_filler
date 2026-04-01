import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  completeUserOnboardingService,
  getUserProfileService,
  updateUserProfileService,
} from "./user.service";

export const getProfile = async (req: AuthRequest, res: Response) => {
  const profile = await getUserProfileService(req.userId!);
  res.status(200).json(profile);
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const profile = await updateUserProfileService(req.userId!, req.body);
  res.status(200).json(profile);
};

export const completeOnboarding = async (req: AuthRequest, res: Response) => {
  const profile = await completeUserOnboardingService(req.userId!, req.body);
  res.status(200).json({
    message: "Onboarding saved. Embedding sync has been queued.",
    profile,
  });
};
