# Form Pilot — Architecture and System Design

## 1. Overview

Form Pilot is an AI-assisted form-filling platform composed of three primary surfaces:

- `frontend/` — Next.js web app for marketing, authentication, onboarding, dashboard, and profile management
- `backend/` — Express + Prisma API that stores user data, serves AI responses, manages auth, referrals, wallet data, resumes, and admin workflows
- `extension/` — Chrome extension that detects fields on arbitrary third-party websites, requests autofill answers, and injects values back into the DOM

At a product level, Form Pilot is a **user-context engine with two execution layers**:

1. The user builds a structured profile on the web app
2. The backend stores and indexes that profile into PostgreSQL and Pinecone
3. The extension detects forms on arbitrary sites and sends normalized field descriptors to the backend
4. The backend classifies each field, resolves easy fields deterministically, then runs a LangGraph agentic pipeline for the complex ones
5. The extension receives a structured answer payload and fills the form

---

## 2. High-Level Architecture

```text
                 ┌──────────────────────────┐
                 │     Next.js Frontend     │
                 │  auth · dashboard · UI   │
                 └────────────┬─────────────┘
                              │ HTTPS / JSON
                              ▼
                 ┌──────────────────────────┐
                 │   Express Backend API    │◄──────────────────────────┐
                 │  business logic layer    │                           │
                 └──┬──────────┬────────────┘                           │
                    │          │                              Chrome Extension
                    ▼          ▼                          (content + background)
        ┌────────────┐   ┌──────────────────┐               POST /api/ai/*
        │ PostgreSQL │   │   Pinecone DB    │
        │  (Prisma)  │   │ vector knowledge │
        └────────────┘   └──────────────────┘
                    │
                    ▼
        ┌──────────────────────────────────┐
        │         External Services        │
        │  AICredits/OpenAI proxy          │
        │  Brevo (email)  · S3 (files)     │
        │  Stripe · Razorpay (payments)    │
        │  GitHub OAuth                    │
        └──────────────────────────────────┘
```

---

## 3. Main Components

### 3.1 Frontend

The frontend is a Next.js App Router application under `frontend/src/app`.

Primary responsibilities:

- marketing and landing pages
- OTP-based sign-in / sign-up flows
- onboarding wizard for user profile setup
- dashboard for user context management
- pages for answers, projects, resume management, settings

Notable characteristics:

- client-heavy interactive components for landing and dashboard UX
- acts as the primary surface for user-entered structured data
- shares auth state with the extension through cookies or local storage

### 3.2 Backend API

Entry point: [`backend/src/server.ts`](/d:/Auto_form_filler/backend/src/server.ts)

Route groups:

| Prefix | Purpose |
|---|---|
| `/api/auth` | OTP signup/login, token refresh, logout |
| `/api/user` | User profile read and update |
| `/api/projects` | Project CRUD |
| `/api/custom-answers` | Reusable answer library |
| `/api/resume` | Resume metadata and management |
| `/api/memory` | User memory abstractions |
| `/api/ai` | Autofill, chat refinement, agentic LLM (see §5) |
| `/api/payment` | Stripe/Razorpay payment flows |
| `/api/wallet` | Credit balance and transaction ledger |
| `/api/refferals` | Referral graph and rewards |
| `/api/dashboard` | Dashboard aggregation data |
| `/api/admin` | Internal admin operations |
| `/api/github` | GitHub integration |
| `/api/docs` | Swagger API documentation |

Cross-cutting middleware stack:

- `cors` — cross-origin request policy
- `helmet` — HTTP security headers
- `morgan` — HTTP access logging
- JSON/body parsing
- request logging middleware (writes to `RequestLog`)
- centralized async error handler

### 3.3 Chrome Extension

Manifest V3 Chrome extension under `extension/`.

Core parts:

| File | Role |
|---|---|
| `background/background.ts` | Service worker — coordinates autofill requests, calls backend, receives messages from content scripts |
| `content/content.ts` | Runs in page context — detects forms, injects floating UI, fills fields when answers arrive |
| `popup/Popup.tsx` | Extension popup surface |
| `content/scraper.ts` | DOM scraping and field metadata extraction |
| `content/formDetector.ts` | Form and field boundary detection on arbitrary DOM trees |
| `content/formFiller.ts` | DOM write layer — injects values into inputs, selects, textareas |
| `utils/api.ts` | HTTP client pointing to the backend AI endpoints |

Extension autofill lifecycle:

1. Content script scans DOM → extracts normalized field descriptors
2. Background worker collects descriptors → calls `POST /api/ai/generate` (or `/api/ai/agent/fill`)
3. Backend returns a key-value answer payload
4. Background sends payload to content script
5. Content script maps values to selectors/names and writes them into the DOM

---

## 4. Data Architecture

The system uses PostgreSQL through Prisma Client v7, configured via `backend/prisma/schema.prisma`.

### 4.1 Core User Profile Graph

`User` is the central aggregate root. All profile data hangs off the user record:

```text
User
 ├── Link[]          (LinkedIn, GitHub, portfolio, website)
 ├── Address[]       (PERMANENT | CURRENT | OTHER)
 ├── Education[]     (institution, degree, startDate, endDate, GPA)
 ├── Work[]          (company, position, type, startDate, endDate)
 ├── Project[]       (name, description, techStacks, projectLinks)
 ├── AnswerLibrary[] (reusable Q&A pairs: title, category, answer)
 ├── Resume[]        (label, target role, description, pdfUrl, isDefault)
 └── Memory[]        (flexible key/value memory for RAG policies)
```

This shape directly enables deterministic autofill before any model call.

### 4.2 Auth and Security Data

