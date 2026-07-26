import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import { AutofillContextMode, AutofillGraphState, NormalizedField, RetrievedChunk, FillAction, ToolInvocationTrace } from "../schemas/autofill.schemas";
import { generateFormFillService } from "../../ai.service";
import { queryContext, inferRelevantChunkTypes } from "../../rag.service";
import { getUserById } from "../../../user/user.repository";
import { getBaseFastModel, getReasoningModel } from "../models/chatModels";
import { intakePrompt, plannerPrompt, composerPrompt, validatorPrompt } from "../prompts/autofill.prompts";
import { getDomainToneBlock } from "../prompts/humanVoice.prompts";

// ─── LangGraph State Annotation ───────────────────────────────────────────────

const AutofillState = Annotation.Root({
  userId:               Annotation<string>,
  sessionId:            Annotation<string>,
  domain:               Annotation<string | undefined>,
  formId:               Annotation<string | undefined>,
  contextMode:          Annotation<AutofillContextMode>,
  fields:               Annotation<NormalizedField[]>,
  currentFormState:     Annotation<Record<string, string>>,
  deterministicAnswers: Annotation<Record<string, string>>,
  pendingFields:        Annotation<NormalizedField[]>,
  retrievedContext:     Annotation<RetrievedChunk[]>,
  plannedActions:       Annotation<FillAction[]>,
  generatedAnswers:     Annotation<Record<string, string>>,
  validatedAnswers:     Annotation<Record<string, string>>,
  unresolvedFields:     Annotation<Array<{ fieldKey: string; reason: string }>>,
  repairAttempts:       Annotation<number>,
  toolTrace:            Annotation<ToolInvocationTrace[]>,
  warnings:             Annotation<string[]>,
  tokenUsage: Annotation<{ prompt: number; completion: number; total: number }>({
    reducer: (a, b) => ({
      prompt: (a?.prompt ?? 0) + (b?.prompt ?? 0),
      completion: (a?.completion ?? 0) + (b?.completion ?? 0),
      total: (a?.total ?? 0) + (b?.total ?? 0),
    }),
    default: () => ({ prompt: 0, completion: 0, total: 0 }),
  }),
  userProfileCache:     Annotation<string | undefined>,   // serialised user data for reuse
});

type State = typeof AutofillState.State;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractTokenUsage(result: any) {
  let prompt = 0, completion = 0, total = 0;
  if (result?.usage_metadata) {
    prompt = result.usage_metadata.input_tokens ?? 0;
    completion = result.usage_metadata.output_tokens ?? 0;
    total = result.usage_metadata.total_tokens ?? 0;
  } else if (result?.response_metadata?.tokenUsage) {
    prompt = result.response_metadata.tokenUsage.promptTokens ?? 0;
    completion = result.response_metadata.tokenUsage.completionTokens ?? 0;
    total = result.response_metadata.tokenUsage.totalTokens ?? 0;
  }
  return { prompt, completion, total };
}

function safeParse<T>(json: string | null | undefined, fallback: T): T {
  try { return json ? JSON.parse(json) : fallback; }
  catch { return fallback; }
}

function normalizeField(f: NormalizedField): NormalizedField {
  return {
    ...f,
    key: f.selector || f.name || f.label || f.id || uuidv4(),
  };
}

function addTrace(
  trace: ToolInvocationTrace[],
  toolName: string,
  start: number,
  fieldKey?: string
): ToolInvocationTrace[] {
  return [...trace, { toolName, fieldKey, durationMs: Date.now() - start }];
}

function stringifyContext(value: unknown) {
  return JSON.stringify(
    value,
    (_key, nestedValue) => nestedValue instanceof Date ? nestedValue.toISOString() : nestedValue,
    2
  );
}

