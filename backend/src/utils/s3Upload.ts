import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, S3_BUCKET } from "../config/s3";
import { randomUUID } from "crypto";

const PRESIGN_EXPIRES_IN = 300; // 5 minutes

export function buildS3Key(userId: string, filename: string): string {
  const ext = filename.split(".").pop() ?? "pdf";
  return `resumes/${userId}/${randomUUID()}.${ext}`;
}

export function buildS3Url(key: string): string {
  return `https://${S3_BUCKET}.s3.${process.env.AWS_REGION ?? "ap-south-1"}.amazonaws.com/${key}`;
}

export async function generatePresignedUploadUrl(
  key: string,
  contentType = "application/pdf"
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRES_IN });
}

export async function deleteS3Object(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}

// Extract the S3 key from a full S3 URL
export function extractS3Key(url: string): string | null {
  try {
    const parsed = new URL(url);
    // pathname starts with '/', strip it
    return parsed.pathname.slice(1);
  } catch {
    return null;
  }
}
