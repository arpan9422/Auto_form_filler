import { AppError } from "../../utils/AppError";
import { scheduleUserKnowledgeSync } from "../ai/rag.service";
import {
  createAnswerDb,
  deleteAnswerDb,
  findAnswerById,
  getAnswersByUserId,
  updateAnswerDb,
} from "./answer.repository";

type AnswerPayload = {
  title: string;
  category: string;
  answer: string;
};

const normalizeAnswerPayload = (data: AnswerPayload) => ({
  title: data.title.trim(),
  category: data.category.trim(),
  answer: data.answer.trim(),
});

export const getAnswersService = async (userId: string) => getAnswersByUserId(userId);

export const createAnswerService = async (userId: string, data: AnswerPayload) => {
  const answer = await createAnswerDb({
    userId,
    ...normalizeAnswerPayload(data),
  });

  scheduleUserKnowledgeSync(userId);
  return answer;
};

export const updateAnswerService = async (
  userId: string,
  id: string,
  data: AnswerPayload
) => {
  const answer = await findAnswerById(id);

  if (!answer || answer.userId !== userId) {
    throw new AppError("Answer not found", 404);
  }

  const updatedAnswer = await updateAnswerDb(id, normalizeAnswerPayload(data));
  scheduleUserKnowledgeSync(userId);

  return updatedAnswer;
};

export const deleteAnswerService = async (userId: string, id: string) => {
  const answer = await findAnswerById(id);

  if (!answer || answer.userId !== userId) {
    throw new AppError("Answer not found", 404);
  }

  await deleteAnswerDb(id);
  scheduleUserKnowledgeSync(userId);

  return {
    message: "Answer deleted successfully",
  };
};
