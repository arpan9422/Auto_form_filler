import { Router } from "express";
import {
  login,
  logout,
  refreshToken,
  sendLoginOtp,
  sendSignupOtp,
  signup,
} from "./auth.controller";
import { asyncHandler } from "../../middleware/asyncHandler";
import { validateRequest } from "../../middleware/validateRequest";
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  sendLoginOtpSchema,
  sendSignupOtpSchema,
  signupSchema,
} from "../../utils/validators";

const router = Router();

router.post("/signup/otp", validateRequest(sendSignupOtpSchema), asyncHandler(sendSignupOtp));
router.post("/signup", validateRequest(signupSchema), asyncHandler(signup));
router.post("/login/otp", validateRequest(sendLoginOtpSchema), asyncHandler(sendLoginOtp));
router.post("/login", validateRequest(loginSchema), asyncHandler(login));
router.post("/refresh", validateRequest(refreshTokenSchema), asyncHandler(refreshToken));
router.post("/logout", validateRequest(logoutSchema), asyncHandler(logout));

export default router;
