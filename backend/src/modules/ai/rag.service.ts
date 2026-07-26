import { getCollection } from "../../config/chroma";
import prisma from "../../config/database";
import { Prisma } from "../../generated/prisma";

export type RagChunkType =
  | "PERSONAL"
  | "PROJECT"
  | "EXPERIENCE"
  | "EDUCATION"
  | "ANSWER"
  | "RESUME"
  | "EPISODIC";

type RagMetadata = {
  userId: string;
  type: RagChunkType;
  title?: string;
  tags?: string[];
  priority: number;
  createdAt: number;
  content: string;
};

type RagChunk = {
  id: string;
  text: string;
  metadata: Omit<RagMetadata, "content">;
};

type UserKnowledgeRecord = Prisma.UserGetPayload<{
  include: {
    links: true;
    educations: true;
    works: true;
    projects: true;
    answers: true;
    resumes: true;
  };
}>;

type QueryContextOptions = {
  topK?: number;
  types?: RagChunkType[];
};

const EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_TOP_K = 5;

const PERSONAL_KEYWORDS = [
  "name",
  "email",
  "phone",
  "mobile",
  "contact",
  "portfolio",
  "linkedin",
  "github",
  "website",
  "location",
  "bio",
  "skill",
  "stack",
];

const PROJECT_KEYWORDS = [
  "project",
  "build",
  "built",
  "product",
  "feature",
  "startup",
  "architecture",
  "tech stack",
  "implementation",
];

const EXPERIENCE_KEYWORDS = [
  "experience",
  "work",
  "role",
  "company",
  "intern",
  "job",
  "career",
  "responsibility",
  "achievement",
  "hire",
];

const EDUCATION_KEYWORDS = [
  "education",
  "degree",
  "college",
  "university",
  "school",
  "gpa",
  "cgpa",
  "graduation",
];

const ANSWER_KEYWORDS = [
  "why should we hire you",
  "why do you want",
  "cover letter",
  "motivation",
  "strength",
  "weakness",
  "tell me about yourself",
  "introduce yourself",
  "answer",
];

const RESUME_KEYWORDS = ["resume", "cv", "summary", "profile summary"];

const unique = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

const normalizeSkills = (skills: unknown): string[] => {
  if (!Array.isArray(skills)) {
    return [];
  }

  return unique(
    skills
      .map((skill) => (typeof skill === "string" ? skill.trim().toLowerCase() : ""))
      .filter(Boolean)
  );
};

const toEpochSeconds = (date: Date) => Math.floor(date.getTime() / 1000);

const formatDate = (date?: Date | null) => {
  if (!date) {
    return "Present";
  }

  return date.toISOString().slice(0, 10);
};

const chunkText = (parts: Array<string | undefined | null>) =>
  parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join("\n");

const getScopedCollection = async () => await getCollection();
const userSyncJobs = new Map<string, Promise<void>>();
const USER_VECTOR_ID_PREFIX = "user:";

type VectorRecord = {
  id: string;
  metadata: Record<string, unknown> | null;
};



export async function getVectorRecordById(id: string): Promise<VectorRecord | undefined> {
  const collection = await getScopedCollection();
  const response = await collection.get({ ids: [id] });

  if (!response || !response.ids || response.ids.length === 0) {
    return undefined;
  }

  return {
    id: response.ids[0],
    metadata: response.metadatas?.[0] ?? null,
  };
}

