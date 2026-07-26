import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { getDashboardAnalyticsService, getDashboardOverviewService, recordDashboardAnalyticsService } from "./dashboard.service";

export const getDashboardOverview = async (req: AuthRequest, res: Response) => {
  const data = await getDashboardOverviewService(req.userId!);
  res.status(200).json(data);
};

export const getDashboardAnalytics = async (req: AuthRequest, res: Response) => {
  const data = await getDashboardAnalyticsService(req.userId!);
  res.status(200).json(data);
};

export const recordDashboardAnalytics = async (req: AuthRequest, res: Response) => {
  const data = await recordDashboardAnalyticsService(req.userId!, req.body);
  res.status(201).json(data);
};
