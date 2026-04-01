import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  createAnswerService,
  deleteAnswerService,
  getAnswersService,
  updateAnswerService,
} from "./answer.service";

export const getAnswers = async (req: AuthRequest, res: Response) => {
  const answers = await getAnswersService(req.userId!);
  res.status(200).json(answers);
};

export const createAnswer = async (req: AuthRequest, res: Response) => {
  const answer = await createAnswerService(req.userId!, req.body);
  res.status(201).json(answer);
};

export const updateAnswer = async (req: AuthRequest, res: Response) => {
  const answer = await updateAnswerService(req.userId!, req.params.id, req.body);
  res.status(200).json(answer);
};

export const deleteAnswer = async (req: AuthRequest, res: Response) => {
  const result = await deleteAnswerService(req.userId!, req.params.id);
  res.status(200).json(result);
};