Authentication is OTP-first (no passwords):

- `UserOtp` — stores OTP codes with purpose (SIGNUP | LOGIN) and expiry
- `RefreshToken` — hashed tokens supporting rotation and revocation
- JWT access + refresh tokens issued by the auth service layer

### 4.3 Credits and Billing

The product uses a credit economy:

- User credit balance is a field on `User` (credits + weeklyFreeCredits)
- `CreditTransaction` — immutable ledger of credit changes
- `Purchase` — Stripe/Razorpay payment records
- `Referral` — tracks referrer-referred relationships and reward credits

### 4.4 Operational Data

- `RequestLog` — HTTP-level traces per request
- `AppLog` — application-level events with context tagging
- `UsageAnalytics` — per-autofill analytics (platform, fields filled, time saved, credits used)
- `Admin`, `AdminOtp`, `AdminSession` — role-based internal access

---

## 5. AI and Knowledge System — Full Design

This is the central intelligence layer. It has three sub-layers that work together:

1. **RAG Layer** — Pinecone-backed vector knowledge store (`rag.service.ts`)
2. **Deterministic Resolver** — rule-based field matcher (`ai.service.ts`)
3. **Agentic LLM Layer** — LangChain + LangGraph orchestration (`llm/`)

### 5.1 Deterministic Resolver (`ai.service.ts`)

The first and cheapest path. No model call needed.

Located at: `backend/src/modules/ai/ai.service.ts`

Process:

1. Fetch full user profile from PostgreSQL via `getUserById`
2. Sort works, educations, and projects for recency
3. For each field: normalize the field's label + name + placeholder + type into a single lowercase string
4. Rule-match against an ordered priority list of known field patterns
5. Map the resolved value against the dropdown `options` array if present
6. Return a `Record<string, string>` of field key → value

Field categories resolved deterministically:

| Field Pattern | Source |
|---|---|
| first/last/full name | `User.firstName`, `lastName` |
| email | `User.email` |
| phone / mobile | `User.phone` |
| bio / about / summary | `User.bio` |
| skills / tech stack | `User.skills[]` |
| LinkedIn / GitHub / portfolio | `User.links[]` matched by platform keyword |
| address (permanent/current/other) | `User.addresses[]` matched by type |
| city / state / zip / country | `User.addresses[].city`, `.state`, etc. |
| company / employer | `User.works[0].companyName` (most recent) |
| job title / position | `User.works[0].position` |
| college / university | `User.educations[0].instituteName` |
| degree | `User.educations[0].degree` |
| GPA / CGPA | `User.educations[0].gpa` |
| project name | `User.projects[0].name` |
| project description | `User.projects[0].description` |
| custom Q&A | `User.answers[]` matched by title/category fuzzy match |

API surface: `POST /api/ai/generate` (legacy, unchanged)

### 5.2 RAG Layer (`rag.service.ts`)

Located at: `backend/src/modules/ai/rag.service.ts`

The RAG layer converts the user's structured profile into a vector knowledge base in Pinecone, enabling semantic retrieval at query time.

#### Chunk Types

| Type | Source Entity | Priority |
|---|---|---|
| `PERSONAL` | User: name, email, phone, bio, skills, links | 10 |
| `ANSWER` | AnswerLibrary entries | 9 |
| `PROJECT` | Project: name, description, tech stack | 8 |
| `EXPERIENCE` | Work history entries | 8 |
| `RESUME` | Resume labels, target roles, descriptions | 7–9 |
| `EDUCATION` | Education history entries | 6 |

#### Knowledge Sync Flow

```text
User updates profile / project / answer / resume
  ├── Backend writes to PostgreSQL via Prisma
  └── scheduleUserKnowledgeSync(userId)
        ├── Queue prevents concurrent syncs for the same user
        ├── deleteUserKnowledgeChunks(userId)  ← wipes old vectors by prefix
        ├── buildUserKnowledgeChunks(user)      ← reconstructs all chunks
        ├── generateEmbeddingsBatch(texts)      ← batch embed (AICredits proxy)
        └── scopedIndex.upsert(records)         ← write to Pinecone namespace
```

#### Query Flow (used inside the LLM layer)

```text
query + userId
  ├── inferRelevantChunkTypes(query)  ← keyword-based type selector
  ├── generateEmbedding(query)        ← embed query via AICredits proxy
  ├── scopedIndex.query(vector, filter: { userId, type: $in [...] })
  ├── sort by metadata.priority descending
  └── return content strings
```

#### Type Inference Heuristic

The `inferRelevantChunkTypes()` function matches query keywords against curated keyword sets for each chunk type, e.g. "why do you want" maps to `ANSWER`, "github" maps to `PERSONAL`, "worked at" maps to `EXPERIENCE`. If no type matches, all six types are queried.

#### Embedding Model

- Model: `text-embedding-3-small`
- API: AICredits proxy (`https://api.aicredits.in/v1/embeddings`)
- Namespace: `process.env.PINECONE_NAMESPACE` (default: `"main"`)

### 5.3 LLM Gateway Layer (`llm/models/chatModels.ts`)

Located at: `backend/src/modules/ai/llm/models/chatModels.ts`

Two model tiers are configured as LangChain `ChatOpenAI` instances:

| Model Tier | Function | Model | Temperature | Used For |
|---|---|---|---|---|
| `base_fast_model` | `getBaseFastModel()` | `gpt-4o-mini` | 0 | Field classification, validation, quick extraction |
| `reasoning_model` | `getReasoningModel()` | `gpt-4o` | 0.3 | Answer composition, repair, chat refinement |

Both route through the `aicredits.in` proxy using `AICREDITS_API_KEY`, configured via `AICREDITS_BASE_URL`.

