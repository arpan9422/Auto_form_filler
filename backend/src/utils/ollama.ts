import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { llm } from "../config/ollama";
import { logger } from "./logger";

export type OllamaErrorCode = "MISSING_CONFIG" | "TIMEOUT" | "HTTP_ERROR" | "EMPTY_RESPONSE" | "UNKNOWN";

export class OllamaError extends Error {
  code: OllamaErrorCode;
  httpStatus?: number;
  constructor(message: string, code: OllamaErrorCode = "UNKNOWN", httpStatus?: number) {
    super(message);
    this.name = "OllamaError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

async function invoke(system: string, user: string): Promise<string> {
  if (!process.env.OLLAMA_API_KEY) {
    throw new OllamaError("OLLAMA_API_KEY is not configured", "MISSING_CONFIG");
  }
  let result;
  try {
    result = await llm.invoke([new SystemMessage(system), new HumanMessage(user)]);
  } catch (err) {
    const msg = (err as Error).message ?? "";
    logger.error("ollama", "Invocation failed", { message: msg });
    if (msg.includes("abort") || msg.includes("timeout")) throw new OllamaError("Ollama request timed out", "TIMEOUT");
    throw new OllamaError(`Ollama error: ${msg}`, "UNKNOWN");
  }
  const content = (typeof result.content === "string" ? result.content : JSON.stringify(result.content)).trim();
  if (!content) throw new OllamaError("Ollama returned an empty response", "EMPTY_RESPONSE");
  logger.debug("ollama", "Response received", { preview: content.slice(0, 150) });
  return content;
}

// ── Voice → description ────────────────────────────────────────────────

const VOICE_SYSTEM = `You are a technical writer helping developers write concise project descriptions for their portfolio.
Given a voice transcript where a developer describes their project, extract and write a clear, professional 2-3 sentence description.
Focus on: what the project does, the problem it solves, and key technical aspects.
Write in third person. Be concise. No filler phrases like "In this project" or "The developer built".`;

export async function generateProjectDescription(transcript: string, projectName?: string): Promise<string> {
  const user = projectName
    ? `Project name: ${projectName}\n\nVoice transcript: "${transcript}"\n\nWrite a concise project description:`
    : `Voice transcript: "${transcript}"\n\nWrite a concise project description:`;
  logger.debug("ollama", "Invoking model (voice)", { model: process.env.OLLAMA_MODEL ?? "gpt-oss:120b", transcriptLength: transcript.length });
  return invoke(VOICE_SYSTEM, user);
}

// ── GitHub repo → rich description ────────────────────────────────────

const GITHUB_SYSTEM = `You are a senior software engineer writing detailed project documentation for a developer portfolio.

Given full GitHub repository context (README, file structure, key source files, languages), produce a comprehensive project analysis in this exact JSON format:

{
  "description": "3-5 sentence detailed description covering: what the project does, the core problem it solves, how it works technically, and its key features.",
  "techStack": ["list", "of", "technologies", "frameworks", "databases", "tools"],
  "problemSolved": "1-2 sentences on the specific problem or pain point this project addresses.",
  "howItWorks": "2-3 sentences explaining the technical architecture and key implementation details.",
  "fileStructure": "Brief summary of the project structure and how it's organized.",
  "keyFeatures": ["feature 1", "feature 2", "feature 3"]
}

Be specific and technical. Use the actual file names, frameworks, and patterns you see in the code. Do not invent details not present in the context.
Return ONLY valid JSON, no markdown fences, no extra text.`;

export type GitHubAnalysis = {
  description: string;
  techStack: string[];
  problemSolved: string;
  howItWorks: string;
  fileStructure: string;
  keyFeatures: string[];
};

export async function analyzeGitHubRepo(repoContext: string, repoName: string): Promise<GitHubAnalysis> {
  logger.debug("ollama", "Invoking model (github)", { model: process.env.OLLAMA_MODEL ?? "gpt-oss:120b", contextLength: repoContext.length });

  const user = `Repository name: ${repoName}\n\n${repoContext}\n\nAnalyze this repository and return the JSON:`;
  const raw = await invoke(GITHUB_SYSTEM, user);

  // Strip any accidental markdown fences
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  try {
    return JSON.parse(cleaned) as GitHubAnalysis;
  } catch {
    logger.warn("ollama", "JSON parse failed — returning raw as description", { raw: raw.slice(0, 200) });
    // Graceful fallback: wrap raw text
    return {
      description: raw.slice(0, 500),
      techStack: [],
      problemSolved: "",
      howItWorks: "",
      fileStructure: "",
      keyFeatures: [],
    };
  }
}
