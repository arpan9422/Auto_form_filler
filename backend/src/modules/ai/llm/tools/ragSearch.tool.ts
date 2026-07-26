import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { queryContext, inferRelevantChunkTypes } from "../../rag.service";
import { getCollection } from "../../../../config/chroma";
import { RetrievedChunk } from "../schemas/autofill.schemas";

// ─── search_user_knowledge ────────────────────────────────────────────────────

export const searchUserKnowledgeTool = tool(
  async ({
    userId,
    query,
    types,
    topK,
  }: {
    userId: string;
    query: string;
    types?: string[];
    topK?: number;
  }): Promise<string> => {
    const collection = await getCollection();
    const resolvedTypes = types?.length ? types : inferRelevantChunkTypes(query);

    const results = await collection.query({
      queryTexts: [query],
      nResults: topK ?? 5,
      where: {
        $and: [
          { userId },
          { type: { $in: resolvedTypes } }
        ]
      }
    });

    if (!results.metadatas || results.metadatas.length === 0 || !results.metadatas[0]) {
      return JSON.stringify([]);
    }

    const chunks: RetrievedChunk[] = results.metadatas[0].map((metadata, idx) => ({
      id: results.ids[0][idx],
      chunkType: String(metadata?.type ?? "PERSONAL") as RetrievedChunk["chunkType"],
      title: typeof metadata?.title === "string" ? metadata.title : undefined,
      priority: Number(metadata?.priority ?? 0),
      score: results.distances ? (results.distances[0][idx] ?? 0) : 0,
      content: String(metadata?.content ?? ""),
    }));

    return JSON.stringify(chunks);
  },
  {
    name: "search_user_knowledge",
    description:
      "Chroma-backed semantic search over user knowledge base. Returns relevant chunks with score, type, and content.",
    schema: z.object({
      userId: z.string().describe("The authenticated user ID"),
      query: z.string().describe("Semantic search query"),
      types: z
        .array(z.string())
        .optional()
        .describe("Chunk types to filter: PERSONAL, PROJECT, EXPERIENCE, EDUCATION, ANSWER, RESUME"),
      topK: z.number().optional().describe("Number of results to return (default 5)"),
    }),
  }
);

// ─── search_resume_context ────────────────────────────────────────────────────

export const searchResumeContextTool = tool(
  async ({ userId, query }: { userId: string; query: string }): Promise<string> => {
    const chunks = await queryContext(query, userId, { topK: 4, types: ["RESUME"] });
    return JSON.stringify(chunks);
  },
  {
    name: "search_resume_context",
    description: "Focused retriever for resume chunks from the user knowledge base.",
    schema: z.object({
      userId: z.string(),
      query: z.string(),
    }),
  }
);

// ─── search_answer_library_context ───────────────────────────────────────────

export const searchAnswerLibraryContextTool = tool(
  async ({ userId, query }: { userId: string; query: string }): Promise<string> => {
    const chunks = await queryContext(query, userId, { topK: 4, types: ["ANSWER"] });
    return JSON.stringify(chunks);
  },
  {
    name: "search_answer_library_context",
    description: "Focused retriever for reusable Q&A chunks from the user answer library.",
    schema: z.object({
      userId: z.string(),
      query: z.string(),
    }),
  }
);