This abstraction means the model routing strategy can change in one file without modifying graph nodes.

---

## 6. LLM Layer — Detailed Design

The LLM layer lives at:

```text
backend/src/modules/ai/llm/
  schemas/
    autofill.schemas.ts
  models/
    chatModels.ts
  prompts/
    autofill.prompts.ts
  tools/
    userProfile.tool.ts
    ragSearch.tool.ts
    validator.tool.ts
  graphs/
    autofill.graph.ts
    refine.graph.ts
  services/
    autofillAgent.service.ts
    refineAgent.service.ts
```

### 6.1 Schema Layer (`llm/schemas/autofill.schemas.ts`)

All shared TypeScript types and Zod validators used across the LLM layer.

#### `NormalizedField`

The normalized representation of a form field used throughout the graph:

```ts
interface NormalizedField {
  key: string;           // primary identifier: selector | name | label | id
  id?: string;           // original DOM element id from extension
  label: string;         // human-readable label text
  placeholder?: string;
  name?: string;         // HTML name attribute
  type?: string;         // HTML element type (input | select | textarea)
  inputType?: string;    // input[type] attribute (email | tel | url | date etc.)
  required?: boolean;
  options?: string[];    // dropdown options if applicable
  selector?: string;     // CSS selector captured by the extension scraper
  formId?: string;       // which form this field belongs to
  role?: string;         // ARIA role
  tag?: string;          // HTML tag name
  complexity?: FieldComplexity;  // assigned by classify_fields node
}
```

#### `FieldComplexity`

```ts
type FieldComplexity =
  | "deterministic"   // easy: rule-based resolver handles it
  | "retrieval"       // needs semantic context from RAG
  | "reasoning"       // needs LLM composition (motivation, cover letter, etc.)
  | "unresolved";     // cannot be mapped
```

#### `AutofillGraphState`

The full LangGraph execution state passed between nodes:

```ts
interface AutofillGraphState {
  userId: string;
  sessionId: string;
  domain?: string;                              // inferred site domain
  formId?: string;
  fields: NormalizedField[];                    // all fields from extension
  currentFormState: Record<string, string>;     // already-filled values
  deterministicAnswers: Record<string, string>; // from rule-based resolver
  pendingFields: NormalizedField[];             // non-deterministic fields
  retrievedContext: RetrievedChunk[];           // from Pinecone
  plannedActions: FillAction[];                 // from planner agent
  generatedAnswers: Record<string, string>;     // from composer
  validatedAnswers: Record<string, string>;     // passed validation
  unresolvedFields: { fieldKey, reason }[];     // failed or skipped
  repairAttempts: number;                       // guards against infinite loops
  toolTrace: ToolInvocationTrace[];             // observability
  warnings: string[];                           // surfaced to extension
  tokenUsage?: { prompt, completion, total };   // accumulated from compose step
  userProfileCache?: string;                    // cached user JSON to avoid re-fetches
}
```

#### `AutofillResponse` — The Extension Output Contract

```ts
interface AutofillResponse {
  answers: Record<string, string>;              // fieldKey → value
  unresolved: { fieldKey: string; reason: string }[];
  warnings: string[];
  trace: {
    usedRag: boolean;
    usedTools: string[];
  };
}
```

### 6.2 Prompt Layer (`llm/prompts/autofill.prompts.ts`)

Four role-specific `ChatPromptTemplate` instances, each with a strict system policy and a structured human template.

#### `intakePrompt` → Classification Agent

**Model**: `base_fast_model`

**System policy**: Classify each incoming field into `deterministic | retrieval | reasoning | unresolved`. Also infer the form domain (LinkedIn, Workday, Greenhouse, Lever, generic).

**Output format**:
```json
{
  "domain": "Greenhouse",
  "fieldClassifications": [
    { "key": "#motivation", "complexity": "reasoning" },
    { "key": "email", "complexity": "deterministic" }
  ]
}
```

**Human input**: Serialized field list + already-filled form state.

---

#### `plannerPrompt` → Fill Planner Agent

**Model**: `base_fast_model`

**System policy**: Group related pending fields into `FillAction` batches with a strategy tag. Prefers grouping related fields (e.g., all motivation questions together) to reduce redundant retrieval calls.

**Strategy options**:

| Strategy | Meaning |
|---|---|
| `exact` | DB data is sufficient, no LLM needed |
| `semantic` | Needs RAG context but no full composition |
| `hybrid` | Needs both DB data and semantic context |
| `compose` | Full LLM composition required |

**Output format**:
```json
[
  {
    "group": "motivation_block",
    "fieldKeys": ["#why-here", "#cover-letter"],
    "strategy": "compose",
    "retrievalQuery": "why do you want to work here motivation cover letter"
  }
]
```

---

#### `composerPrompt` → Answer Composer Agent

**Model**: `reasoning_model`

**System policy (strict grounding rules)**:
1. Never invent facts not found in retrieved context or user profile
2. Prefer exact profile data over inference
3. Leave a field `null` rather than fabricate
4. Keep answers concise unless the field type requires detail
5. Return only valid JSON mapping `fieldKey → answer | null`
6. Match the tone of the site domain
7. Dropdown values must exactly match one of the provided options

**Human input**: User profile JSON + RAG context + field definitions + domain.

**Output**: `{ "fieldKey": "value or null" }`

---

#### `validatorPrompt` → Validation Agent

**Model**: `base_fast_model`

**System policy**:
1. Reject any claim unsupported by retrieved evidence or user profile
2. Reject values violating field constraints (email format, URL format, date format, enum options)
3. Reject contradictions across related fields
4. Flag hallucinated company names, degrees, achievements, or dates

