import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { getDashboardAnalytics, getDashboardOverview, recordDashboardAnalytics } from "./dashboard.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { recordAnalyticsSchema } from "./dashboard.schema";

const router = Router();

router.get("/overview", authenticate, asyncHandler(getDashboardOverview));
router.get("/analytics", authenticate, asyncHandler(getDashboardAnalytics));
router.post("/analytics", authenticate, validateRequest(recordAnalyticsSchema), asyncHandler(recordDashboardAnalytics));

export default router;
