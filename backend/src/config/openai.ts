import OpenAI from "openai";

// Chat/completion client — uses aicredits.in proxy
export const openai = new OpenAI({
  apiKey: process.env.AICREDITS_API_KEY,
  baseURL: "https://api.aicredits.in/v1",
});

// Embedding client — same proxy, same key
export const ragEmbeddingClient = new OpenAI({
  apiKey: process.env.AICREDITS_API_KEY,
  baseURL: "https://api.aicredits.in/v1",
});

export default openai;
