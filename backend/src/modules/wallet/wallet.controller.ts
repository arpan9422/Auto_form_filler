import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  getWalletAnalyticsService,
  getWalletBreakdownService,
  getWalletSummaryService,
  getWalletTransactionHistoryService,
  topupWalletService,
} from "./wallet.service";

export const getWalletSummary = async (req: AuthRequest, res: Response) => {
  const result = await getWalletSummaryService(req.userId!);
  res.status(200).json(result);
};

export const getWalletAnalytics = async (req: AuthRequest, res: Response) => {
  const result = await getWalletAnalyticsService(req.userId!);
  res.status(200).json(result);
};

export const getWalletBreakdown = async (req: AuthRequest, res: Response) => {
  const result = await getWalletBreakdownService(req.userId!);
  res.status(200).json(result);
};

export const getWalletTransactionHistory = async (
  req: AuthRequest,
  res: Response
) => {
  const result = await getWalletTransactionHistoryService(req.userId!);
  res.status(200).json(result);
};

export const topupWallet = async (req: AuthRequest, res: Response) => {
  const result = await topupWalletService(req.userId!, req.body);
  res.status(200).json(result);
};
