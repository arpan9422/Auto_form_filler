import { Request, Response } from "express";
import {
  loginService,
  logoutService,
  refreshAccessTokenService,
  sendLoginOtpService,
  sendSignupOtpService,
  signupService,
} from "./auth.service";

export const sendSignupOtp = async (req: Request, res: Response) => {
  const result = await sendSignupOtpService(req.body.email);
  res.status(200).json(result);
};

export const signup = async (req: Request, res: Response) => {
  const result = await signupService(req.body);
  res.status(201).json(result);
};

export const sendLoginOtp = async (req: Request, res: Response) => {
  const result = await sendLoginOtpService(req.body.email);
  res.status(200).json(result);
};

export const login = async (req: Request, res: Response) => {
  const result = await loginService(req.body);
  res.status(200).json(result);
};

export const refreshToken = async (req: Request, res: Response) => {
  const result = await refreshAccessTokenService(req.body.refreshToken);
  res.status(200).json(result);
};

export const logout = async (req: Request, res: Response) => {
  const result = await logoutService(req.body.refreshToken);
  res.status(200).json(result);
};
