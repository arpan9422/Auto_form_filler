import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import {
  createResumeService,
  deleteResumeService,

  getResumesService,
  setDefaultResumeService,
  updateResumeService,
} from "./resume.service";

export const getResumes = async (req: AuthRequest, res: Response) => {
  const resumes = await getResumesService(req.userId!);
  res.status(200).json(resumes);
};

export const uploadResume = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  
  const fileUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/resumes/${req.file.filename}`;
  const key = `resumes/${req.file.filename}`;
  
  res.status(200).json({ fileUrl, key });
};

export const createResume = async (req: AuthRequest, res: Response) => {
  const resume = await createResumeService(req.userId!, req.body);
  res.status(201).json(resume);
};

export const updateResume = async (req: AuthRequest, res: Response) => {
  const resume = await updateResumeService(req.userId!, req.params.id, req.body);
  res.status(200).json(resume);
};

export const deleteResume = async (req: AuthRequest, res: Response) => {
  const result = await deleteResumeService(req.userId!, req.params.id);
  res.status(200).json(result);
};

export const setDefaultResume = async (req: AuthRequest, res: Response) => {
  const resume = await setDefaultResumeService(req.userId!, req.params.id);
  res.status(200).json(resume);
};
