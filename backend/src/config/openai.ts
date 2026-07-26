import OpenAI from "openai";
import { getAIProviderConfig } from "./aiProvider";

const aiProviderConfig = getAIProviderConfig();

// Chat/completion client for OpenAI-compatible providers.
export const openai = new OpenAI({
  apiKey: aiProviderConfig.apiKey,
  baseURL: aiProviderConfig.baseURL,
});

// Embedding client using the same provider config.
export const ragEmbeddingClient = new OpenAI({
  apiKey: aiProviderConfig.apiKey,
  baseURL: aiProviderConfig.baseURL,
});

export default openai;
