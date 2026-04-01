import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  createProjectService,
  deleteProjectService,
  getProjectsService,
  updateProjectService,
} from "./project.service";

export const getProjects = async (req: AuthRequest, res: Response) => {
  const projects = await getProjectsService(req.userId!);
  res.status(200).json(projects);
};

export const createProject = async (req: AuthRequest, res: Response) => {
  const project = await createProjectService(req.userId!, req.body);
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
