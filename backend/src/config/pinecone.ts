// Pinecone client configuration
import { Pinecone } from "@pinecone-database/pinecone";

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export const getIndex = () => {
  return pinecone.index(process.env.PINECONE_INDEX || "ai-form-assistant");
};

export default pinecone;
