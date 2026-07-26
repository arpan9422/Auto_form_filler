import { z } from "zod";

export const recordAnalyticsSchema = z.object({
  body: z.object({
    platform: z.string().trim().min(1),
    websiteUrl: z.string().url().optional().or(z.literal('')),
    fieldsFilled: z.number().int().min(0),
    totalFields: z.number().int().min(0),
    timeSavedSec: z.number().int().min(0),
    tokensUsed: z.number().int().min(0).default(0),
    promptTokens: z.number().int().min(0).default(0),
    completionTokens: z.number().int().min(0).default(0),
    fieldsAnswered: z.any().optional(),
    fieldsUnanswered: z.any().optional(),
    aiEdits: z.number().int().min(0).default(0),
    acceptedDirect: z.boolean().default(true),
  }),
});
