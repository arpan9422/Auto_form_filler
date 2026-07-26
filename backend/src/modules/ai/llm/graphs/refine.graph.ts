import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import { queryContext, inferRelevantChunkTypes } from "../../rag.service";
import { getUserById } from "../../../user/user.repository";
import { getReasoningModel } from "../models/chatModels";

// ─── State ────────────────────────────────────────────────────────────────────

const RefineState = Annotation.Root({
  userId:         Annotation<string>,
  sessionId:      Annotation<string>,
  instruction:    Annotation<string>,
  currentState:   Annotation<Record<string, string>>,
  retrievedContext: Annotation<string[]>,
  rawHtml:        Annotation<string | undefined>,
  originalFields: Annotation<unknown[]>,
  updatedFields:  Annotation<Record<string, string>>,
  warnings:       Annotation<string[]>,
});

type State = typeof RefineState.State;

// ─── Node 1: retrieve_refine_context ─────────────────────────────────────────

async function retrieveRefineContext(state: State): Promise<Partial<State>> {
  console.log("[refine.graph] Node: retrieve_refine_context");
  const seed = `${state.instruction}\n${Object.keys(state.currentState).join(". ")}`;
  const types = inferRelevantChunkTypes(seed);
  const chunks = await queryContext(seed, state.userId, { topK: 6, types });
  return { retrievedContext: chunks };
}

// ─── Node 2: compose_refinement ───────────────────────────────────────────────

async function composeRefinement(state: State): Promise<Partial<State>> {
  console.log("[refine.graph] Node: compose_refinement");
  const user = await getUserById(state.userId);
  const model = getReasoningModel();

  const prompt = `You are an AI form assistant.

User Profile: ${JSON.stringify(user ?? {}, null, 2)}

Relevant Context:
${state.retrievedContext.join("\n\n")}

Current Form Data:
${JSON.stringify(state.currentState, null, 2)}

Original Form Fields Detected:
${JSON.stringify(state.originalFields ?? [], null, 2)}

Raw Form HTML:
${state.rawHtml ? "```html\n" + state.rawHtml + "\n```" : "(Not available)"}

User Instruction: ${state.instruction}

Rules:
1. Only update fields relevant to the instruction.
2. Never invent facts.
3. The keys in your returned JSON MUST exactly match either a "key" or "selector" from "Original Form Fields Detected" or a key present in "Current Form Data". NEVER invent your own keys like "location" or "name". You must use the exact CSS selector or identifier provided.
4. Return ONLY valid JSON: { "fieldKey": "updated_value" }`;

  try {
    const result = await model.invoke(prompt);
    const content = result.content as string;
    let parsed: Record<string, string> = {};

    try {
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON from the response
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    return { updatedFields: parsed };
  } catch (err) {
    console.error("[refine.graph] compose_refinement error:", err);
    return { updatedFields: {} };
  }
}

// ─── Node 3: log_refine ───────────────────────────────────────────────────────

async function logRefine(state: State): Promise<Partial<State>> {
  console.log("[refine.graph] Node: log_refine");
  console.info("[refine.graph] refinement complete", {
    sessionId: state.sessionId,
    updatedCount: Object.keys(state.updatedFields).length,
  });
  return {};
}

// ─── Build Graph ──────────────────────────────────────────────────────────────

export function buildRefineGraph() {
  const graph = new StateGraph(RefineState)
    .addNode("retrieve_refine_context", retrieveRefineContext)
    .addNode("compose_refinement",      composeRefinement)
    .addNode("log_refine",              logRefine)

    .addEdge(START,                      "retrieve_refine_context")
    .addEdge("retrieve_refine_context",  "compose_refinement")
    .addEdge("compose_refinement",       "log_refine")
    .addEdge("log_refine",               END);

  return graph.compile();
}
