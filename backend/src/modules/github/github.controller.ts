import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  getGitHubAuthUrlService,
  handleGitHubCallbackService,
  getGitHubStatusService,
  disconnectGitHubService,
} from "./github.service";

export const getAuthUrl = async (req: AuthRequest, res: Response) => {
  const result = getGitHubAuthUrlService(req.userId!);
  res.json(result);
};

export const handleCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query as { code: string; state: string };
  try {
    const redirectUrl = await handleGitHubCallbackService(code, state);
    res.redirect(redirectUrl);
  } catch (err: unknown) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/dashboard?tab=profile&github=error`);
  }
};

export const getStatus = async (req: AuthRequest, res: Response) => {
  res.json(await getGitHubStatusService(req.userId!));
};

export const disconnect = async (req: AuthRequest, res: Response) => {
  res.json(await disconnectGitHubService(req.userId!));
};
