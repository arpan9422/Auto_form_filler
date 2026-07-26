import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { getActiveLLMConfig, LLMGatewayConfig } from "./llmContext";

interface ProviderDefaults {
  fast: string;
  reasoning: string;
  baseURL?: string;
}

const PROVIDER_DEFAULTS: Record<string, ProviderDefaults> = {
  ollama: {
    fast: process.env.OLLAMA_MODEL ?? "gpt-oss:120b-cloud",
    reasoning: process.env.OLLAMA_MODEL ?? "gpt-oss:120b-cloud",
    baseURL: process.env.OLLAMA_BASE_URL,
  },
  openai: {
    fast: "gpt-4o-mini",
    reasoning: "gpt-4o",
  },
  gemini: {
    fast: "gemini-2.5-flash",
    reasoning: "gemini-2.5-pro",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  },
  groq: {
    fast: "llama-3.3-70b-versatile",
    reasoning: "deepseek-r1-distill-llama-70b",
    baseURL: "https://api.groq.com/openai/v1",
  },
  openrouter: {
    fast: "google/gemini-2.5-flash-001",
    reasoning: "anthropic/claude-3.7-sonnet",
    baseURL: "https://openrouter.ai/api/v1",
  },
  custom: {
    fast: "gpt-4o-mini",
    reasoning: "gpt-4o",
    baseURL: "https://api.openai.com/v1",
  },
};

function createGatewayModel(
  modelType: "fast" | "reasoning",
  defaultTemperature: number
) {
  const config = getActiveLLMConfig();
  const provider = (config.provider || "ollama").toLowerCase();
  const defaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.ollama;
  const modelName = config.model || defaults[modelType];
  const temperature = config.temperature ?? defaultTemperature;
  const apiKey = config.apiKey || undefined;
  const baseURL = config.baseURL || defaults.baseURL;

  if (provider === "ollama") {
    return new ChatOllama({
      model: modelName,
      temperature,
      baseUrl: baseURL,
      headers: (apiKey || process.env.OLLAMA_API_KEY)
        ? { Authorization: `Bearer ${apiKey || process.env.OLLAMA_API_KEY}` }
        : undefined,
      maxRetries: 2,
    });
  }

  // Use OpenAI-compatible protocol for OpenAI, Gemini, Groq, OpenRouter, and Custom providers
  return new ChatOpenAI({
    modelName,
    temperature,
    openAIApiKey: apiKey || process.env[`${provider.toUpperCase()}_API_KEY`] || process.env.OPENAI_API_KEY || "dummy_key_to_prevent_crash",
    configuration: baseURL ? { baseURL } : undefined,
    maxRetries: 2,
  });
}

/**
 * getBaseFastModel - cheap/fast model used for classification, extraction, and validation.
 */
export function getBaseFastModel(temperature = 0) {
  return createGatewayModel("fast", temperature);
}

/**
 * getReasoningModel - stronger model used for difficult field reasoning and long-form composition.
 */
export function getReasoningModel(temperature = 0.3) {
  return createGatewayModel("reasoning", temperature);
}
