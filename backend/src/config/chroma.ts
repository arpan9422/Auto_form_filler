import { ChromaClient } from "chromadb";
import { DefaultEmbeddingFunction } from "@chroma-core/default-embed";

export const chroma = new ChromaClient({
  port: 8000,
});

const embedder = new DefaultEmbeddingFunction();

export const getCollection = async () => {
  return await chroma.getOrCreateCollection({
    name: process.env.CHROMA_COLLECTION || "ai-form-assistant-v2",
    embeddingFunction: embedder,
  });
};

export default chroma;