**Output format**:
```json
{
  "valid": false,
  "issues": [
    { "fieldKey": "#company", "reason": "Company name not found in work history" }
  ],
  "validatedAnswers": { "#email": "user@example.com" }
}
```

### 6.3 Tool Layer

Fourteen LangChain tools organized into three categories. All tools return JSON strings.

#### User Context Tools (`llm/tools/userProfile.tool.ts`)

These tools expose Prisma DB queries as callable LangChain tools:

| Tool Name | Prisma Model | Returns |
|---|---|---|
| `get_user_profile` | `User` | id, name, email, phone, bio, skills |
| `get_user_links` | `Link[]` | All platform/URL pairs |
| `get_user_addresses` | `Address[]` | All address records with type |
| `get_user_work_history` | `Work[]` | All work entries, sorted by startDate desc |
| `get_user_education_history` | `Education[]` | All education entries, sorted by startDate desc |
| `get_user_projects` | `Project[]` | All projects, sorted by createdAt desc |
| `get_user_custom_answers` | `AnswerLibrary[]` | All reusable Q&A pairs |
| `get_user_resumes` | `Resume[]` | All resumes, default first |

All tools accept `{ userId: string }` and fail gracefully (return `{ error }` JSON on not-found).

#### Retrieval Tools (`llm/tools/ragSearch.tool.ts`)

| Tool Name | Behavior |
|---|---|
| `search_user_knowledge` | Full Pinecone semantic search with optional type filtering and configurable topK. Returns `RetrievedChunk[]` with score, priority, chunkType, and content. |
| `search_resume_context` | Focused on `RESUME` chunks only. topK=4. |
| `search_answer_library_context` | Focused on `ANSWER` chunks only. topK=4. |

`search_user_knowledge` flow:

```text
query + types + topK
  ├── generateEmbedding(query)  via AICredits proxy
  ├── inferRelevantChunkTypes(query)  if types not explicitly provided
  └── scopedIndex.query(vector, filter: { userId, type: $in [...] })
        └── returns RetrievedChunk[] sorted by score
```

#### Validation Tools (`llm/tools/validator.tool.ts`)

| Tool Name | What It Checks |
|---|---|
| `validate_answer_format` | Email regex · URL parse · phone regex · dropdown membership |
| `match_dropdown_option` | Exact match → partial substring match → fallback with warning |
| `check_required_fields` | Verifies all `required: true` fields are present in the answers map |

`match_dropdown_option` algorithm:
1. Lowercase + trim both the value and each option
2. Try exact equality
3. Try substring inclusion (either direction)
4. Return the matched option + warning if not exact, or the original value + warning if nothing found

### 6.4 Autofill Graph (`llm/graphs/autofill.graph.ts`)

The primary LangGraph `StateGraph`. Compiled once at module load and shared across all requests.

#### State Annotation

LangGraph's `Annotation.Root()` is used to declare strongly typed graph state. All 16 fields are primitive-reducible (objects/arrays replace rather than merge) matching LangGraph's channel model.

#### Graph Node Definitions

**Node 1: `ingest_request`**

- Normalizes every field: assigns a `key` as `selector || name || label || id || uuid()`
- Ensures `sessionId` exists (generates UUID if not provided by caller)
- Pure data normalization, no I/O

**Node 2: `classify_fields`**

- Calls `intakePrompt` → `base_fast_model`
- Parses the JSON classification response
- Annotates each `NormalizedField` with its `FieldComplexity`
- Infers the form domain (stored in state)
- Splits fields: `deterministicFields` stay in `fields`, `pendingFields` receives everything that is not `"deterministic"`
- **Fallback**: If the model call fails, marks all fields as `"retrieval"` to be safe

**Node 3: `resolve_easy_fields`**

- Invokes the existing `generateFormFillService()` from `ai.service.ts` on the deterministic subset only
- Stores results in `deterministicAnswers`
- This node preserves backward compatibility with the original resolver
- No model call — pure rule-based evaluation

**Node 4: `retrieve_context`**

- Builds a single aggregated retrieval query from all pending field labels joined together, plus the domain name
- Calls `inferRelevantChunkTypes()` on the query
- Runs `queryContext()` (Pinecone query via RAG service) with topK=8
- Wraps raw string chunks into typed `RetrievedChunk[]` objects
- Stores in `retrievedContext`

**Node 5: `plan_fill_actions`**

- Calls `plannerPrompt` → `base_fast_model`
- Receives pending field definitions + compressed retrieved context
- Returns an array of `FillAction[]` grouping related fields and assigning strategies
- **Fallback**: If planning fails, creates one `FillAction` per pending field

**Node 6: `compose_answers`**

- Fetches full user profile from DB via `getUserById()` if not already cached in state
- Caches the JSON-serialized user in `userProfileCache` to avoid repeated DB round-trips during repair passes
- Calls `composerPrompt` → `reasoning_model`
- Parses the JSON answer map, filtering out `null` values (those become unresolved)
- Accumulates token usage via `usage_metadata` if the model response includes it
- Stores in `generatedAnswers`

**Node 7: `validate_answers`**

- If `generatedAnswers` is empty, bypasses LLM validation and passes through `deterministicAnswers`
- Otherwise calls `validatorPrompt` → `base_fast_model`
- Merges `validatedAnswers` (deterministic + validated generated)
- Runs a secondary **deterministic dropdown check** in code (not LLM): for every pending field that has an `options` array, the validated answer is matched using the same algorithm as `match_dropdown_option`. Mismatches either get corrected with a warning or removed and added to `unresolvedFields`

**Node 8: `repair_answers`**

