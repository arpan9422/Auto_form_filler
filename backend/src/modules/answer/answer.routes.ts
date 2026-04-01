import { Router } from "express";
import { getAnswers, createAnswer, updateAnswer, deleteAnswer } from "./answer.controller";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { validateRequest } from "../../middleware/validateRequest";
import { customAnswerSchema } from "../../utils/validators";

const router = Router();

router.get("/", authenticate, asyncHandler(getAnswers));
router.post("/", authenticate, validateRequest(customAnswerSchema), asyncHandler(createAnswer));
router.put("/:id", authenticate, validateRequest(customAnswerSchema), asyncHandler(updateAnswer));
router.delete("/:id", authenticate, asyncHandler(deleteAnswer));

export default router;
