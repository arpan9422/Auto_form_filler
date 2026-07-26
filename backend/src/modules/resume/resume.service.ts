import { AppError } from "../../utils/AppError";
import { scheduleUserKnowledgeSync } from "../ai/rag.service";
import fs from "fs";
import path from "path";
import {
  clearDefaultResumeFlag,
  createResumeDb,
  deleteResumeDb,
  findResumeById,
  getResumesByUserId,
  runResumeTransaction,
  updateResumeDb,
} from "./resume.repository";

type ResumePayload = {
  label: string;
  target?: string;
  description?: string;
  pdfUrl: string;
  isDefault?: boolean;
};

const normalizeResumePayload = (data: ResumePayload) => ({
  label: data.label.trim(),
  target: data.target?.trim() || undefined,
  description: data.description?.trim() || undefined,
  pdfUrl: data.pdfUrl.trim(),
  isDefault: data.isDefault ?? false,
});

const ensureResumeOwnership = async (userId: string, resumeId: string) => {
  const resume = await findResumeById(resumeId);

  if (!resume || resume.userId !== userId) {
    throw new AppError("Resume not found", 404);
  }

  return resume;
};

export const getResumesService = async (userId: string) => getResumesByUserId(userId);



export const createResumeService = async (userId: string, data: ResumePayload) => {
  const payload = normalizeResumePayload(data);
  const existingResumes = await getResumesByUserId(userId);
  const shouldBeDefault = payload.isDefault || existingResumes.length === 0;

  const resume = await runResumeTransaction(async (tx) => {
    if (shouldBeDefault) {
      await clearDefaultResumeFlag(userId, tx);
    }

    return createResumeDb(
      {
        userId,
        ...payload,
        isDefault: shouldBeDefault,
      },
      tx
    );
  });

  scheduleUserKnowledgeSync(userId);
  return resume;
};

export const updateResumeService = async (
  userId: string,
  resumeId: string,
  data: ResumePayload
) => {
  const existingResume = await ensureResumeOwnership(userId, resumeId);
  const payload = normalizeResumePayload(data);
  const shouldBeDefault = payload.isDefault ?? existingResume.isDefault;

  const updatedResume = await runResumeTransaction(async (tx) => {
    if (shouldBeDefault) {
      await clearDefaultResumeFlag(userId, tx);
    }

    return updateResumeDb(
      resumeId,
      {
        ...payload,
        isDefault: shouldBeDefault,
      },
      tx
    );
  });

  scheduleUserKnowledgeSync(userId);
  return updatedResume;
};

export const deleteResumeService = async (userId: string, resumeId: string) => {
  const resume = await ensureResumeOwnership(userId, resumeId);

  await runResumeTransaction(async (tx) => {
    await deleteResumeDb(resumeId, tx);

    if (resume.isDefault) {
      const remaining = await getResumesByUserId(userId);
      const fallbackResume = remaining.find((item) => item.id !== resumeId);

      if (fallbackResume) {
        await clearDefaultResumeFlag(userId, tx);
        await updateResumeDb(
          fallbackResume.id,
          {
            label: fallbackResume.label,
            target: fallbackResume.target ?? undefined,
            description: fallbackResume.description ?? undefined,
            pdfUrl: fallbackResume.pdfUrl,
            isDefault: true,
          },
          tx
        );
      }
    }
  });

  // Delete local file after DB record is gone — non-fatal if it fails
  try {
    const filename = resume.pdfUrl.split('/').pop();
    if (filename) {
      const filePath = path.join(process.cwd(), "uploads/resumes", filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (err) {
    console.error(`[Local] Failed to delete object ${resume.pdfUrl}:`, err);
  }

  scheduleUserKnowledgeSync(userId);

  return { message: "Resume deleted successfully" };
};

export const setDefaultResumeService = async (userId: string, resumeId: string) => {
  const resume = await ensureResumeOwnership(userId, resumeId);

  const updatedResume = await runResumeTransaction(async (tx) => {
    await clearDefaultResumeFlag(userId, tx);

    return updateResumeDb(
      resumeId,
      {
        label: resume.label,
        target: resume.target ?? undefined,
        description: resume.description ?? undefined,
        pdfUrl: resume.pdfUrl,
        isDefault: true,
      },
      tx
    );
  });

  scheduleUserKnowledgeSync(userId);
  return updatedResume;
};
