import crypto from "crypto";
import jwt from "jsonwebtoken";
import { AppError } from "./AppError";

type TokenKind = "access" | "refresh";

type TokenPayload = {
  userId: string;
  email: string;
  type: TokenKind;
};

const getJwtSecret = (envKey: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET", fallbackKey: "JWT_SECRET") => {
  const secret = process.env[envKey] ?? process.env[fallbackKey];

  if (!secret) {
    throw new AppError(`${envKey} is not configured`, 500);
  }

  return secret;
};

export const signAccessToken = (userId: string, email: string) =>
  jwt.sign(
    { userId, email, type: "access" satisfies TokenKind },
    getJwtSecret("JWT_ACCESS_SECRET", "JWT_SECRET"),
    { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? "15m") as jwt.SignOptions["expiresIn"] }
  );

export const signRefreshToken = (userId: string, email: string) =>
  jwt.sign(
    { userId, email, type: "refresh" satisfies TokenKind },
    getJwtSecret("JWT_REFRESH_SECRET", "JWT_SECRET"),
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"] }
  );

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, getJwtSecret("JWT_ACCESS_SECRET", "JWT_SECRET")) as TokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, getJwtSecret("JWT_REFRESH_SECRET", "JWT_SECRET")) as TokenPayload;

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");
