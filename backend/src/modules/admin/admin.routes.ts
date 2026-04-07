import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authenticateAdmin } from "../../middleware/adminAuth";import {
  getDashboard,
  listUsers,
  searchUsers,
  getUserDetail,
  adjustCredits,
  deleteUser,
  getCreditStats,
  listPayments,
  listFormActivity,
  getDomainStats,
  getAppLogs,
  getRequestLogs,
  getAiUsage,
  getReferralStats,
  sendBroadcastEmail,
} from "./admin.controller";

const router = Router();

// All admin routes require the admin secret
router.use(authenticateAdmin);

// ── Dashboard ──────────────────────────────────────────────────────────
router.get("/dashboard", asyncHandler(getDashboard));

// ── Users ──────────────────────────────────────────────────────────────
router.get("/users", asyncHandler(listUsers));
router.get("/users/search", asyncHandler(searchUsers));
router.get("/users/:userId", asyncHandler(getUserDetail));
router.patch("/users/:userId/credits", asyncHandler(adjustCredits));
router.delete("/users/:userId", asyncHandler(deleteUser));

// ── Credits ────────────────────────────────────────────────────────────
router.get("/credits", asyncHandler(getCreditStats));

// ── Payments ───────────────────────────────────────────────────────────
router.get("/payments", asyncHandler(listPayments));

// ── Form activity ──────────────────────────────────────────────────────
router.get("/forms", asyncHandler(listFormActivity));
router.get("/domains", asyncHandler(getDomainStats));

// ── Logs ───────────────────────────────────────────────────────────────
router.get("/logs/app", asyncHandler(getAppLogs));
router.get("/logs/requests", asyncHandler(getRequestLogs));

// ── AI usage ───────────────────────────────────────────────────────────
router.get("/ai-usage", asyncHandler(getAiUsage));

// ── Referrals ──────────────────────────────────────────────────────────
router.get("/referrals", asyncHandler(getReferralStats));

// ── Email broadcast ────────────────────────────────────────────────────
router.post("/email/broadcast", asyncHandler(sendBroadcastEmail));

export default router;
