import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  createProjectService,
  deleteProjectService,
  getProjectsService,
  updateProjectService,
} from "./project.service";
import { transcribeAndTranslate, SarvamError } from "../../utils/sarvam";
import { generateProjectDescription, analyzeGitHubRepo, OllamaError, type GitHubAnalysis } from "../../utils/ollama";
import { fetchGitHubRepoContext, buildRepoContextString } from "../../utils/github";
import { getUserGitHubToken } from "../github/github.service";
import { AppError } from "../../utils/AppError";
import { logger } from "../../utils/logger";

export const getProjects = async (req: AuthRequest, res: Response) => {
  const projects = await getProjectsService(req.userId!);
  res.status(200).json(projects);
};

export const voiceDescribeProject = async (req: AuthRequest, res: Response) => {
  const { audio, projectName } = req.body as { audio?: string; projectName?: string };

  logger.info("voice-describe", "START", { projectName: projectName ?? "(none)", audioLength: audio?.length ?? 0 }, req.userId);

  if (!audio) {
    res.status(400).json({ error: "audio (base64) is required" });
    return;
  }

  // ── Step 1: Sarvam STT ────────────────────────────────────────────────
  let transcript = "";
  try {
    logger.info("voice-describe", "Calling Sarvam STT", undefined, req.userId);
    transcript = await transcribeAndTranslate(audio);
    logger.info("voice-describe", "Sarvam OK", { transcript }, req.userId);
  } catch (err) {
    const sarvamErr = err as SarvamError;
    logger.error("voice-describe", "Sarvam FAILED", {
      message: sarvamErr.message,
      code: sarvamErr.code,
    }, req.userId);

    const statusMap: Record<string, number> = {
      MISSING_API_KEY: 500,
      CONNECTION_REFUSED: 502,
      TIMEOUT: 504,
      BAD_AUDIO: 422,
    };

    res.status(statusMap[sarvamErr.code ?? ""] ?? 502).json({
      error: sarvamErr.message,
      stage: "transcription",
    });
    return;
  }

  if (!transcript.trim()) {
    logger.warn("voice-describe", "Empty transcript — no speech detected", undefined, req.userId);
    res.status(422).json({
      error: "No speech detected in the audio. Please speak clearly and try again.",
      stage: "transcription",
    });
    return;
  }

  // ── Step 2: Ollama description generation ────────────────────────────
  let description = transcript;
  try {
    logger.info("voice-describe", "Calling Ollama", undefined, req.userId);
    description = await generateProjectDescription(transcript, projectName);
    logger.info("voice-describe", "Ollama OK", { preview: description.slice(0, 100) }, req.userId);
  } catch (err) {
    const ollamaErr = err as OllamaError;
    logger.error("voice-describe", "Ollama FAILED", {
      message: ollamaErr.message,
      code: ollamaErr.code,
      httpStatus: ollamaErr.httpStatus,
    }, req.userId);

    res.status(200).json({
      transcript,
      description: transcript,
      warning: `AI description generation failed (${ollamaErr.message}). Transcript returned as-is.`,
    });
    return;
  }

  logger.info("voice-describe", "DONE", undefined, req.userId);
  res.status(200).json({ transcript, description });
};

export const githubAnalyzeProject = async (req: AuthRequest, res: Response) => {
  const { repoUrl } = req.body as { repoUrl?: string };
  if (!repoUrl) {
    res.status(400).json({ error: "repoUrl is required" });
    return;
  }

  logger.info("github-analyze", "START", { repoUrl }, req.userId);

  // Step 1: Fetch rich context from GitHub (use user's token if connected)
  let ctx;
  try {
    const userToken = await getUserGitHubToken(req.userId!) ?? undefined;
    logger.info("github-analyze", "Token check", { hasToken: !!userToken }, req.userId);
    ctx = await fetchGitHubRepoContext(repoUrl, userToken);
  } catch (err) {
    const e = err as AppError;
    logger.error("github-analyze", "GitHub fetch failed", { message: e.message }, req.userId);
    res.status(e.statusCode ?? 502).json({ error: e.message, stage: "github" });
    return;
  }

  // Step 2: Build context string and send to LLM
  const contextStr = buildRepoContextString(ctx);
  let analysis: GitHubAnalysis;
  try {
    analysis = await analyzeGitHubRepo(contextStr, ctx.name);
    logger.info("github-analyze", "LLM analysis complete", { repo: ctx.fullName }, req.userId);
  } catch (err) {
    const ollamaErr = err as OllamaError;
    logger.error("github-analyze", "LLM failed", { message: ollamaErr.message }, req.userId);
    // Return partial data so the user still gets something
    res.status(200).json({
      name: ctx.name,
      description: ctx.description ?? "",
      techStack: Object.keys(ctx.languages),
      problemSolved: "",
      howItWorks: "",
      fileStructure: ctx.fileTree,
      keyFeatures: [],
      topics: ctx.topics,
      stars: ctx.stars,
      warning: `LLM analysis failed: ${ollamaErr.message}`,
    });
    return;
  }

  res.status(200).json({
    name: ctx.name,
    fullName: ctx.fullName,
    stars: ctx.stars,
    forks: ctx.forks,
    topics: ctx.topics,
    languages: Object.keys(ctx.languages),
    ...analysis,
  });
};

export const createProject = async (req: AuthRequest, res: Response) => {  const project = await createProjectService(req.userId!, req.body);
  res.status(201).json(project);
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  const project = await updateProjectService(req.userId!, req.params.id, req.body);
  res.status(200).json(project);
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  const result = await deleteProjectService(req.userId!, req.params.id);
  res.status(200).json(result);
};