const inferRelevantChunkTypes = (query: string): RagChunkType[] => {
  const lowerQuery = query.toLowerCase();
  const detectedTypes = new Set<RagChunkType>();

  if (PERSONAL_KEYWORDS.some((keyword) => lowerQuery.includes(keyword))) {
    detectedTypes.add("PERSONAL");
  }

  if (PROJECT_KEYWORDS.some((keyword) => lowerQuery.includes(keyword))) {
    detectedTypes.add("PROJECT");
  }

  if (EXPERIENCE_KEYWORDS.some((keyword) => lowerQuery.includes(keyword))) {
    detectedTypes.add("EXPERIENCE");
  }

  if (EDUCATION_KEYWORDS.some((keyword) => lowerQuery.includes(keyword))) {
    detectedTypes.add("EDUCATION");
  }

  if (ANSWER_KEYWORDS.some((keyword) => lowerQuery.includes(keyword))) {
    detectedTypes.add("ANSWER");
  }

  if (RESUME_KEYWORDS.some((keyword) => lowerQuery.includes(keyword))) {
    detectedTypes.add("RESUME");
  }

  if (detectedTypes.size === 0) {
    return ["PERSONAL", "PROJECT", "EXPERIENCE", "EDUCATION", "ANSWER", "RESUME", "EPISODIC"];
  }

  if (
    detectedTypes.has("PROJECT") ||
    detectedTypes.has("EXPERIENCE") ||
    detectedTypes.has("ANSWER")
  ) {
    detectedTypes.add("RESUME");
  }

  detectedTypes.add("EPISODIC");

  return Array.from(detectedTypes);
};

const buildPersonalChunk = (user: UserKnowledgeRecord | null) => {
  if (!user) {
    return null;
  }

  const skills = normalizeSkills(user.skills);
  const links = user.links
    .map((link) => `${link.platform}: ${link.url}`)
    .join("\n");

  const text = chunkText([
    `Name: ${user.firstName}${user.middleName ? ` ${user.middleName}` : ""} ${user.lastName}`.trim(),
    `Email: ${user.email}`,
    user.phone ? `Phone: ${user.phone}` : undefined,
    skills.length ? `Skills: ${skills.join(", ")}` : undefined,
    user.bio ? `Bio: ${user.bio}` : undefined,
    links ? `Links:\n${links}` : undefined,
  ]);

  if (!text) {
    return null;
  }

  return {
    id: `user:${user.id}:personal`,
    text,
    metadata: {
      userId: user.id,
      type: "PERSONAL" as const,
      title: `${user.firstName} ${user.lastName}`.trim(),
      tags: unique([...skills, ...user.links.map((link) => link.platform.toLowerCase())]),
      priority: 10,
      createdAt: toEpochSeconds(user.createdAt),
    },
  };
};

const buildProjectChunks = (user: UserKnowledgeRecord | null): RagChunk[] =>
  user?.projects.map((project) => ({
    id: `user:${user.id}:project:${project.id}`,
    text: chunkText([
      `Project: ${project.name}`,
      project.priority > 0 ? `Priority: ${project.priority}/5 (${project.priority >= 4 ? "Featured" : project.priority >= 3 ? "Important" : "Standard"})` : undefined,
      `Description: ${project.description}`,
      project.techStacks.length ? `Tech Stack: ${project.techStacks.join(", ")}` : undefined,
      project.projectLinks.length ? `Project Links: ${project.projectLinks.join(", ")}` : undefined,
    ]),
    metadata: {
      userId: user.id,
      type: "PROJECT",
      title: project.name,
      tags: unique(project.techStacks.map((tag: string) => tag.toLowerCase())),
      priority: project.priority > 0 ? Math.min(10, 5 + project.priority) : 8,
      createdAt: toEpochSeconds(project.createdAt),
    },
  })) ?? [];

const buildExperienceChunks = (user: UserKnowledgeRecord | null): RagChunk[] =>
  user?.works.map((work) => ({
    id: `user:${user.id}:experience:${work.id}`,
    text: chunkText([
      `Worked at ${work.companyName} as ${work.position}.`,
      `Employment Type: ${work.type.replace("_", " ")}`,
      `Duration: ${formatDate(work.startDate)} to ${formatDate(work.endDate)}`,
    ]),
    metadata: {
      userId: user.id,
      type: "EXPERIENCE",
      title: `${work.position} at ${work.companyName}`,
      tags: unique([work.companyName.toLowerCase(), work.position.toLowerCase(), work.type.toLowerCase()]),
      priority: 8,
      createdAt: toEpochSeconds(work.startDate),
    },
  })) ?? [];