function buildFullContextChunks(user: Awaited<ReturnType<typeof getUserById>>): RetrievedChunk[] {
  if (!user) {
    return [];
  }

  const profile = {
    id: user.id,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    bio: user.bio,
    skills: user.skills,
  };

  const chunks: RetrievedChunk[] = [
    {
      id: "full-profile",
      chunkType: "PERSONAL",
      title: "Complete user profile",
      priority: 10,
      score: 1,
      content: `User Profile:\n${stringifyContext(profile)}\n\nLinks:\n${stringifyContext(user.links)}\n\nAddresses:\n${stringifyContext(user.addresses)}`,
    },
    {
      id: "full-education",
      chunkType: "EDUCATION",
      title: "Complete education history",
      priority: 8,
      score: 1,
      content: `Education:\n${stringifyContext(user.educations)}`,
    },
    {
      id: "full-work",
      chunkType: "EXPERIENCE",
      title: "Complete work history",
      priority: 8,
      score: 1,
      content: `Work History:\n${stringifyContext(user.works)}`,
    },
    {
      id: "full-projects",
      chunkType: "PROJECT",
      title: "Complete project history",
      priority: 8,
      score: 1,
      content: `Projects:\n${stringifyContext(user.projects)}`,
    },
    {
      id: "full-answers",
      chunkType: "ANSWER",
      title: "Complete answer library",
      priority: 9,
      score: 1,
      content: `Reusable Answers:\n${stringifyContext(user.answers)}`,
    },
    {
      id: "full-resumes",
      chunkType: "RESUME",
      title: "Complete resume metadata",
      priority: 7,
      score: 1,
      content: `Resumes:\n${stringifyContext(user.resumes)}`,
    },
  ];

  return chunks.filter((chunk) => chunk.content.trim().length > 0);
}

// ─── Node 1: ingest_request ───────────────────────────────────────────────────

async function ingestRequest(state: State): Promise<Partial<State>> {
  console.log("[autofill.graph] Node: ingest_request");
  const fields = state.fields.map(normalizeField);
  return {
    fields,
    sessionId: state.sessionId || uuidv4(),
    contextMode: state.contextMode ?? "rag",
  };
}

// ─── Node 2: classify_fields ──────────────────────────────────────────────────

async function classifyFields(state: State): Promise<Partial<State>> {
  console.log("[autofill.graph] Node: classify_fields");
  const start = Date.now();
  const model = getBaseFastModel();
  const chain = intakePrompt.pipe(model);

  let domain = state.domain ?? "generic";
  let classifiedFields = state.fields;
  let usage = { prompt: 0, completion: 0, total: 0 };

  try {
    const result = await chain.invoke({
      fields: JSON.stringify(state.fields, null, 2),
      currentFormState: JSON.stringify(state.currentFormState, null, 2),
    });
    
    usage = extractTokenUsage(result);

    const parsed = safeParse<{
      domain: string;
      fieldClassifications: Array<{ key: string; complexity: string }>;
    }>(result.content as string, { domain: "generic", fieldClassifications: [] });

    domain = parsed.domain ?? "generic";
    const classMap = new Map(parsed.fieldClassifications.map((c) => [c.key, c.complexity]));

    classifiedFields = state.fields.map((f) => ({
      ...f,
      complexity: (classMap.get(f.key) as NormalizedField["complexity"]) ?? "unresolved",
    }));
  } catch (err) {
    console.error("[autofill.graph] classify_fields error:", err);
    // Fallback: mark all non-trivial fields as retrieval
    classifiedFields = state.fields.map((f) => ({ ...f, complexity: "retrieval" as const }));
  }

  const pendingFields = classifiedFields.filter(
    (f) => f.complexity !== "deterministic"
  );

  return {
    domain,
    fields: classifiedFields,
    pendingFields,
    tokenUsage: usage,
    toolTrace: addTrace(state.toolTrace, "classify_fields", start),
  };
}

// ─── Node 3: resolve_easy_fields ─────────────────────────────────────────────

