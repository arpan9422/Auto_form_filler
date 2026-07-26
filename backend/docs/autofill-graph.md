# Autofill Graph

`backend/src/modules/ai/llm/graphs/autofill.graph.ts` builds the LangGraph workflow that turns scraped form fields into validated autofill answers for a user.

At a high level, it:

1. Normalizes incoming form fields.
2. Classifies each field by difficulty.
3. Fills simple deterministic fields from existing user data.
4. Retrieves relevant user context from the RAG knowledge base.
5. Uses LLM prompts to compose answers for harder fields.
6. Validates generated answers against profile/context evidence and field constraints.
7. Repairs failed answers once.
8. Produces final answers plus unresolved fields, warnings, trace data, and token usage.

## Main Inputs

The graph state is defined with `Annotation.Root`. Important inputs are:

- `userId`: authenticated user whose profile and knowledge base should be used.
- `sessionId`: request/session identifier; generated if missing.
- `domain`: optional form domain, such as Workday, LinkedIn, Greenhouse, or generic.
- `formId`: optional form identifier.
- `contextMode`: `"rag"` by default, or `"full"` to bypass RAG and send all user context.
- `fields`: normalized DOM/form fields sent by the extension.
- `currentFormState`: values already present in the form.

Each field is represented as a `NormalizedField` with properties like `key`, `label`, `type`, `selector`, `required`, and `options`.

## Field Complexity

The classifier puts each field into one of four buckets:

- `deterministic`: can be filled directly from known user data, such as name, email, phone, links, GPA, etc.
- `retrieval`: needs semantic context from the user's knowledge base, such as project or work summaries.
- `reasoning`: needs composed writing or reasoning, such as motivation answers, cover letters, or "why this company" questions.
- `unresolved`: cannot be confidently mapped.

Only non-deterministic fields become `pendingFields`.

## Graph Flow

The compiled graph follows this route:

```text
START
  -> ingest_request
  -> classify_fields
  -> resolve_easy_fields
  -> retrieve_context OR load_full_context OR finalize_fill_plan
  -> plan_fill_actions
  -> compose_answers
  -> validate_answers
  -> repair_answers OR finalize_fill_plan
  -> log_run
  -> END
```

If there are no pending fields after deterministic filling, the graph skips RAG and LLM composition and goes straight to finalization.

## Node Responsibilities

### `ingest_request`

Normalizes every field and ensures each one has a stable `key`.

The key priority is:

```text
selector -> name -> label -> id -> generated uuid
```

It also creates a `sessionId` if the request did not provide one.

### `classify_fields`

Uses `intakePrompt` with the fast model from `getBaseFastModel()` to:

- infer the form domain,
- classify each field as deterministic, retrieval, reasoning, or unresolved.

If the LLM call or JSON parsing fails, it falls back to marking all fields as `retrieval`.

### `resolve_easy_fields`

Finds fields classified as `deterministic` and passes them to `generateFormFillService`.

The result is stored in `deterministicAnswers`.

### `retrieve_context`

Runs only when there are pending fields.

In default `contextMode: "rag"`, it builds one retrieval query from pending field labels and the inferred domain, then:

- calls `inferRelevantChunkTypes`,
- calls `queryContext`,
- wraps returned strings into `RetrievedChunk` objects.

This gives the later composer user-specific evidence from Chroma/RAG.

In `contextMode: "full"`, it skips vector search and loads the user's full profile record instead. That includes profile fields, links, addresses, education, work history, projects, answer library entries, and resume metadata. The full context is then passed to the planner, composer, validator, and repair step.

The agent endpoint accepts either:

```json
{ "contextMode": "full" }
```

or:

```json
{ "useRag": false }
```

Omitting both keeps the original RAG behavior.

### `plan_fill_actions`

Uses `plannerPrompt` with the fast model to group pending fields and decide strategies:

- `exact`
- `semantic`
- `hybrid`
- `compose`

The planned actions are saved in `plannedActions`. In the current file, these actions are produced and traced, but `compose_answers` still receives all pending fields together rather than executing each plan item separately.

### `compose_answers`

Uses the reasoning model from `getReasoningModel()` with `composerPrompt`.

It provides:

- cached user profile data from `getUserById`,
- retrieved RAG context,
- pending fields,
- domain.

The LLM must return JSON mapping field keys to values or `null`. Empty/null values are ignored so unsupported fields remain unresolved instead of being fabricated.

If the model response includes usage metadata, token counts are accumulated in `tokenUsage`.

### `validate_answers`

Combines deterministic and generated answers, then validates only generated answers with `validatorPrompt`.

The validator checks for:

- unsupported claims,
- invalid formats,
- enum/dropdown mismatches,
- contradictions,
- hallucinated facts.

After LLM validation, the node also performs a local dropdown check:

- exact option match is accepted,
- close partial match is substituted with a warning,
- no match removes the answer and marks the field unresolved.

### `repair_answers`

Runs only if validation produced unresolved non-deterministic fields and `repairAttempts < 1`.

It reuses `composerPrompt`, but adds validation feedback into the retrieved context so the reasoning model can try again. Then it clears unresolved fields and increments `repairAttempts`, causing validation to run one more time.

This one-repair limit prevents infinite validation/repair loops.

### `finalize_fill_plan`

Merges deterministic and validated answers into the final answer map.

Any pending field without an answer is marked unresolved with:

```text
Insufficient user context to generate an answer
```

It also deduplicates unresolved fields by `fieldKey`.

### `log_run`

Logs a summary including:

- session ID,
- user ID,
- domain,
- total fields,
- answered count,
- unresolved count,
- token usage,
- tool/node timing trace.

## Output State

The final useful state contains:

- `validatedAnswers`: final answer map to fill into the form.
- `unresolvedFields`: fields that should not be autofilled.
- `warnings`: non-fatal issues, such as closest dropdown option matching.
- `toolTrace`: timing trace for each graph node.
- `tokenUsage`: accumulated model token usage when available.
- `trace.contextMode`: whether the run used `"rag"` or `"full"` context.

## Important Safety Behavior

The graph is designed to avoid bad autofill values:

- The composer prompt says not to invent facts.
- Unknown values should be returned as `null`.
- The validator rejects unsupported or invalid generated values.
- Dropdown answers must match available options.
- Repair happens only once.
- Finalization leaves unsupported fields unresolved instead of guessing.

## Current Implementation Notes

- `plannedActions` are generated but not yet used to drive per-group answer composition.
- Imported tool wrappers in `tools/` are not directly invoked by this graph; this graph calls repositories and RAG services directly.
- `safeParse` protects the graph from malformed model JSON by falling back to safe defaults.
- `toolTrace` records graph-node timings, not only external tool calls.