const buildEducationChunks = (user: UserKnowledgeRecord | null): RagChunk[] =>
  user?.educations.map((education) => ({
    id: `user:${user.id}:education:${education.id}`,
    text: chunkText([
      `Education: ${education.degree} at ${education.instituteName}.`,
      `Duration: ${formatDate(education.startDate)} to ${formatDate(education.endDate)}`,
      education.gpa !== null && education.gpa !== undefined ? `GPA: ${education.gpa}` : undefined,
    ]),
    metadata: {
      userId: user.id,
      type: "EDUCATION",
      title: `${education.degree} at ${education.instituteName}`,
      tags: unique([education.degree.toLowerCase(), education.instituteName.toLowerCase()]),
      priority: 6,
      createdAt: toEpochSeconds(education.startDate),
    },
  })) ?? [];

const buildAnswerChunks = (user: UserKnowledgeRecord | null): RagChunk[] =>
  user?.answers.map((answer) => ({
    id: `user:${user.id}:answer:${answer.id}`,
    text: chunkText([
      `Answer Title: ${answer.title}`,
      `Category: ${answer.category}`,
      `Answer: ${answer.answer}`,
    ]),
    metadata: {
      userId: user.id,
      type: "ANSWER",
      title: answer.title,
      tags: unique([answer.category.toLowerCase(), ...answer.title.toLowerCase().split(/\s+/)]),
      priority: 9,
      createdAt: toEpochSeconds(answer.createdAt),
    },
  })) ?? [];

const buildResumeChunks = (user: UserKnowledgeRecord | null): RagChunk[] =>
  user?.resumes.map((resume) => ({
    id: `user:${user.id}:resume:${resume.id}`,
    text: chunkText([
      `Resume Label: ${resume.label}`,
      resume.target ? `Target Role: ${resume.target}` : undefined,
      resume.description ? `Resume Description: ${resume.description}` : undefined,
      resume.isDefault ? "This is the default active resume." : undefined,
      `Resume File: ${resume.pdfUrl}`,
    ]),
    metadata: {
      userId: user.id,
      type: "RESUME",
      title: resume.label,
      tags: unique(
        [
          resume.target?.toLowerCase(),
          ...(resume.description?.toLowerCase().split(/\s+/).slice(0, 8) ?? []),
        ].filter(Boolean) as string[]
      ),
      priority: resume.isDefault ? 9 : 7,
      createdAt: toEpochSeconds(resume.createdAt),
    },
  })) ?? [];

const buildUserKnowledgeChunks = (
  user: UserKnowledgeRecord | null
): RagChunk[] => {
  if (!user) {
    return [];
  }

  return [
    buildPersonalChunk(user),
    ...buildProjectChunks(user),
    ...buildExperienceChunks(user),
    ...buildEducationChunks(user),
    ...buildAnswerChunks(user),
    ...buildResumeChunks(user),
  ].filter((chunk): chunk is RagChunk => Boolean(chunk?.text));
};

const upsertChunks = async (chunks: RagChunk[]) => {
  if (chunks.length === 0) return;

  const collection = await getScopedCollection();
  const BATCH_SIZE = 20;

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.text);

    const ids = batch.map((c) => c.id);
    const metadatas = batch.map((c) => ({
      ...c.metadata,
      tags: c.metadata.tags?.join(",") || "",
      content: c.text,
    }));

    await collection.upsert({
      ids,
      metadatas,
      documents: texts,
    });
  }
};

const deleteUserKnowledgeChunks = async (userId: string) => {
  const collection = await getScopedCollection();
  await collection.delete({
    where: { userId: { $eq: userId } },
  });
};

