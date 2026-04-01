import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/asyncHandler";
import { validateRequest } from "../../middleware/validateRequest";
import { memorySchema } from "../../utils/validators";
import {
  createMemory,
  deleteMemory,
  getMemories,
  updateMemory,
} from "./memory.controller";

const router = Router();

router.get("/", authenticate, asyncHandler(getMemories));
router.post("/", authenticate, validateRequest(memorySchema), asyncHandler(createMemory));
router.put("/:id", authenticate, validateRequest(memorySchema), asyncHandler(updateMemory));
router.delete("/:id", authenticate, asyncHandler(deleteMemory));

export default router;
