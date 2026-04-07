import prisma from "../../config/database";
import { AppError } from "../../utils/AppError";
import { logger } from "../../utils/logger";

const CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? "";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// ── OAuth URL ──────────────────────────────────────────────────────────

export const getGitHubAuthUrlService = (userId: string) => {
  if (!CLIENT_ID) throw new AppError("GITHUB_CLIENT_ID is not configured", 500);

  // Encode userId in state so we know who to link after callback
  const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString("base64url");

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: "repo read:user",
    state,
    redirect_uri: `${process.env.API_BASE_URL}/api/github/callback`,
  });

  return { url: `https://github.com/login/oauth/authorize?${params}` };
};

// ── OAuth callback ─────────────────────────────────────────────────────

export const handleGitHubCallbackService = async (code: string, state: string) => {
  if (!CLIENT_ID || !CLIENT_SECRET) throw new AppError("GitHub OAuth is not configured", 500);

  // Decode state
  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf-8")) as { userId: string; ts: number };
    // Reject stale states (> 10 min)
    if (Date.now() - decoded.ts > 10 * 60 * 1000) throw new Error("State expired");
    userId = decoded.userId;
  } catch {
    throw new AppError("Invalid or expired OAuth state", 400);
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
  });

  const tokenData = await tokenRes.json() as { access_token?: string; error?: string; scope?: string };
  if (!tokenData.access_token) {
    throw new AppError(`GitHub OAuth failed: ${tokenData.error ?? "no token returned"}`, 502);
  }

  // Fetch GitHub user info
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
    },
  });
  const ghUser = await userRes.json() as { id: number; login: string };

  // Upsert connection
  await prisma.gitHubConnection.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: tokenData.access_token,
      githubLogin: ghUser.login,
      githubId: ghUser.id,
      scope: tokenData.scope ?? "repo,read:user",
    },
    update: {
      accessToken: tokenData.access_token,
      githubLogin: ghUser.login,
      githubId: ghUser.id,
      scope: tokenData.scope ?? "repo,read:user",
    },
  });

  logger.info("github-oauth", "Connected", { userId, login: ghUser.login });

  // Redirect back to dashboard
  return `${FRONTEND_URL}/dashboard?tab=profile&github=connected`;
};

// ── Status ─────────────────────────────────────────────────────────────

export const getGitHubStatusService = async (userId: string) => {
  const conn = await prisma.gitHubConnection.findUnique({ where: { userId } });
  if (!conn) return { connected: false };
  return {
    connected: true,
    login: conn.githubLogin,
    connectedAt: conn.createdAt,
  };
};

// ── Disconnect ─────────────────────────────────────────────────────────

export const disconnectGitHubService = async (userId: string) => {
  await prisma.gitHubConnection.deleteMany({ where: { userId } });
  logger.info("github-oauth", "Disconnected", { userId });
  return { message: "GitHub disconnected" };
};

// ── Get token for a user (used by github-analyze) ─────────────────────

export const getUserGitHubToken = async (userId: string): Promise<string | null> => {
  const conn = await prisma.gitHubConnection.findUnique({ where: { userId } });
  return conn?.accessToken ?? null;
};
