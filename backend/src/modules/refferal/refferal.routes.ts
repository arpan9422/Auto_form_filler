import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { validateRequest } from "../../middleware/validateRequest";
import {
  getMyReferralStats,
  validateReferralCode,
} from "./refferal.controller";
import { referralCodeValidationSchema } from "../../utils/validators";

const router = Router();

router.post("/validate", validateRequest(referralCodeValidationSchema), asyncHandler(validateReferralCode));
router.get("/me", authenticate, asyncHandler(getMyReferralStats));

export default router;
