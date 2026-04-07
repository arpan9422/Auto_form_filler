import { Router } from "express";
import { getProjects, createProject, updateProject, deleteProject, voiceDescribeProject, githubAnalyzeProject } from "./project.controller";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { validateRequest } from "../../middleware/validateRequest";
import { projectSchema } from "../../utils/validators";

const router = Router();

router.get("/", authenticate, asyncHandler(getProjects));
router.post("/voice-describe", authenticate, asyncHandler(voiceDescribeProject));
router.post("/github-analyze", authenticate, asyncHandler(githubAnalyzeProject));
router.post("/", authenticate, validateRequest(projectSchema), asyncHandler(createProject));
router.put("/:id", authenticate, validateRequest(projectSchema), asyncHandler(updateProject));
router.delete("/:id", authenticate, asyncHandler(deleteProject));

export default router;
