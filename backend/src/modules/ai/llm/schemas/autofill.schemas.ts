import { z } from "zod";
import { RagChunkType } from "../../rag.service";

// ─── Normalized Field ───────────────────────────────────────────────────────

export type FieldComplexity = "deterministic" | "retrieval" | "reasoning" | "unresolved";
export type AutofillContextMode = "rag" | "full";

export interface NormalizedField {
  key: string;           // selector | name | label | id
  id?: string;           // original DOM element id (from extension)
  label: string;
  placeholder?: string;
  name?: string;
  type?: string;
  inputType?: string;
  required?: boolean;
  options?: string[];
  selector?: string;
  formId?: string;
  role?: string;
  tag?: string;
  complexity?: FieldComplexity;
  maxLength?: number;       // HTML maxlength attribute
  minLength?: number;       // HTML minlength attribute
  helpText?: string;        // aria-describedby text or nearby help text
  sectionHeading?: string;  // nearest section heading (h2, h3, legend, fieldset label)
  rawHtml?: string;         // raw DOM HTML for ambiguous fields
}

// ─── Retrieved Chunk ────────────────────────────────────────────────────────

export interface RetrievedChunk {
  id: string;
  chunkType: RagChunkType;
  title?: string;
  priority: number;
  score: number;
  content: string;
}

// ─── Fill Action ─────────────────────────────────────────────────────────────

export interface FillAction {
  group: string;          // e.g. "identity", "motivation", "work_history"
  fieldKeys: string[];
  strategy: "exact" | "semantic" | "hybrid" | "compose";
  retrievalQuery?: string;
}

// ─── Tool Trace ───────────────────────────────────────────────────────────────

export interface ToolInvocationTrace {
  toolName: string;
  fieldKey?: string;
  durationMs: number;
}

// ─── Main Graph State ─────────────────────────────────────────────────────────

export interface AutofillGraphState {
  userId: string;
  sessionId: string;
  domain?: string;
  formId?: string;
  contextMode: AutofillContextMode;
  fields: NormalizedField[];
  currentFormState: Record<string, string>;
  deterministicAnswers: Record<string, string>;
  pendingFields: NormalizedField[];
  retrievedContext: RetrievedChunk[];
  plannedActions: FillAction[];
  generatedAnswers: Record<string, string>;
  validatedAnswers: Record<string, string>;
  unresolvedFields: Array<{ fieldKey: string; reason: string }>;
  repairAttempts: number;
  toolTrace: ToolInvocationTrace[];
  warnings: string[];
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  userProfileCache?: string;
}

// ─── Output Contract (payload sent back to extension) ────────────────────────

export interface AutofillResponse {
  answers: Record<string, string>;
  unresolved: Array<{ fieldKey: string; reason: string }>;
  warnings: string[];
  trace: {
    usedRag: boolean;
    contextMode: AutofillContextMode;
    usedTools: string[];
    tokenUsage?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
}

// ─── Zod validation schemas ───────────────────────────────────────────────────

export const GeneratedAnswersSchema = z.record(z.string(), z.string());

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  issues: z.array(
    z.object({
      fieldKey: z.string(),
      reason: z.string(),
    })
  ),
  validatedAnswers: z.record(z.string(), z.string()),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;
