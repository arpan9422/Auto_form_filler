import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { validateRequest } from "../../middleware/validateRequest";
import { resumeSchema } from "../../utils/validators";
import {
  createResume,
  deleteResume,
  getResumes,
  getUploadUrl,
  setDefaultResume,
  updateResume,
} from "./resume.controller";

const router = Router();

router.get("/", authenticate, asyncHandler(getResumes));
router.post("/upload-url", authenticate, asyncHandler(getUploadUrl));
router.post("/", authenticate, validateRequest(resumeSchema), asyncHandler(createResume));
router.put("/:id", authenticate, validateRequest(resumeSchema), asyncHandler(updateResume));
router.patch("/:id/default", authenticate, asyncHandler(setDefaultResume));
router.delete("/:id", authenticate, asyncHandler(deleteResume));

export default router;
