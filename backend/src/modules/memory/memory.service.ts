import { MemoryType } from "../../generated/prisma";
import { AppError } from "../../utils/AppError";
import {
  createMemoryDb,
  deleteMemoryDb,
  findMemoryById,
  getMemoriesByUserId,
  updateMemoryDb,
} from "./memory.repository";

type MemoryPayload = {
  type: MemoryType;
  value: string;
};

const normalizeMemoryPayload = (data: MemoryPayload) => ({
  type: data.type,
  value: data.value.trim(),
});

export const getMemoriesService = async (userId: string) => getMemoriesByUserId(userId);

export const createMemoryService = async (userId: string, data: MemoryPayload) =>
  createMemoryDb({
    userId,
    ...normalizeMemoryPayload(data),
  });

export const updateMemoryService = async (
  userId: string,
  memoryId: string,
  data: MemoryPayload
) => {
  const memory = await findMemoryById(memoryId);

  if (!memory || memory.userId !== userId) {
    throw new AppError("Memory not found", 404);
  }

  return updateMemoryDb(memoryId, normalizeMemoryPayload(data));
};

export const deleteMemoryService = async (userId: string, memoryId: string) => {
  const memory = await findMemoryById(memoryId);

  if (!memory || memory.userId !== userId) {
    throw new AppError("Memory not found", 404);
  }

  await deleteMemoryDb(memoryId);

  return {
    message: "Memory deleted successfully",
  };
};