- Triggered only when `validate_answers` surfaces issues and `repairAttempts < 1`
- Filters the failed field keys and fetches those `NormalizedField` definitions
- Constructs a composite context string that includes the original retrieved chunks plus a "validation feedback" section describing each issue
- Re-runs the composer with `reasoning_model` on the failing subset only
- Increments `repairAttempts` to prevent infinite loops
- Clears `unresolvedFields` so that `validate_answers` can re-evaluate cleanly

**Node 9: `finalize_fill_plan`**

- Merges `deterministicAnswers` + `validatedAnswers` into the final answer map
- Finds fields that were never answered (present in `pendingFields` but absent from the final map) and adds them to `unresolvedFields` with a generic reason
- Deduplicates `unresolvedFields` by `fieldKey`

**Node 10: `log_run`**

- Emits a structured `console.info` log with: sessionId, userId, domain, total field count, answered count, unresolved count, token usage, and the full tool trace with durations
- Returns empty state delta (no mutations)

#### Graph Routing Logic

```text
START
  └─► ingest_request
        └─► classify_fields
              └─► resolve_easy_fields
                    ├─► [pendingFields.length === 0] ──────────────────► finalize_fill_plan
                    │
                    └─► [pendingFields.length > 0] ──► retrieve_context
                                                             └─► plan_fill_actions
                                                                   └─► compose_answers
                                                                         └─► validate_answers
                                                                               ├─► [valid OR repairAttempts ≥ 1] ─► finalize_fill_plan
                                                                               │
                                                                               └─► [invalid AND repairAttempts < 1] ─► repair_answers
                                                                                                                           └─► validate_answers
                                                                                                                                 └─► finalize_fill_plan
finalize_fill_plan
  └─► log_run
        └─► END
```

Two conditional edges:

| After Node | Condition | Destination |
|---|---|---|
| `resolve_easy_fields` | `pendingFields.length === 0` | `finalize_fill_plan` |
| `resolve_easy_fields` | `pendingFields.length > 0` | `retrieve_context` |
| `validate_answers` | valid OR repairAttempts >= 1 | `finalize_fill_plan` |
| `validate_answers` | invalid AND repairAttempts < 1 | `repair_answers` |

### 6.5 Refine Graph (`llm/graphs/refine.graph.ts`)

A simpler 3-node LangGraph for the chat refinement path.

**Triggered when**: The user types a natural-language instruction to modify an already-filled form.

**State**:
```ts
{
  userId: string;
  sessionId: string;
  instruction: string;           // user's chat message
  currentState: Record<string, string>;  // current form values
  retrievedContext: string[];
  updatedFields: Record<string, string>;
  warnings: string[];
}
```

**Nodes**:

1. `retrieve_refine_context` — builds a seed from `instruction + fieldKeys`, infers chunk types, runs `queryContext` with topK=6
2. `compose_refinement` — fetches user profile, calls `reasoning_model` with a structured prompt that includes user profile + RAG context + current form state + instruction. Returns only the changed fields as JSON.
3. `log_refine` — structured log of session, userId, updated field count

**Routing**: LINEAR — no conditionals. `START → retrieve → compose → log → END`

### 6.6 Agent Services

#### `autofillAgent.service.ts` — `runAutofillAgent()`

The exposed interface for the controller and any future callers:

```ts
interface AutofillAgentInput {
  userId: string;
  fields: NormalizedField[];
  currentFormState?: Record<string, string>;
  domain?: string;
  formId?: string;
  sessionId?: string;
}

async function runAutofillAgent(input: AutofillAgentInput): Promise<AutofillResponse>
```

- The autofill graph is compiled **once at module load** (`buildAutofillGraph()` is called at the top of the file, not inside the function). This is correct for long-running Express servers: graph construction is relatively expensive, but invocation is cheap.
- Initializes all state fields to their zero values before invoking
- Deduplicates tool names from `toolTrace` for the `trace.usedTools` response field

#### `refineAgent.service.ts` — `runRefineAgent()`

```ts
interface RefineAgentInput {
  userId: string;
  instruction: string;
  currentFormState: Record<string, string>;
  sessionId?: string;
}

async function runRefineAgent(input: RefineAgentInput): Promise<Record<string, string>>
```

Returns only the changed field values, which the extension merges into its current form state.

---

## 7. AI Endpoint Surface

All AI endpoints live under `/api/ai`:

| Method | Path | Auth | Usage Limit | Handler | Graph |
|---|---|---|---|---|---|
| POST | `/api/ai/generate` | ✅ | ✅ | `generateFill` | None (deterministic only) |
| POST | `/api/ai/chat` | ✅ | ❌ | `chatRefine` | None (single RAG+LLM call) |
| POST | `/api/ai/feedback` | ✅ | ❌ | `submitFeedback` | None |
| POST | `/api/ai/agent/fill` | ✅ | ✅ | `agentFill` | `autofill.graph` |
| POST | `/api/ai/agent/refine` | ✅ | ❌ | `agentRefine` | `refine.graph` |

### `POST /api/ai/agent/fill` — Full Request/Response

**Request**:
```json
{
  "fields": [
    {
      "label": "Why do you want to work at this company?",
      "selector": "#motivation",
      "type": "textarea",
      "required": true
    },
    {
      "label": "Email",
      "selector": "#email",
      "inputType": "email",
      "required": true
    }
  ],
  "currentFormState": {},
  "domain": "Greenhouse",
  "formId": "job-application-form",
  "sessionId": "optional-uuid"
}
```

