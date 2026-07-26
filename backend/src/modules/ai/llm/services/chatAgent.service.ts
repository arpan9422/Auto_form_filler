import prisma from "../../../../config/database";
import { buildChatGraph } from "../graphs/chat.graph";
import { syncEpisodicMemoryChunk, deleteEmbedding } from "../../rag.service";

const chatGraph = buildChatGraph();

export interface ChatAgentInput {
  userId: string;
  message: string;
  history?: Array<{ role: string; content: string }>;
  episodeId?: string;
}

export interface ChatAgentOutput {
  episodeId: string;
  response: string;
  sources: string[];
}

/**
 * Run the LangGraph conversational chat assistant pipeline with Episodic Memory persistence.
 */
export async function runChatAgent(
  input: ChatAgentInput
): Promise<ChatAgentOutput> {
  let episodeId = input.episodeId;
  let episodeTitle = "New Conversation";

  // 1. Create or verify the conversation episode in database
  if (!episodeId || episodeId.trim() === "") {
    episodeTitle = input.message
      .slice(0, 40)
      .replace(/(\r\n|\n|\r)/gm, " ")
      .trim();
    if (input.message.length > 40) episodeTitle += "...";

    const newEpisode = await prisma.chatEpisode.create({
      data: {
        userId: input.userId,
        title: episodeTitle || "New Conversation",
      },
    });
    episodeId = newEpisode.id;
  } else {
    const existing = await prisma.chatEpisode.findFirst({
      where: { id: episodeId, userId: input.userId },
    });
    if (!existing) {
      // Create fallback episode if ID wasn't found
      const newEpisode = await prisma.chatEpisode.create({
        data: {
          userId: input.userId,
          title: "Conversation Episode",
        },
      });
      episodeId = newEpisode.id;
      episodeTitle = newEpisode.title;
    } else {
      episodeTitle = existing.title;
      await prisma.chatEpisode.update({
        where: { id: episodeId },
        data: { updatedAt: new Date() },
      });
    }
  }

  // 2. Fetch stored chat history for this episode BEFORE inserting the new message
  const pastMessages = await prisma.chatMessage.findMany({
    where: { episodeId },
    orderBy: { createdAt: "asc" },
  });

  const chatHistory = pastMessages.map((m) => ({
    role: m.role === "ai" ? "assistant" : "user",
    content: m.content,
  }));

  // 3. Store the user's incoming message
  await prisma.chatMessage.create({
    data: {
      episodeId,
      role: "user",
      content: input.message,
    },
  });

  // 4. Execute LangGraph execution pipeline
  const finalState = await chatGraph.invoke({
    userId: input.userId,
    message: input.message,
    chatHistory,
    userProfile: {},
    retrievedContext: [],
    response: "",
    sources: [],
  });

  const responseText = finalState.response || "No response generated.";
  const sources = finalState.sources || [];

  // 5. Store AI response in PostgreSQL
  await prisma.chatMessage.create({
    data: {
      episodeId,
      role: "ai",
      content: responseText,
      sources,
    },
  });

  // 6. Asynchronously update Episodic Memory & Vector Index
  const summaryText = `In conversation episode "${episodeTitle}": User discussed "${input.message}". Agent guided: "${responseText.slice(0, 250)}..."`;
  
  // Persist into relational Memory table and index into RAG embeddings without blocking the reply
  Promise.all([
    prisma.chatEpisode.update({
      where: { id: episodeId },
      data: { summary: summaryText },
    }),
    prisma.memory.create({
      data: {
        userId: input.userId,
        type: "EPISODIC",
        value: summaryText,
      },
    }),
    syncEpisodicMemoryChunk(input.userId, episodeId, episodeTitle, summaryText),
  ]).catch((err) => {
    console.error("[chatAgent.service] Failed to sync episodic memory:", err);
  });

  return {
    episodeId,
    response: responseText,
    sources,
  };
}

/**
 * List all conversational episodes for an authenticated user.
 */
export async function listEpisodes(userId: string) {
  return prisma.chatEpisode.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      summary: true,
      updatedAt: true,
      createdAt: true,
    },
  });
}

/**
 * Retrieve full message trajectory and facts for a given episode.
 */
export async function getEpisode(userId: string, episodeId: string) {
  return prisma.chatEpisode.findFirst({
    where: { id: episodeId, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/**
 * Delete a chat episode and clean up its associated vector embeddings.
 */
export async function deleteEpisode(userId: string, episodeId: string) {
  const episode = await prisma.chatEpisode.findFirst({
    where: { id: episodeId, userId },
  });
  if (!episode) return false;

  await prisma.chatEpisode.delete({
    where: { id: episodeId },
  });

  const chunkId = `user:${userId}:episodic:${episodeId}`;
  deleteEmbedding(chunkId).catch((err) =>
    console.error(`Failed to remove vector embedding for episode ${episodeId}:`, err)
  );

  return true;
}
