import { ChatOllama } from "@langchain/ollama";

export const llm = new ChatOllama({
  model: process.env.OLLAMA_MODEL ?? "gpt-oss:120b",
  temperature: 0.4,
  baseUrl: process.env.OLLAMA_BASE_URL ?? "https://api.ollama.com",
  headers: {
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
  },
  maxRetries: 2,
});
