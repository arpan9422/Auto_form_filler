import { AppError } from "./AppError";
import { logger } from "./logger";

const GITHUB_API = "https://api.github.com";
// Server-level token used as fallback when user hasn't connected GitHub
const SERVER_GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

// ── Types ──────────────────────────────────────────────────────────────

export type GitHubRepoContext = {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  topics: string[];
  defaultBranch: string;
  languages: Record<string, number>;
  readme: string | null;
  fileTree: string;          // condensed directory tree
  keyFiles: { path: string; content: string }[];  // package.json, main entry, etc.
};

// ── HTTP helper ────────────────────────────────────────────────────────

async function ghFetch<T>(path: string, token?: string): Promise<T> {
  const effectiveToken = token || SERVER_GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (effectiveToken) headers.Authorization = `Bearer ${effectiveToken}`;

  const res = await fetch(`${GITHUB_API}${path}`, { headers });

  if (res.status === 404) throw new AppError(`GitHub: not found — ${path}`, 404);
  if (res.status === 403) throw new AppError("GitHub rate limit exceeded. Set GITHUB_TOKEN in .env.", 429);
  if (!res.ok) throw new AppError(`GitHub API error ${res.status} on ${path}`, 502);

  return res.json() as Promise<T>;
}

// ── File tree builder ──────────────────────────────────────────────────

type TreeItem = { path: string; type: string; size?: number };

function buildCondensedTree(items: TreeItem[], maxLines = 80): string {
  // Filter out noise: node_modules, .git, dist, build, lock files, images
  const SKIP = /node_modules|\.git|dist\/|build\/|\.lock$|\.png$|\.jpg$|\.svg$|\.ico$|\.woff|\.ttf|__pycache__|\.pyc$/;
  const filtered = items.filter(i => !SKIP.test(i.path)).slice(0, maxLines);

  const lines: string[] = [];
  for (const item of filtered) {
    const depth = item.path.split("/").length - 1;
    const indent = "  ".repeat(depth);
    const name = item.path.split("/").pop()!;
    lines.push(`${indent}${item.type === "tree" ? "📁" : "📄"} ${name}`);
  }
  return lines.join("\n");
}

// ── Key file detector ──────────────────────────────────────────────────

const KEY_FILE_PATTERNS = [
  /^package\.json$/,
  /^pyproject\.toml$/,
  /^requirements\.txt$/,
  /^Cargo\.toml$/,
  /^go\.mod$/,
  /^pom\.xml$/,
  /^build\.gradle$/,
  /^docker-compose\.ya?ml$/,
  /^Dockerfile$/,
  /^\.env\.example$/,
  /^src\/index\.(ts|js|tsx|jsx)$/,
  /^src\/main\.(ts|js|py|go|rs)$/,
  /^app\.(ts|js|py)$/,
  /^main\.(ts|js|py|go|rs)$/,
  /^server\.(ts|js)$/,
  /^prisma\/schema\.prisma$/,
];

function pickKeyFiles(items: TreeItem[]): string[] {
  return items
    .filter(i => i.type === "blob" && KEY_FILE_PATTERNS.some(p => p.test(i.path)))
    .slice(0, 6)
    .map(i => i.path);
}

// ── Fetch file content ─────────────────────────────────────────────────

async function fetchFileContent(owner: string, repo: string, path: string, branch: string, token?: string): Promise<string | null> {
  try {
    const data = await ghFetch<{ content?: string; encoding?: string }>(
      `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, token
    );
    if (data.encoding === "base64" && data.content) {
      const decoded = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
      // Truncate large files
      return decoded.length > 3000 ? decoded.slice(0, 3000) + "\n... [truncated]" : decoded;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Main export ────────────────────────────────────────────────────────

export async function fetchGitHubRepoContext(repoUrl: string, userToken?: string): Promise<GitHubRepoContext> {
  // Parse owner/repo from various URL formats
  const match = repoUrl.match(/(?:github\.com[/:])?([^/\s]+)\/([^/\s#?]+)/);
  if (!match) throw new AppError("Invalid GitHub repo URL or path", 400);

  const [, owner, repoRaw] = match;
  const repo = repoRaw.replace(/\.git$/, "");

  logger.info("github", "Fetching repo context", { owner, repo });

  // Parallel: repo metadata + languages + git tree
  const [repoData, languages, treeData] = await Promise.all([
    ghFetch<{
      name: string; full_name: string; description: string | null;
      stargazers_count: number; forks_count: number; topics: string[];
      default_branch: string;
    }>(`/repos/${owner}/${repo}`, userToken),
    ghFetch<Record<string, number>>(`/repos/${owner}/${repo}/languages`, userToken)
        .catch(() => ({})),
    ghFetch<{ tree: TreeItem[] }>(`/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, userToken)
      .catch(() => ({ tree: [] as TreeItem[] })),
  ]);

  const branch = repoData.default_branch;

  // README
  const readmeData = await ghFetch<{ content?: string; encoding?: string }>(
    `/repos/${owner}/${repo}/readme`, userToken
  ).catch(() => null);

  let readme: string | null = null;
  if (readmeData?.encoding === "base64" && readmeData.content) {
    const full = Buffer.from(readmeData.content.replace(/\n/g, ""), "base64").toString("utf-8");
    // Keep first 2000 chars of README — enough context without overwhelming the LLM
    readme = full.length > 2000 ? full.slice(0, 2000) + "\n... [truncated]" : full;
  }

  // File tree + key files
  const tree = treeData.tree;
  const fileTree = buildCondensedTree(tree);
  const keyFilePaths = pickKeyFiles(tree);

  const keyFiles = (
    await Promise.all(
      keyFilePaths.map(async path => {
        const content = await fetchFileContent(owner, repo, path, branch, userToken);
        return content ? { path, content } : null;
      })
    )
  ).filter((f): f is { path: string; content: string } => f !== null);

  logger.info("github", "Context fetched", {
    owner, repo, languages: Object.keys(languages).length,
    treeItems: tree.length, keyFiles: keyFiles.length,
  });

  return {
    name: repoData.name,
    fullName: repoData.full_name,
    description: repoData.description,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    topics: repoData.topics ?? [],
    defaultBranch: branch,
    languages,
    readme,
    fileTree,
    keyFiles,
  };
}

// ── Build LLM context string ───────────────────────────────────────────

export function buildRepoContextString(ctx: GitHubRepoContext): string {
  const langList = Object.entries(ctx.languages)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, bytes]) => `${lang} (${Math.round(bytes / 1024)}KB)`)
    .join(", ");

  const parts: string[] = [
    `# Repository: ${ctx.fullName}`,
    ctx.description ? `**GitHub Description:** ${ctx.description}` : "",
    `**Stars:** ${ctx.stars} | **Forks:** ${ctx.forks}`,
    ctx.topics.length ? `**Topics:** ${ctx.topics.join(", ")}` : "",
    `**Languages:** ${langList || "Unknown"}`,
    "",
    "## File Structure",
    ctx.fileTree || "(empty)",
  ];

  if (ctx.readme) {
    parts.push("", "## README", ctx.readme);
  }

  for (const file of ctx.keyFiles) {
    parts.push("", `## ${file.path}`, "```", file.content, "```");
  }

  return parts.filter(p => p !== null).join("\n");
}
