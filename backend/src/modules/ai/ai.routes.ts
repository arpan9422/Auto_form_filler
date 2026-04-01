import { Router } from "express";
import { generateFill, chatRefine, submitFeedback } from "./ai.controller";
import { authenticate } from "../../middleware/auth";
import { checkUsageLimit } from "../../middleware/usageLimit";

const router = Router();

router.post("/generate", authenticate, checkUsageLimit, generateFill);
router.post("/chat", authenticate, chatRefine);
router.post("/feedback", authenticate, submitFeedback);

export default router;
