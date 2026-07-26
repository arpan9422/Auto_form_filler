import { v4 as uuidv4 } from "uuid";
import { buildAutofillGraph } from "../graphs/autofill.graph";
import { AutofillContextMode, AutofillResponse, NormalizedField } from "../schemas/autofill.schemas";
import { prisma } from "../../../../config/database";

// Compile once at module load — this is safe for long-running servers
const autofillGraph = buildAutofillGraph();

// Default timeout for the graph execution (300 seconds for slow massive models)
const GRAPH_TIMEOUT_MS = 300_000;

export interface AutofillAgentInput {
  userId: string;
  fields: NormalizedField[];
  currentFormState?: Record<string, string>;
  domain?: string;
  formId?: string;
  sessionId?: string;
  contextMode?: AutofillContextMode;
  rawHtml?: string;
  url?: string;
}

/**
 * Run the full LangGraph autofill pipeline.
 *
 * Returns a structured AutofillResponse ready to be sent back to the extension.
 * Includes timeout guard and graceful degradation on failure.
 */
export async function runAutofillAgent(input: AutofillAgentInput): Promise<AutofillResponse> {
  const sessionId = input.sessionId ?? uuidv4();

  const initialState = {
    userId: input.userId,
    sessionId,
    domain: input.domain,
    formId: input.formId,
    contextMode: input.contextMode ?? "rag" as AutofillContextMode,
    fields: input.fields,
    currentFormState: input.currentFormState ?? {},
    deterministicAnswers: {} as Record<string, string>,
    pendingFields: [] as NormalizedField[],
    retrievedContext: [],
    plannedActions: [],
    generatedAnswers: {} as Record<string, string>,
    validatedAnswers: {} as Record<string, string>,
    unresolvedFields: [] as Array<{ fieldKey: string; reason: string }>,
    repairAttempts: 0,
    toolTrace: [],
    warnings: [] as string[],
    tokenUsage: undefined,
    userProfileCache: undefined,
  };

  // Persist the FormSession so refine can use it later
  try {
    await prisma.formSession.upsert({
      where: { sessionId },
      update: {
        url: input.url,
        fields: input.fields as any,
        rawHtml: input.rawHtml,
      },
      create: {
        userId: input.userId,
        sessionId,
        url: input.url,
        fields: input.fields as any,
        rawHtml: input.rawHtml,
      },
    });
  } catch (dbErr) {
    console.warn("[FormPilot] Failed to save FormSession:", dbErr);
  }

  try {
    // Race the graph against a timeout
    const graphPromise = autofillGraph.invoke(initialState);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Graph execution timed out")), GRAPH_TIMEOUT_MS)
    );

    const finalState = await Promise.race([graphPromise, timeoutPromise]);

    const usedTools = Array.from(
      new Set(finalState.toolTrace.map((t: { toolName: string }) => t.toolName))
    );

    const unresolved = finalState.unresolvedFields ?? [];

    // Save unresolved fields as new blank questions in AnswerLibrary
    if (unresolved.length > 0) {
      try {
        const existingAnswers = await prisma.answerLibrary.findMany({
          where: { userId: input.userId },
          select: { title: true }
        });
        const existingTitles = new Set(existingAnswers.map(a => a.title.toLowerCase()));

        for (const unres of unresolved) {
          const field = input.fields.find(f => (f.selector || f.name || f.label || f.id) === unres.fieldKey);
          const title = field?.label || unres.fieldKey;

          if (title && title.length > 2 && !existingTitles.has(title.toLowerCase())) {
            await prisma.answerLibrary.create({
              data: {
                userId: input.userId,
                title: title.slice(0, 200),
                category: "Unanswered",
                answer: "",
              }
            });
            existingTitles.add(title.toLowerCase());
          }
        }
      } catch (err) {
        console.warn("[FormPilot] Failed to save unresolved fields to AnswerLibrary:", err);
      }
    }

    return {
      answers: finalState.validatedAnswers ?? {},
      unresolved,
      warnings: finalState.warnings ?? [],
      trace: {
        usedRag: finalState.contextMode === "rag" && finalState.retrievedContext?.length > 0,
        contextMode: finalState.contextMode ?? "rag",
        usedTools,
        tokenUsage: finalState.tokenUsage,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[autofillAgent] Graph execution failed: ${errorMessage}`);

    // Graceful degradation: return whatever deterministic answers we can get
    // by running just the lightweight deterministic resolver
    try {
      const { generateFormFillService } = await import("../../ai.service");
      const deterministicAnswers = await generateFormFillService(input.fields, input.userId);

      return {
        answers: deterministicAnswers as Record<string, string>,
        unresolved: [],
        warnings: [
          `Agent pipeline failed (${errorMessage}) — returned deterministic answers only. Complex fields may be missing.`,
        ],
        trace: {
          usedRag: false,
          contextMode: input.contextMode ?? "rag",
          usedTools: ["deterministic_fallback"],
        },
      };
    } catch (fallbackError) {
      // Even the deterministic fallback failed — return empty
      console.error("[autofillAgent] Deterministic fallback also failed:", fallbackError);
      return {
        answers: {},
        unresolved: input.fields.map((f) => ({
          fieldKey: f.selector || f.name || f.label || f.id || "unknown",
          reason: "Agent pipeline and fallback both failed",
        })),
        warnings: [`Complete pipeline failure: ${errorMessage}`],
        trace: {
          usedRag: false,
          contextMode: input.contextMode ?? "rag",
          usedTools: [],
        },
      };
    }
  }
}
