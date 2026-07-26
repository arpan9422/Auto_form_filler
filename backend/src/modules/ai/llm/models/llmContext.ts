import { AsyncLocalStorage } from "async_hooks";

export interface LLMGatewayConfig {
  provider?: string;   // "ollama" | "openai" | "gemini" | "groq" | "openrouter" | "custom"
  model?: string | null;
  apiKey?: string | null;
  baseURL?: string | null;
  temperature?: number | null;
}

export const llmContext = new AsyncLocalStorage<LLMGatewayConfig>();

/**
 * Returns the currently scoped LLM gateway configuration from the active user's DB profile,
 * falling back to system default (Ollama / environment variables).
 */
export function getActiveLLMConfig(): LLMGatewayConfig {
  return llmContext.getStore() || { provider: "ollama" };
}