async function resolveEasyFields(state: State): Promise<Partial<State>> {
  console.log("[autofill.graph] Node: resolve_easy_fields");
  const start = Date.now();
  const deterministicFields = state.fields.filter((f) => f.complexity === "deterministic");

  if (!deterministicFields.length) {
    return { deterministicAnswers: {}, toolTrace: addTrace(state.toolTrace, "resolve_easy_fields", start) };
  }

  const answers = await generateFormFillService(deterministicFields, state.userId);

  return {
    deterministicAnswers: answers as Record<string, string>,
    toolTrace: addTrace(state.toolTrace, "resolve_easy_fields", start),
  };
}

// ─── Node 4: retrieve_context ─────────────────────────────────────────────────

async function retrieveContext(state: State): Promise<Partial<State>> {
  console.log("[autofill.graph] Node: retrieve_context");
  const start = Date.now();

  if (!state.pendingFields.length) {
    return { retrievedContext: [], toolTrace: addTrace(state.toolTrace, "retrieve_context", start) };
  }

  if (state.contextMode === "full") {
    const user = await getUserById(state.userId);
    const userProfileStr = stringifyContext(user ?? {});

    return {
      retrievedContext: buildFullContextChunks(user),
      userProfileCache: userProfileStr,
      toolTrace: addTrace(state.toolTrace, "load_full_context", start),
    };
  }

  // ── Per-group retrieval using planned actions ──────────────────────────────
  const allChunks: RetrievedChunk[] = [];
  const seenChunkContent = new Set<string>();

  // If we have planned actions with retrieval queries, use them for targeted retrieval
  if (state.plannedActions.length > 0) {
    for (const action of state.plannedActions) {
      const query = action.retrievalQuery?.trim();
      if (!query) continue;

      const types = inferRelevantChunkTypes(query);
      const rawChunks = await queryContext(query, state.userId, { topK: 5, types });

      for (const content of rawChunks) {
        // Deduplicate by content hash (first 100 chars as key)
        const key = content.substring(0, 100).trim();
        if (!seenChunkContent.has(key)) {
          seenChunkContent.add(key);
          allChunks.push({
            id: `ctx-${action.group}-${allChunks.length}`,
            chunkType: types[0] ?? "PERSONAL",
            priority: 5,
            score: 1,
            content,
          });
        }
      }
    }
  }

  // Fallback: if no per-group retrieval produced results, do the aggregated query
  if (allChunks.length === 0) {
    const fieldLabels = state.pendingFields.map((f) => f.label).join(" ");
    const retrievalQuery = `${fieldLabels} ${state.domain ?? ""}`.trim();
    const types = inferRelevantChunkTypes(retrievalQuery);

    const rawChunks = await queryContext(retrievalQuery, state.userId, { topK: 8, types });

    for (let i = 0; i < rawChunks.length; i++) {
      allChunks.push({
        id: `ctx-${i}`,
        chunkType: types[i % types.length] ?? "PERSONAL",
        priority: 5,
        score: 1,
        content: rawChunks[i],
      });
    }
  }

  console.log("[autofill.graph] RAG retrieved context:", allChunks);

  return {
    retrievedContext: allChunks,
    toolTrace: addTrace(state.toolTrace, "retrieve_context", start),
  };
}

// ─── Node 5: plan_fill_actions ────────────────────────────────────────────────

async function planFillActions(state: State): Promise<Partial<State>> {
  console.log("[autofill.graph] Node: plan_fill_actions");
  const start = Date.now();
  const model = getBaseFastModel();
  const chain = plannerPrompt.pipe(model);

  let plannedActions: FillAction[] = [];
  let usage = { prompt: 0, completion: 0, total: 0 };

  try {
    const result = await chain.invoke({
      pendingFields: JSON.stringify(state.pendingFields, null, 2),
      retrievedContext: state.retrievedContext.map((c) => c.content).join("\n\n"),
      domain: state.domain ?? "generic",
    });
    
    usage = extractTokenUsage(result);

    plannedActions = safeParse<FillAction[]>(result.content as string, []);
  } catch (err) {
    console.error("[autofill.graph] plan_fill_actions error:", err);
    // Fallback: one action per pending field
    plannedActions = state.pendingFields.map((f) => ({
      group: f.complexity === "reasoning" ? "compose" : "retrieve",
      fieldKeys: [f.key],
      strategy: (f.complexity === "reasoning" ? "compose" : "semantic") as FillAction["strategy"],
    }));
  }

  return {
    plannedActions,
    tokenUsage: usage,
    toolTrace: addTrace(state.toolTrace, "plan_fill_actions", start),
  };
}

