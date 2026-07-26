import { v4 as uuidv4 } from "uuid";
import { buildRefineGraph } from "../graphs/refine.graph";
import { prisma } from "../../../../config/database";

const refineGraph = buildRefineGraph();

export interface RefineAgentInput {
  userId: string;
  instruction: string;
  currentFormState: Record<string, string>;
  sessionId?: string;
}

/**
 * Run the LangGraph refinement pipeline.
 *
 * Returns only the fields that need to be updated based on the user's instruction.
 */
export async function runRefineAgent(
  input: RefineAgentInput
): Promise<Record<string, string>> {
  const sessionId = input.sessionId ?? uuidv4();

  let rawHtml: string | undefined;
  let originalFields: any[] = [];

  if (input.sessionId) {
    try {
      const session = await prisma.formSession.findUnique({
        where: { sessionId: input.sessionId }
      });
      if (session) {
        rawHtml = session.rawHtml ?? undefined;
        originalFields = (session.fields as any[]) ?? [];
      }
    } catch (err) {
      console.warn("[FormPilot] Failed to fetch FormSession for refine:", err);
    }
  }

  const finalState = await refineGraph.invoke({
    userId: input.userId,
    sessionId,
    instruction: input.instruction,
    currentState: input.currentFormState,
    retrievedContext: [],
    rawHtml,
    originalFields,
    updatedFields: {},
    warnings: [],
  });

  return finalState.updatedFields ?? {};
}
