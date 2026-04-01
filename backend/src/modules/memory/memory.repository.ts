import prisma from "../../config/database";
import { MemoryType } from "../../generated/prisma";

export const getMemoriesByUserId = async (userId: string) =>
  prisma.memory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

export const findMemoryById = async (id: string) =>
  prisma.memory.findUnique({
    where: { id },
  });

export const createMemoryDb = async (data: {
  userId: string;
  type: MemoryType;
  value: string;
}) =>
  prisma.memory.create({
    data,
  });

export const updateMemoryDb = async (
  id: string,
  data: {
    type: MemoryType;
    value: string;
  }
) =>
  prisma.memory.update({
    where: { id },
    data,
  });

export const deleteMemoryDb = async (id: string) =>
  prisma.memory.delete({
    where: { id },
  });
