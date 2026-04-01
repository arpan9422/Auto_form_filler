import prisma from "../../config/database";

export const getProjectsByUserId = async (userId: string) => {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const findProjectById = async (id: string) =>
  prisma.project.findUnique({
    where: { id },
  });

export const createProjectDb = async (data: {
  userId: string;
  name: string;
  description: string;
  projectLinks: string[];
  techStacks: string[];
}) =>
  prisma.project.create({
    data,
  });

export const updateProjectDb = async (
  id: string,
  data: {
    name: string;
    description: string;
    projectLinks: string[];
    techStacks: string[];
  }
) =>
  prisma.project.update({
    where: { id },
    data,
  });

export const deleteProjectDb = async (id: string) =>
  prisma.project.delete({
    where: { id },
  });