// ─── Node 6: compose_answers ──────────────────────────────────────────────────

async function composeAnswers(state: State): Promise<Partial<State>> {
  console.log("[autofill.graph] Node: compose_answers");
  const start = Date.now();

  // Cache user profile to avoid repeated DB calls
  let userProfileStr = state.userProfileCache;
  if (!userProfileStr) {
    const user = await getUserById(state.userId);
    userProfileStr = JSON.stringify(user ?? {});
  }

  const model = getReasoningModel();
  const chain = composerPrompt.pipe(model);

  let generatedAnswers: Record<string, string> = {};
  let usage = { prompt: 0, completion: 0, total: 0 };

  try {
    const result = await chain.invoke({
      userProfile: userProfileStr,
      retrievedContext: state.retrievedContext.map((c) => c.content).join("\n\n"),
      fields: JSON.stringify(state.pendingFields, null, 2),
      domain: state.domain ?? "generic",
      domainTone: getDomainToneBlock(state.domain ?? "generic"),
    });
    
    usage = extractTokenUsage(result);

    const parsed = safeParse<Record<string, string | null>>(result.content as string, {});

    // Filter out null values — leave field unresolved
    for (const [key, val] of Object.entries(parsed)) {
      if (val !== null && val !== undefined && val !== "") {
        generatedAnswers[key] = String(val);
      }
    }
  } catch (err) {
    console.error("[autofill.graph] compose_answers error:", err);
  }

  return {
    generatedAnswers,
    userProfileCache: userProfileStr,
    tokenUsage: usage,
    toolTrace: addTrace(state.toolTrace, "compose_answers", start),
  };
}

// ─── Node 7: validate_answers ─────────────────────────────────────────────────

async function validateAnswers(state: State): Promise<Partial<State>> {
  console.log("[autofill.graph] Node: validate_answers");
  const start = Date.now();

  const combinedAnswers = { ...state.deterministicAnswers, ...state.generatedAnswers };

  if (!Object.keys(state.generatedAnswers).length) {
    return {
      validatedAnswers: combinedAnswers,
      toolTrace: addTrace(state.toolTrace, "validate_answers", start),
    };
  }

  const userProfileStr = state.userProfileCache ?? "{}";
  const model = getBaseFastModel();
  const chain = validatorPrompt.pipe(model);

  let validatedAnswers = { ...state.deterministicAnswers };
  let unresolvedFields = [...state.unresolvedFields];
  let warnings = [...state.warnings];
  let usage = { prompt: 0, completion: 0, total: 0 };

  try {
    const result = await chain.invoke({
      userProfile: userProfileStr,
      retrievedContext: state.retrievedContext.map((c) => c.content).join("\n\n"),
      generatedAnswers: JSON.stringify(state.generatedAnswers, null, 2),
      fields: JSON.stringify(state.pendingFields, null, 2),
    });
    
    usage = extractTokenUsage(result);

    const parsed = safeParse<{
      valid: boolean;
      issues: Array<{ fieldKey: string; reason: string }>;
      validatedAnswers: Record<string, string>;
    }>(result.content as string, {
      valid: true,
      issues: [],
      validatedAnswers: state.generatedAnswers,
    });

    // Merge validated answers on top of deterministic ones
    validatedAnswers = { ...validatedAnswers, ...parsed.validatedAnswers };

    if (!parsed.valid) {
      for (const issue of parsed.issues) {
        // Only add if not already answered deterministically
        if (!state.deterministicAnswers[issue.fieldKey]) {
          unresolvedFields.push(issue);
        }
      }
    }
  } catch (err) {
    console.error("[autofill.graph] validate_answers error:", err);
    // Fallback: trust generated answers
    validatedAnswers = { ...validatedAnswers, ...state.generatedAnswers };
  }

  // Dropdown constraint check
  for (const field of state.pendingFields) {
    const key = field.key;
    const answer = validatedAnswers[key];
    if (field.options?.length && answer) {
      const normalized = answer.toLowerCase().trim();
      const matched = field.options.find((o) => o.toLowerCase().trim() === normalized);
      if (!matched) {
        const partial = field.options.find((o) => o.toLowerCase().includes(normalized) || normalized.includes(o.toLowerCase()));
        if (partial) {
          validatedAnswers[key] = partial;
          warnings.push(`Matched closest dropdown option "${partial}" for field "${field.label}"`);
        } else {
          delete validatedAnswers[key];
          unresolvedFields.push({ fieldKey: key, reason: `No matching dropdown option for value "${answer}"` });
        }
      }
    }
  }

  return {
    validatedAnswers,
    unresolvedFields,
    warnings,
    tokenUsage: usage,
    toolTrace: addTrace(state.toolTrace, "validate_answers", start),
  };
}