**Response**:
```json
{
  "answers": {
    "#email": "user@example.com",
    "#motivation": "I'm excited by your mission to democratize education because..."
  },
  "unresolved": [],
  "warnings": [],
  "trace": {
    "usedRag": true,
    "usedTools": [
      "ingest_request",
      "classify_fields",
      "resolve_easy_fields",
      "retrieve_context",
      "plan_fill_actions",
      "compose_answers",
      "validate_answers",
      "finalize_fill_plan",
      "log_run"
    ]
  }
}
```

### `POST /api/ai/agent/refine` — Full Request/Response

**Request**:
```json
{
  "message": "Make the motivation answer more concise and mention my React experience",
  "formState": {
    "#motivation": "I want to work here because I believe in your product...",
    "#email": "user@example.com"
  },
  "sessionId": "optional-uuid"
}
```

**Response**:
```json
{
  "#motivation": "As a React developer with 3 years of experience, I am drawn to your platform because..."
}
```

---

## 8. Hybrid Autofill Strategy

The core design principle: **deterministic first, agentic only when needed**.

```text
Incoming fields (all)
       │
       ▼
  classify_fields (LLM)
       │
       ├─► deterministic list ─► resolve_easy_fields (ai.service.ts, no model)
       │                              └─► deterministicAnswers{}
       │
       └─► pending list ────────► retrieve_context (Pinecone)
                                        └─► plan_fill_actions (LLM)
                                               └─► compose_answers (LLM, reasoning_model)
                                                      └─► validate_answers (LLM + code)
                                                             └─► [repair if needed]
                                                                    └─► finalAnswers = deterministicAnswers + validatedAnswers
```

#### Field Routing by Type

| Field Type | Resolved By |
|---|---|
| name, email, phone, address fields | Deterministic (rule-based string matching) |
| LinkedIn, GitHub, portfolio URLs | Deterministic (link array keyword match) |
| College, degree, GPA | Deterministic (latest education record) |
| Company name, job title | Deterministic (most recent work record) |
| Custom Q&A (exact match) | Deterministic (AnswerLibrary fuzzy match) |
| Project descriptions | RAG retrieval + LLM composition (`reasoning`) |
| Experience narratives | RAG retrieval + LLM retrieval mode |
| "Why this company / role" | RAG + LLM full composition (`reasoning`) |
| Cover letter / bio adaptation | LLM composition (`reasoning`) |
| Ambiguous dropdowns | LLM semantic match + code deterministic validation |
| Unknown / unmappable | Returned as `unresolved` with reason string |

---

## 9. Request and Data Flows

### 9.1 User Signup / Login Flow

```text
Frontend → POST /api/auth/send-signup-otp or /send-login-otp
  └─► Backend creates UserOtp in DB with expiry
  └─► Brevo sends OTP email

Frontend → POST /api/auth/signup or /api/auth/login
  └─► Backend validates OTP (checks expiry + usage)
  └─► Creates or fetches User record
  └─► Issues JWT access token (short TTL)
  └─► Issues JWT refresh token → stores hashed in RefreshToken table
  └─► For new signups: generates referral code, awards signup credits, schedules Pinecone sync
  └─► Returns { accessToken, refreshToken, user }
```

### 9.2 Profile → Knowledge Sync Flow

```text
User updates profile / project / answer / resume
  └─► Backend writes to PostgreSQL via Prisma (immediate)
  └─► scheduleUserKnowledgeSync(userId)
        └─► Serialized into per-user promise queue (prevents concurrent syncs)
        └─► deleteUserKnowledgeChunks(userId)
              └─► Paginates Pinecone list API by prefix "user:{id}:"
              └─► Batch deletes all vectors
        └─► buildUserKnowledgeChunks(user)
              └─► buildPersonalChunk()
              └─► buildProjectChunks()
              └─► buildExperienceChunks()
              └─► buildEducationChunks()
              └─► buildAnswerChunks()
              └─► buildResumeChunks()
        └─► generateEmbeddingsBatch(allChunkTexts)
              └─► Single API call to AICredits proxy for the full batch
        └─► scopedIndex.upsert(records)
```

### 9.3 Legacy Autofill Flow (Deterministic Only)

```text
Extension → POST /api/ai/generate
  └─► authenticate middleware
  └─► checkUsageLimit middleware (deducts credit)
  └─► generateFormFillService(fields, userId)
        └─► getUserById(userId)  ← Prisma query with all relations
        └─► For each field: resolveFieldValue → matchOptionValue
        └─► Returns Record<string, string>
  └─► Response: { "selector": "value", ... }
```

### 9.4 Agentic Autofill Flow (Full LangGraph)

```text
Extension → POST /api/ai/agent/fill
  └─► authenticate middleware
  └─► checkUsageLimit middleware
  └─► agentFill controller
        └─► runAutofillAgent({ userId, fields, currentFormState, domain, formId, sessionId })
              └─► autofillGraph.invoke(initialState)
                    ├─► ingest_request        : normalize field keys
                    ├─► classify_fields       : classify each field (base_fast_model)
                    ├─► resolve_easy_fields   : deterministic resolver for easy fields
                    ├─► [if pending > 0]
                    │     ├─► retrieve_context  : Pinecone query
                    │     ├─► plan_fill_actions : group + strategy (base_fast_model)
                    │     ├─► compose_answers   : answer generation (reasoning_model)
                    │     ├─► validate_answers  : LLM + code validation (base_fast_model)
                    │     └─► [if invalid] repair_answers → validate_answers again
                    ├─► finalize_fill_plan    : merge + surface unresolved
                    └─► log_run              : structured log
              └─► Build AutofillResponse from finalState
  └─► Response: { answers, unresolved, warnings, trace }
```

### 9.5 Chat Refinement Flow (LangGraph)