export async function reembedAndUpsertVectorRecord(
  id: string,
  content: string,
  metadata: Omit<RagMetadata, "content">
) {
  const collection = await getScopedCollection();

  await collection.upsert({
    ids: [id],
    metadatas: [{
      ...metadata,
      tags: metadata.tags?.join(",") || "",
      content,
    }],
    documents: [content],
  });
}

export async function updateVectorRecordWithLatestData(
  id: string,
  updater: (current: {
    content?: string;
    metadata?: Partial<RagMetadata>;
  }) => Promise<{
    content: string;
    metadata: Omit<RagMetadata, "content">;
  }>
) {
  const currentRecord = await getVectorRecordById(id);

  const nextRecord = await updater({
    content:
      typeof currentRecord?.metadata?.content === "string"
        ? currentRecord.metadata.content
        : undefined,
    metadata: currentRecord?.metadata as Partial<RagMetadata> | undefined,
  });

  await reembedAndUpsertVectorRecord(id, nextRecord.content, nextRecord.metadata);
}

export async function syncUserKnowledgeBase(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      links: true,
      educations: true,
      works: true,
      projects: true,
      answers: true,
      resumes: true,
    },
  });

  const collection = await getScopedCollection();
  await deleteUserKnowledgeChunks(userId);

  if (!user) {
    return;
  }

  const chunks = buildUserKnowledgeChunks(user);
  await upsertChunks(chunks);
}

export function scheduleUserKnowledgeSync(userId: string) {
  const previousJob = userSyncJobs.get(userId) ?? Promise.resolve();

  const nextJob = previousJob
    .catch(() => undefined)
    .then(async () => {
      await syncUserKnowledgeBase(userId);
    })
    .catch((error) => {
      console.error(`Failed to sync Pinecone knowledge for user ${userId}`, error);
    })
    .finally(() => {
      if (userSyncJobs.get(userId) === nextJob) {
        userSyncJobs.delete(userId);
      }
    });

  userSyncJobs.set(userId, nextJob);
}

export async function storeEmbedding(
  id: string,
  content: string,
  metadata: Omit<RagMetadata, "content">
) {
  await reembedAndUpsertVectorRecord(id, content, metadata);
}

export async function queryContext(
  query: string,
  userId: string,
  options: QueryContextOptions = {}
): Promise<string[]> {
  const collection = await getScopedCollection();
  const types = options.types?.length ? options.types : inferRelevantChunkTypes(query);
  const results = await collection.query({
    queryTexts: [query],
    nResults: options.topK ?? DEFAULT_TOP_K,
    where: {
      $and: [
        { userId: { $eq: userId } },
        { type: { $in: types } },
      ],
    },
  });

  if (!results.metadatas || results.metadatas.length === 0 || !results.metadatas[0]) {
    return [];
  }

  const matches = results.metadatas[0].map((metadata, idx) => ({
    metadata,
    score: results.distances ? results.distances[0][idx] : 0,
  }));

  return (
    matches
      .sort((left, right) => {
        const rightPriority = Number(right.metadata?.priority ?? 0);
        const leftPriority = Number(left.metadata?.priority ?? 0);
        return rightPriority - leftPriority;
      })
      .map((match) => String(match.metadata?.content ?? ""))
      .filter(Boolean)
  );
}

export async function deleteEmbedding(id: string) {
  const collection = await getScopedCollection();
  await collection.delete({ ids: [id] });
}

export async function syncEpisodicMemoryChunk(
  userId: string,
  episodeId: string,
  title: string,
  summaryText: string
) {
  const chunkId = `user:${userId}:episodic:${episodeId}`;
  await reembedAndUpsertVectorRecord(chunkId, summaryText, {
    userId,
    type: "EPISODIC",
    title,
    tags: ["episode", "chat", "memory", ...title.toLowerCase().split(/\s+/)],
    priority: 8,
    createdAt: Math.floor(Date.now() / 1000),
  });
}

export { inferRelevantChunkTypes };
