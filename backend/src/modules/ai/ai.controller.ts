import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { generateFormFillService, chatRefineService, submitFeedbackService } from "./ai.service";
import { AppError } from "../../utils/AppError";
import { runAutofillAgent } from "./llm/services/autofillAgent.service";
import { runRefineAgent } from "./llm/services/refineAgent.service";
import { runChatAgent, listEpisodes, getEpisode, deleteEpisode } from "./llm/services/chatAgent.service";

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

// POST /ai/agent/fill – LangGraph-powered autofill (agentic path)
export const agentFill = async (req: AuthRequest, res: Response) => {
  if (!req.userId) throw new AppError("Unauthorized", 401);

  const fields = Array.isArray(req.body?.fields) ? req.body.fields : null;
  if (!fields || fields.length === 0) throw new AppError("Fields are required", 400);

  const contextMode = req.body?.contextMode === "full" || req.body?.useRag === false
    ? "full"
    : "rag";

  const result = await runAutofillAgent({
    userId: req.userId,
    fields,
    currentFormState: req.body?.currentFormState ?? {},
    domain: req.body?.domain,
    formId: req.body?.formId,
    sessionId: req.body?.sessionId,
    contextMode,
    rawHtml: req.body?.rawHtml,
    url: req.body?.url,
  });

  res.status(200).json(result);
};

// POST /ai/agent/refine – LangGraph-powered chat refinement
export const agentRefine = async (req: AuthRequest, res: Response) => {
  if (!req.userId) throw new AppError("Unauthorized", 401);

  const instruction = typeof req.body?.message === "string" ? req.body.message : "";
  if (!instruction.trim()) throw new AppError("Message is required", 400);

  const updatedFields = await runRefineAgent({
    userId: req.userId,
    instruction,
    currentFormState: req.body?.formState ?? {},
    sessionId: req.body?.sessionId,
  });

  res.status(200).json(updatedFields);
};

// POST /ai/agent/chat – LangGraph conversational Chat Agent
export const agentChat = async (req: AuthRequest, res: Response) => {
  console.log(`[FormPilot] Received agentChat request: ${req.body?.message}`);
  if (!req.userId) throw new AppError("Unauthorized", 401);

  const message = typeof req.body?.message === "string" ? req.body.message : "";
  if (!message.trim()) throw new AppError("Message is required", 400);

  const result = await runChatAgent({
    userId: req.userId,
    message,
    history: Array.isArray(req.body?.history) ? req.body.history : [],
    episodeId: typeof req.body?.episodeId === "string" ? req.body.episodeId : undefined,
  });

  res.status(200).json(result);
};

// GET /ai/agent/episodes – List all chat episodes
export const listChatEpisodes = async (req: AuthRequest, res: Response) => {
  if (!req.userId) throw new AppError("Unauthorized", 401);
  const episodes = await listEpisodes(req.userId);
  res.status(200).json({ episodes });
};

// GET /ai/agent/episodes/:id – Get episode message trajectory
export const getChatEpisode = async (req: AuthRequest, res: Response) => {
  if (!req.userId) throw new AppError("Unauthorized", 401);
  const episode = await getEpisode(req.userId, req.params.id || "");
  if (!episode) throw new AppError("Episode not found", 404);
  res.status(200).json({ episode });
};

// DELETE /ai/agent/episodes/:id – Delete episode and clean vector memory
export const deleteChatEpisode = async (req: AuthRequest, res: Response) => {
  if (!req.userId) throw new AppError("Unauthorized", 401);
  const success = await deleteEpisode(req.userId, req.params.id || "");
  if (!success) throw new AppError("Episode not found", 404);
  res.status(200).json({ success: true });
};