```text
Extension → POST /api/ai/agent/refine
  └─► authenticate middleware
  └─► agentRefine controller
        └─► runRefineAgent({ userId, instruction, currentFormState, sessionId })
              └─► refineGraph.invoke(initialState)
                    ├─► retrieve_refine_context : Pinecone query scoped to instruction
                    ├─► compose_refinement      : selective update (reasoning_model)
                    └─► log_refine              : log updated field count
              └─► Returns only delta: { "fieldKey": "newValue" }
  └─► Extension merges delta into existing form state
```

---

## 10. Module-Level Backend Design

The backend follows a layered module pattern across all modules:

```text
routes.ts       ← Express Router: path + middleware wiring
controller.ts   ← Request/response handling, input validation
service.ts      ← Business logic
repository.ts   ← Prisma queries and persistence
```

All modules:

| Module | Responsibility |
|---|---|
| `auth` | OTP auth, token issuance, refresh rotation |
| `user` | Profile read/update, triggers Pinecone sync |
| `project` | Project CRUD |
| `answer` | Reusable custom answer library |
| `resume` | Resume metadata storage, S3 file management |
| `memory` | Additional user memory abstractions |
| `ai` | Autofill, chat refinement, LangGraph agentic layer |
| `wallet` | Credit balance management, transaction ledger |
| `refferal` | Referral graph and reward logic |
| `dashboard` | Aggregated user dashboard data |
| `admin` | Internal admin operations (role-based) |
| `github` | GitHub OAuth and integrations |
| `payment` | Stripe + Razorpay payment flows |
| `formFill` | (Scaffolded — not yet mounted in main server routes) |

---

## 11. Browser Extension Design

### 11.1 Why the Extension Exists

The extension allows Form Pilot to operate on arbitrary third-party websites where the product does not control the DOM. This requires:

- runtime field detection across heterogeneous page structures
- CSS selector capture for reliable fill-back
- Manifest V3 message passing between page context and background worker
- graceful fallback when backend is unreachable

### 11.2 Extension Runtime Model

| Layer | File | Role |
|---|---|---|
| Background | `background/background.ts` | Service worker — orchestrates everything, holds auth token, calls backend |
| Content | `content/content.ts` | Page context — detects forms, injects UI, applies fill values to the DOM |
| Content | `content/scraper.ts` | DOM traversal and metadata extraction |
| Content | `content/formDetector.ts` | Form boundary detection |
| Content | `content/formFiller.ts` | DOM write layer (inputs, selects, textareas) |
| Popup | `popup/Popup.tsx` | Lightweight popup UI |
| Utility | `utils/api.ts` | HTTP client to backend |

### 11.3 Field Descriptor Shape (sent to backend)

The extension scraper normalizes each field into a structure matching `NormalizedField`:

```ts
{
  label: "Cover Letter",
  placeholder: "Tell us why you're a great fit...",
  selector: "#cover-letter",
  name: "cover_letter",
  type: "textarea",
  required: true,
  options: []         // populated for <select> elements
}
```

### 11.4 Fallback Strategy

If the backend is unreachable or the user is unauthenticated, the extension background worker falls back to mock/local answer generation. In production this should be replaced by explicit unauthenticated UX.

---

## 12. Infrastructure and External Dependencies

### 12.1 Database

- PostgreSQL
- Prisma Client v7 with `@prisma/adapter-pg`
- Connection via `DATABASE_URL` environment variable
- Migrations tracked in `backend/prisma/migrations/`

### 12.2 Vector Storage

- Pinecone — serverless vector database
- Namespace per environment (`PINECONE_NAMESPACE`)
- User-scoped vector ID prefix: `user:{userId}:`
- All queries filtered by `userId` + chunk type

### 12.3 AI / LLM

- AICredits proxy (`https://api.aicredits.in/v1`) — OpenAI-compatible API wrapper
- Models in use: `gpt-4o-mini` (fast), `gpt-4o` (reasoning)
- Embedding model: `text-embedding-3-small`
- LangChain (`@langchain/openai`, `@langchain/core`) for model and prompt abstraction
- LangGraph (`@langchain/langgraph`) for stateful graph orchestration

### 12.4 Messaging / Email

- Brevo for OTP email delivery

### 12.5 File Storage

- AWS S3 for resume/file workflows (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)

### 12.6 Payments

- Stripe and Razorpay dependencies are present
- Payment service layer is scaffolded

### 12.7 GitHub

- GitHub OAuth and connection scaffolding for repo-linked features

### 12.8 Caching / Real-Time

- `ioredis` and `ws` (WebSocket) dependencies are present
- Not yet a dominant part of the active architecture — suggests planned caching/realtime features

---

## 13. Security Model

### Current Security Building Blocks

- OTP-based email verification (no password storage)
- JWT access tokens with short TTL
- Refresh token rotation with hashed persistence in `RefreshToken` table
- CORS + Helmet on all backend routes
- authenticate middleware guards all AI, user, payment endpoints
- checkUsageLimit middleware guards resource-intensive AI endpoints
- Role-based admin model with separate OTP and session tables
- Validator layer in the LLM pipeline rejects hallucinated or unsupported data

### Recommended Production Hardening

- Move extension token handling fully to secure auth exchange
- Separate public and private API domains/subdomains
- Store all secrets in environment variables, never committed
- Add rate limits to auth and AI endpoints
- Validate extension origin more strictly for sensitive actions
- Add idempotency keys to credit-deducting AI endpoints to prevent double-spend on retry

---

## 14. Scalability Considerations

### 14.1 Current Good Choices

- Deterministic resolver runs first — most common fields never touch the LLM
- LangGraph only invoked for the `pendingFields` subset
- RAG is user-scoped and chunked — retrieval stays targeted
- User profile caching within graph state avoids repeated DB calls during compose + repair
- Per-user Pinecone sync queue prevents concurrent overwrites
- Repair loop is capped at 1 attempt — no unbounded retries

