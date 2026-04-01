import prisma from "../../config/database";

export const getAnswersByUserId = async (userId: string) => {
  return prisma.answerLibrary.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
};

export const findAnswerById = async (id: string) =>
  prisma.answerLibrary.findUnique({
    where: { id },
  });

export const createAnswerDb = async (data: {
  userId: string;
  title: string;
  category: string;
  answer: string;
}) =>
  prisma.answerLibrary.create({
    data,
  });

export const updateAnswerDb = async (
  id: string,
  data: {
    title: string;
    category: string;
    answer: string;
  }
) =>
  prisma.answerLibrary.update({
    where: { id },
    data,
  });

export const deleteAnswerDb = async (id: string) =>
  prisma.answerLibrary.delete({
    where: { id },
  });
