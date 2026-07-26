import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import prisma from "../config/database";
import { llmContext, LLMGatewayConfig } from "../modules/ai/llm/models/llmContext";
import { logger } from "../utils/logger";

export async function bindUserLLMConfig(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    let config: LLMGatewayConfig = { provider: "ollama" };

    // Check if user has an explicitly saved LLM Gateway configuration in Postgres
    if (req.userId) {
      const userConfig = await prisma.lLMGatewayConfig.findUnique({
        where: { userId: req.userId },
      });

      if (userConfig) {
        config = {
          provider: userConfig.provider,
          model: userConfig.model || undefined,
          apiKey: userConfig.apiKey || undefined,
          baseURL: userConfig.baseURL || undefined,
          temperature: userConfig.temperature ?? undefined,
        };
      }
    }

    // Optional override from explicit request headers (useful during real-time connection diagnostic tests)
    const headerProvider = req.headers["x-llm-provider"] as string | undefined;
    const headerModel = req.headers["x-llm-model"] as string | undefined;
    const headerApiKey = req.headers["x-llm-api-key"] as string | undefined;
    const headerBaseUrl = req.headers["x-llm-base-url"] as string | undefined;

    if (headerProvider) {
      config = {
        provider: headerProvider,
        model: headerModel || config.model,
        apiKey: (headerApiKey && !headerApiKey.startsWith("sk-...")) ? headerApiKey : config.apiKey,
        baseURL: headerBaseUrl || config.baseURL,
        temperature: config.temperature,
      };
    }

    // Execute downstream middleware and controller handlers within this user's LLM context scope
    llmContext.run(config, () => {
      next();
    });
  } catch (error) {
    logger.warn("llmGateway", "Failed to retrieve LLMGatewayConfig from DB, falling back to system default", {
      error: (error as Error).message,
    });
    llmContext.run({ provider: "ollama" }, () => {
      next();
    });
  }
}
