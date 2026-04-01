import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  createMemoryService,
  deleteMemoryService,
  getMemoriesService,
  updateMemoryService,
} from "./memory.service";

export const getMemories = async (req: AuthRequest, res: Response) => {
  const memories = await getMemoriesService(req.userId!);
  res.status(200).json(memories);
};

export const createMemory = async (req: AuthRequest, res: Response) => {
  const memory = await createMemoryService(req.userId!, req.body);
  res.status(201).json(memory);
};

export const updateMemory = async (req: AuthRequest, res: Response) => {
  const memory = await updateMemoryService(req.userId!, req.params.id, req.body);
  res.status(200).json(memory);
};

export const deleteMemory = async (req: AuthRequest, res: Response) => {
  const result = await deleteMemoryService(req.userId!, req.params.id);
  res.status(200).json(result);
};
