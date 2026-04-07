import { Router } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { authenticateAdmin } from "../../middleware/adminAuth";
import {
  sendOtp,
  verifyOtp,
  logout,
  addAdmin,
  listAdmins,
  updateAdmin,
  deleteAdmin,
  getMe,
} from "./admin.auth.controller";

const router = Router();

// ── Public (no auth) ───────────────────────────────────────────────────
router.post("/otp", asyncHandler(sendOtp));
router.post("/login", asyncHandler(verifyOtp));

// ── Protected ──────────────────────────────────────────────────────────
router.use(authenticateAdmin);

router.post("/logout", asyncHandler(logout));
router.get("/me", asyncHandler(getMe));

// Admin management — SUPER_ADMIN only (enforced in service layer)
router.get("/admins", asyncHandler(listAdmins));
router.post("/admins", asyncHandler(addAdmin));
router.patch("/admins/:adminId", asyncHandler(updateAdmin));
router.delete("/admins/:adminId", asyncHandler(deleteAdmin));

export default router;
