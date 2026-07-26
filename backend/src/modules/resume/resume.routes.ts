import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/resumes/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop() ?? "pdf";
    cb(null, `${randomUUID()}.${ext}`);
  },
});
const upload = multer({ storage });
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { validateRequest } from "../../middleware/validateRequest";
import { resumeSchema } from "../../utils/validators";
import {
  createResume,
  deleteResume,
  getResumes,
  uploadResume,
  setDefaultResume,
  updateResume,
} from "./resume.controller";

const router = Router();

router.get("/", authenticate, asyncHandler(getResumes));
router.post("/upload", authenticate, upload.single("file"), asyncHandler(uploadResume));
router.post("/", authenticate, validateRequest(resumeSchema), asyncHandler(createResume));
router.put("/:id", authenticate, validateRequest(resumeSchema), asyncHandler(updateResume));
router.patch("/:id/default", authenticate, asyncHandler(setDefaultResume));
router.delete("/:id", authenticate, asyncHandler(deleteResume));

export default router;
