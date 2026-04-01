import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { getDashboardAnalytics, getDashboardOverview } from "./dashboard.controller";

const router = Router();

router.get("/overview", authenticate, asyncHandler(getDashboardOverview));
router.get("/analytics", authenticate, asyncHandler(getDashboardAnalytics));

export default router;
