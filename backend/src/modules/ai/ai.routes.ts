import { Router } from "express";
import { generateFill, chatRefine, submitFeedback, agentFill, agentRefine, agentChat, listChatEpisodes, getChatEpisode, deleteChatEpisode } from "./ai.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

// ─── Legacy deterministic paths ──────────────────────────────────────────────
router.post("/generate", authenticate, generateFill);
router.post("/chat",     authenticate, chatRefine);
router.post("/feedback", authenticate, submitFeedback);

// ─── LangGraph agentic & episodic paths ─────────────────────────────────────────
router.post("/agent/fill",         authenticate, agentFill);
router.post("/agent/refine",       authenticate, agentRefine);
router.post("/agent/chat",         authenticate, agentChat);
router.get("/agent/episodes",      authenticate, listChatEpisodes);
router.get("/agent/episodes/:id",  authenticate, getChatEpisode);
router.delete("/agent/episodes/:id", authenticate, deleteChatEpisode);

export default router;
