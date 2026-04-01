import { Router } from "express";
import { completeOnboarding, getProfile, updateProfile } from "./user.controller";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { validateRequest } from "../../middleware/validateRequest";
import { updateProfileSchema } from "../../utils/validators";

const router = Router();

router.get("/", authenticate, asyncHandler(getProfile));
router.put("/", authenticate, validateRequest(updateProfileSchema), asyncHandler(updateProfile));
router.put("/onboarding", authenticate, validateRequest(updateProfileSchema), asyncHandler(completeOnboarding));

export default router;
