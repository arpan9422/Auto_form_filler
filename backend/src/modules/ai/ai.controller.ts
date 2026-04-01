import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { generateFormFillService, chatRefineService, submitFeedbackService } from "./ai.service";
import { AppError } from "../../utils/AppError";

// POST /ai/generate – Initial form autofill
export const generateFill = async (req: AuthRequest, res: Response) => {
  const fields = Array.isArray(req.body?.fields) ? req.body.fields : null;

  if (!req.userId) {
    throw new AppError("Unauthorized", 401);
  }

  if (!fields || fields.length === 0) {
    throw new AppError("Fields are required", 400);
  }

  const answers = await generateFormFillService(fields, req.userId);
  res.status(200).json(answers);
};

// POST /ai/chat – Chat-based refinement
export const chatRefine = async (req: AuthRequest, res: Response) => {
  const message = typeof req.body?.message === "string" ? req.body.message : "";
  const formState = req.body?.formState && typeof req.body.formState === "object"
    ? req.body.formState
    : {};

  if (!req.userId) {
    throw new AppError("Unauthorized", 401);
  }

  if (!message.trim()) {
    throw new AppError("Message is required", 400);
  }

  const updates = await chatRefineService(req.userId, message, formState);
  res.status(200).json(updates);
};

// POST /ai/feedback – Store user edits for learning
export const submitFeedback = async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    throw new AppError("Unauthorized", 401);
  }

  await submitFeedbackService(req.userId, req.body);
  res.status(200).json({ message: "Feedback received" });
};