// ─── Node 8: repair_answers ───────────────────────────────────────────────────

async function repairAnswers(state: State): Promise<Partial<State>> {
  console.log("[autofill.graph] Node: repair_answers");
  const start = Date.now();

  // Determine which fields still need repair
  const failedKeys = state.unresolvedFields
    .filter((u) => !state.deterministicAnswers[u.fieldKey])
    .map((u) => u.fieldKey);

  if (!failedKeys.length) {
    return { toolTrace: addTrace(state.toolTrace, "repair_answers_skip", start) };
  }

  const fieldsToRepair = state.pendingFields.filter((f) => failedKeys.includes(f.key));
  const userProfileStr = state.userProfileCache ?? "{}";
  const model = getReasoningModel();
  const chain = composerPrompt.pipe(model);

  const validationFeedback = state.unresolvedFields
    .filter((u) => failedKeys.includes(u.fieldKey))
    .map((u) => `Field "${u.fieldKey}": ${u.reason}`)
    .join("\n");

  let repairedAnswers: Record<string, string> = {};
  let usage = { prompt: 0, completion: 0, total: 0 };

  try {
    const result = await chain.invoke({
      userProfile: userProfileStr,
      retrievedContext: [
        ...state.retrievedContext.map((c) => c.content),
        `\n\nValidation feedback:\n${validationFeedback}`,
      ].join("\n\n"),
      fields: JSON.stringify(fieldsToRepair, null, 2),
      domain: state.domain ?? "generic",
      domainTone: getDomainToneBlock(state.domain ?? "generic"),
    });
    
    usage = extractTokenUsage(result);

    const parsed = safeParse<Record<string, string | null>>(result.content as string, {});
    for (const [key, val] of Object.entries(parsed)) {
      if (val !== null && val !== undefined && val !== "") {
        repairedAnswers[key] = String(val);
      }
    }
  } catch (err) {
    console.error("[autofill.graph] repair_answers error:", err);
  }

  // Re-merge repaired answers; keep already-validated answers intact
  return {
    generatedAnswers: { ...state.generatedAnswers, ...repairedAnswers },
    // Clear unresolved so validation can re-run cleanly
    unresolvedFields: [],
    repairAttempts: state.repairAttempts + 1,
    tokenUsage: usage,
    toolTrace: addTrace(state.toolTrace, "repair_answers", start),
  };
}

// ─── Node 9: finalize_fill_plan ───────────────────────────────────────────────