### 14.2 Likely Future Bottlenecks

- Synchronous LLM graph calls inside the HTTP request lifecycle (P99 latency spikes)
- Full Pinecone delete-and-rebuild on every profile change (not incremental)
- DOM variability across target sites (Workday, ADP, etc. use iframes and custom elements)
- Token costs as forms grow more complex and users have larger profiles
- PostgreSQL read load under concurrent autofill sessions

### 14.3 Recommended Future Improvements

- Job queue (BullMQ or similar) for async graph execution with polling from extension
- Incremental vector updates (upsert only changed chunks, not full delete-and-rebuild)
- Domain-specific form adapters for Workday, Greenhouse, Lever, LinkedIn with tailored field normalization
- Per-session LangGraph checkpointing (LangGraph supports persistent checkpointers) for resumable sessions
- Redis-backed user profile cache to avoid repeated Prisma reads per autofill request
- Streaming support for long-form composition answers
- Prompt versioning and A/B testing layer for model parameters
- Analytics-driven optimization: log which field patterns consistently fail and use that to improve classification

---

## 15. Safety Rules Enforced at Runtime

The LLM layer enforces these policies at runtime in addition to prompt-level instructions:

| Rule | Where Enforced |
|---|---|
| No hallucinated employment history | `validatorPrompt` + code-level consistency check |
| No hallucinated degrees or achievements | `validatorPrompt` |
| No fabricated phone numbers, addresses, or URLs | `validate_answer_format` tool + format regex checks |
| No dropdown values outside the allowed set | Code-level dropdown matcher in `validate_answers` node |
| No silent overwrite of already-filled fields | `currentFormState` passed to classifier; already-filled fields are skipped |
| Repair loop stops after 1 attempt | `repairAttempts` guard in routing function |
| Unresolved fields explicitly surfaced | `unresolvedFields[]` in `AutofillResponse` with reason strings |

---

## 16. Mental Model

The cleanest way to reason about Form Pilot's data flow:

```text
User profile authored in dashboard
     │
     ▼ (Prisma writes to PostgreSQL)
Structured relational data: User + Works + Projects + Answers + ...
     │
     ▼ (scheduleUserKnowledgeSync)
Pinecone vector knowledge: PERSONAL + EXPERIENCE + PROJECT + ANSWER + RESUME + EDUCATION chunks
     │
     ▼ (POST /api/ai/agent/fill)
LangGraph autofill graph
  ├─► Deterministic resolver  → exact profile data for easy fields
  ├─► Pinecone retriever      → semantic grounding for complex fields
  ├─► LangChain composer      → grounded LLM generation
  └─► LangChain validator     → rejection of hallucinated / invalid answers
     │
     ▼
AutofillResponse payload { answers, unresolved, warnings, trace }
     │
     ▼ (Chrome Extension)
DOM values injected into third-party form inputs
```

The backend is the **policy and reasoning layer**. The extension is the **execution surface**. The LLM has **read-only access to user data** and can never write to the database during a normal autofill run.

---

## 17. File Reference Map

| File | Purpose |
|---|---|
| `backend/src/server.ts` | Express app setup, middleware, route mounting |
| `backend/prisma/schema.prisma` | Full Prisma data model |
| `backend/src/config/database.ts` | Prisma client singleton |
| `backend/src/config/openai.ts` | OpenAI-compatible client (aicredits.in proxy) |
| `backend/src/config/pinecone.ts` | Pinecone client and index accessor |
| `backend/src/modules/ai/ai.service.ts` | Deterministic resolver + legacy chat refine |
| `backend/src/modules/ai/rag.service.ts` | Pinecone sync, embedding, and semantic query |
| `backend/src/modules/ai/ai.controller.ts` | All AI endpoint handlers including agentFill/agentRefine |
| `backend/src/modules/ai/ai.routes.ts` | AI route definitions (legacy + agentic) |
| `backend/src/modules/ai/llm/schemas/autofill.schemas.ts` | TypeScript types + Zod schemas for LLM layer |
| `backend/src/modules/ai/llm/models/chatModels.ts` | LLM gateway: base_fast_model + reasoning_model |
| `backend/src/modules/ai/llm/prompts/autofill.prompts.ts` | Intake / Planner / Composer / Validator prompts |
| `backend/src/modules/ai/llm/tools/userProfile.tool.ts` | 8 Prisma-backed LangChain tools |
| `backend/src/modules/ai/llm/tools/ragSearch.tool.ts` | 3 Pinecone retrieval LangChain tools |
| `backend/src/modules/ai/llm/tools/validator.tool.ts` | 3 validation LangChain tools |
| `backend/src/modules/ai/llm/graphs/autofill.graph.ts` | 10-node LangGraph autofill pipeline |
| `backend/src/modules/ai/llm/graphs/refine.graph.ts` | 3-node LangGraph refinement pipeline |
| `backend/src/modules/ai/llm/services/autofillAgent.service.ts` | runAutofillAgent() |
| `backend/src/modules/ai/llm/services/refineAgent.service.ts` | runRefineAgent() |
| `backend/src/modules/user/user.repository.ts` | getUserById with all relations |
| `backend/src/modules/auth/auth.service.ts` | OTP, JWT, refresh token logic |
| `extension/src/background/background.ts` | Service worker, autofill orchestration |
| `extension/src/content/content.ts` | Page-level DOM interaction |
| `extension/src/utils/api.ts` | HTTP client for backend AI endpoints |
| `frontend/src/app` | Next.js App Router pages |
