import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { validateRequest } from "../../middleware/validateRequest";
import {
  getWalletAnalytics,
  getWalletBreakdown,
  getWalletSummary,
  getWalletTransactionHistory,
  topupWallet,
} from "./wallet.controller";
import { topupWalletSchema } from "../../utils/validators";

const router = Router();

router.get("/summary", authenticate, asyncHandler(getWalletSummary));
router.get("/analytics", authenticate, asyncHandler(getWalletAnalytics));
router.get("/breakdown", authenticate, asyncHandler(getWalletBreakdown));
router.get("/transactions", authenticate, asyncHandler(getWalletTransactionHistory));
router.post("/topup", authenticate, validateRequest(topupWalletSchema), asyncHandler(topupWallet));

export default router;