async function finalizeFillPlan(state: State): Promise<Partial<State>> {
  // Merge deterministic + validated answers
  const finalAnswers = { ...state.deterministicAnswers, ...state.validatedAnswers };

  // Find fields that were never answered
  const answeredKeys = new Set(Object.keys(finalAnswers));
  const unresolvedFields = [
    ...state.unresolvedFields,
    ...state.pendingFields
      .filter((f) => !answeredKeys.has(f.key))
      .map((f) => ({ fieldKey: f.key, reason: "Insufficient user context to generate an answer" })),
  ];

  // Deduplicate unresolved AND remove if they are actually answered
  const seen = new Set<string>();
  const deduped = unresolvedFields.filter((u) => {
    if (answeredKeys.has(u.fieldKey)) return false; // Already answered
    if (seen.has(u.fieldKey)) return false;
    seen.add(u.fieldKey);
    return true;
  });

  return {
    validatedAnswers: finalAnswers,
    unresolvedFields: deduped,
    toolTrace: addTrace(state.toolTrace, "finalize_fill_plan", 0),
  };
}

// ─── Node 10: log_run ─────────────────────────────────────────────────────────

async function logRun(state: State): Promise<Partial<State>> {
  console.info("[autofill.graph] run complete", {
    sessionId: state.sessionId,
    userId: state.userId,
    domain: state.domain,
    totalFields: state.fields.length,
    answered: Object.keys(state.validatedAnswers).length,
    unresolved: state.unresolvedFields.length,
    tokenUsage: state.tokenUsage,
    toolTrace: state.toolTrace.map((t) => `${t.toolName}(${t.durationMs}ms)`).join(" → "),
  });
  return {};
}

// ─── Routing ──────────────────────────────────────────────────────────────────

function routeAfterEasyResolve(state: State): "plan_fill_actions" | "finalize_fill_plan" {
  return state.pendingFields.length > 0 ? "plan_fill_actions" : "finalize_fill_plan";
}

function routeAfterValidation(state: State): "repair_answers" | "finalize_fill_plan" {
  const hasFailedFields = state.unresolvedFields.some(
    (u) => !state.deterministicAnswers[u.fieldKey]
  );

  // Token budget guard — skip repair if we've already used a lot of tokens
  const TOKEN_BUDGET = 8000;
  const totalOutputTokens = state.tokenUsage?.completion ?? 0;
  if (totalOutputTokens > TOKEN_BUDGET) {
    console.warn(`[autofill.graph] Token budget exceeded (${totalOutputTokens} > ${TOKEN_BUDGET}), skipping repair`);
    return "finalize_fill_plan";
  }

  // Only repair once to avoid infinite loops
  if (hasFailedFields && state.repairAttempts < 1) {
    return "repair_answers";
  }
  return "finalize_fill_plan";
}

// ─── Build Graph ──────────────────────────────────────────────────────────────

export function buildAutofillGraph() {
  const graph = new StateGraph(AutofillState)
    .addNode("ingest_request",      ingestRequest)
    .addNode("classify_fields",     classifyFields)
    .addNode("resolve_easy_fields", resolveEasyFields)
    .addNode("plan_fill_actions",   planFillActions)
    .addNode("retrieve_context",    retrieveContext)
    .addNode("compose_answers",     composeAnswers)
    .addNode("validate_answers",    validateAnswers)
    .addNode("repair_answers",      repairAnswers)
    .addNode("finalize_fill_plan",  finalizeFillPlan)
    .addNode("log_run",             logRun)

    .addEdge(START,                    "ingest_request")
    .addEdge("ingest_request",         "classify_fields")
    .addEdge("classify_fields",        "resolve_easy_fields")
    .addConditionalEdges("resolve_easy_fields", routeAfterEasyResolve, {
      plan_fill_actions:  "plan_fill_actions",
      finalize_fill_plan: "finalize_fill_plan",
    })
    .addEdge("plan_fill_actions",      "retrieve_context")
    .addEdge("retrieve_context",       "compose_answers")
    .addEdge("compose_answers",        "validate_answers")
    .addConditionalEdges("validate_answers", routeAfterValidation, {
      repair_answers:     "repair_answers",
      finalize_fill_plan: "finalize_fill_plan",
    })
    .addEdge("repair_answers",         "validate_answers")
    .addEdge("finalize_fill_plan",     "log_run")
    .addEdge("log_run",                END);

  return graph.compile();
}
