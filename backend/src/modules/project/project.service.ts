import { AppError } from "../../utils/AppError";
import { scheduleUserKnowledgeSync } from "../ai/rag.service";
import {
  createProjectDb,
  deleteProjectDb,
  findProjectById,
  getProjectsByUserId,
  updateProjectDb,
} from "./project.repository";

type ProjectPayload = {
  name: string;
  description: string;
  projectLinks?: string[];
  techStacks?: string[];
};

const normalizeProjectPayload = (data: ProjectPayload) => ({
  name: data.name.trim(),
  description: data.description.trim(),
  projectLinks: data.projectLinks ?? [],
  techStacks: data.techStacks ?? [],
});

export const getProjectsService = async (userId: string) => getProjectsByUserId(userId);

export const createProjectService = async (userId: string, data: ProjectPayload) => {
  const project = await createProjectDb({
    userId,
    ...normalizeProjectPayload(data),
  });

  scheduleUserKnowledgeSync(userId);
  return project;
};

export const updateProjectService = async (
  userId: string,
  id: string,
  data: ProjectPayload
) => {
  const project = await findProjectById(id);

  if (!project || project.userId !== userId) {
    throw new AppError("Project not found", 404);
  }

  const updatedProject = await updateProjectDb(id, normalizeProjectPayload(data));
  scheduleUserKnowledgeSync(userId);

  return updatedProject;
};

export const deleteProjectService = async (userId: string, id: string) => {
  const project = await findProjectById(id);

  if (!project || project.userId !== userId) {
    throw new AppError("Project not found", 404);
  }

  await deleteProjectDb(id);
  scheduleUserKnowledgeSync(userId);

  return {
    message: "Project deleted successfully",
  };
};
