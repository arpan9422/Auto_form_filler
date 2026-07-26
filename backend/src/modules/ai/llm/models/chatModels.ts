import { ChatOllama } from "@langchain/ollama";

/**
 * base_fast_model - cheap/fast model used for classification, extraction, and validation.
 */
export function getBaseFastModel(temperature = 0) {
  return new ChatOllama({
    model: process.env.OLLAMA_MODEL ?? "gpt-oss:120b-cloud",
    temperature,
    baseUrl: process.env.OLLAMA_BASE_URL,
    headers: process.env.OLLAMA_API_KEY ? {
      Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
    } : undefined,
    maxRetries: 2,
  });
}

/**
 * reasoning_model - stronger model used for difficult field reasoning and long-form composition.
 */
export function getReasoningModel(temperature = 0.3) {
  return new ChatOllama({
    model: process.env.OLLAMA_MODEL ?? "gpt-oss:120b-cloud",
    temperature,
    baseUrl: process.env.OLLAMA_BASE_URL,
    headers: process.env.OLLAMA_API_KEY ? {
      Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
    } : undefined,
    maxRetries: 2,
  });
}
