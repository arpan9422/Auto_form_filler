import { Router } from "express";
import { generateFill, chatRefine, submitFeedback, agentFill, agentRefine, agentChat, listChatEpisodes, getChatEpisode, deleteChatEpisode } from "./ai.controller";
import { listGatewayProviders, getGatewayConfig, updateGatewayConfig, testGatewayConnection } from "./gateway.controller";
import { authenticate } from "../../middleware/auth";
import { bindUserLLMConfig } from "../../middleware/llmGateway";

const router = Router();

// ─── LLM Gateway Configuration & Diagnostic Routes ───────────────────────────
router.get("/gateway/providers", authenticate, listGatewayProviders);
router.get("/gateway/config", authenticate, getGatewayConfig);
router.put("/gateway/config", authenticate, updateGatewayConfig);
router.post("/gateway/test", authenticate, testGatewayConnection);

// ─── Legacy deterministic paths (now powered by LLM Gateway) ─────────────────
router.post("/generate", authenticate, bindUserLLMConfig, generateFill);
router.post("/chat", authenticate, bindUserLLMConfig, chatRefine);
router.post("/feedback", authenticate, submitFeedback);

// ─── LangGraph agentic & episodic paths ─────────────────────────────────────────
router.post("/agent/fill", authenticate, bindUserLLMConfig, agentFill);
router.post("/agent/refine", authenticate, bindUserLLMConfig, agentRefine);
router.post("/agent/chat", authenticate, bindUserLLMConfig, agentChat);
router.get("/agent/episodes", authenticate, listChatEpisodes);
router.get("/agent/episodes/:id", authenticate, getChatEpisode);
router.delete("/agent/episodes/:id", authenticate, deleteChatEpisode);

export default router;
