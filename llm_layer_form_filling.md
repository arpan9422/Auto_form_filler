# Form Pilot LLM Layer for Form Filling

## 1. Purpose

This document defines the LLM layer for Form Pilot’s form-filling system using:

- `RAG` for user-specific context retrieval
- `LangChain` for tool wrapping, prompt composition, retrievers, and model interfaces
- `LangGraph` for stateful, agentic orchestration across multiple steps

The goal is to move Form Pilot from:

- rule-based autofill + single-shot refinement

to:

- retrieval-aware, tool-using agents that can reason over form fields, fetch the right user context, validate answers, and return structured fill plans

This is a design-first document. It should guide the implementation of the next LLM layer in the backend.

## 2. Design Goals

The LLM layer should:

- fill forms accurately using the user’s stored profile and retrieved knowledge
- reduce hallucinations by grounding every answer in user data, retrieved context, or deterministic tools
- support multi-step reasoning for difficult fields such as work history, resume questions, motivation questions, and ambiguous dropdowns
- return deterministic structured output for the extension to apply safely
- support future conversational refinement and per-domain filling strategies
- keep latency and token cost under control

## 3. Non-Goals

This layer should not:

- directly manipulate the DOM from the backend
- replace deterministic field matching for easy fields
- make arbitrary product decisions without user or system policy
- write to the database during normal autofill unless explicitly needed for analytics or memory updates

## 4. Current Baseline

Today the backend already has:

- a rule-based field matcher in [`backend/src/modules/ai/ai.service.ts`](/d:/Auto_form_filler/backend/src/modules/ai/ai.service.ts)
- a Pinecone-backed retrieval layer in [`backend/src/modules/ai/rag.service.ts`](/d:/Auto_form_filler/backend/src/modules/ai/rag.service.ts)
- user profile data in PostgreSQL through Prisma

That means the future LLM layer should be an evolution, not a rewrite.

Recommended strategy:

1. keep deterministic resolution for easy fields
2. invoke agents only for complex or ambiguous cases
3. use LangGraph to coordinate planning, retrieval, validation, and structured output

## 5. High-Level LLM Architecture

```text
Extension / Frontend
        |
        v
Backend AI Endpoint
        |
        v
LangGraph Autofill Graph
  - ingest fields
  - classify complexity
  - resolve easy fields deterministically
  - retrieve context with RAG
  - call specialized agents/tools
  - validate answers
  - return structured fill plan
        |
        +--> PostgreSQL / Prisma tools
        +--> Pinecone retriever
        +--> Resume / answer / project / profile tools
        +--> Analytics / logging
```

## 6. Core Design Principle

The system should be hybrid:

- `deterministic path` for obvious fields
- `agentic path` for complex fields

### Deterministic Path

Use existing rule-based logic for:

- name
- email
- phone
- address fields
- LinkedIn/GitHub/portfolio
- basic education/work/project lookups

### Agentic Path

Use LangGraph and tool-using agents for:

- long-form answers
- “why this company / why this role” questions
- resume-summary and bio adaptation
- ambiguous fields where the label is weak but surrounding context is meaningful
- dropdown choices requiring semantic mapping
- multi-field consistency checks

## 7. Main Components

### 7.1 LLM Gateway Layer

This layer abstracts model calls behind LangChain chat model wrappers.

Responsibilities:

- model routing
- retries and timeouts
- structured output parsing
- token accounting
- fallback model selection

Recommended interface:

- `base_fast_model`
  - cheap and fast
  - used for classification, extraction, and validation
- `reasoning_model`
  - stronger model
  - used for difficult field reasoning and long-form composition

### 7.2 Retrieval Layer

This layer reuses the existing Pinecone knowledge base and wraps it with LangChain retrievers.

Responsibilities:

- retrieve user-specific chunks by semantic match
- filter retrieval by chunk type
- rank and compress context
- merge structured DB context with vector context

Recommended retriever sources:

- Pinecone vector retriever for semantic memory
- direct Prisma fetch tool for exact structured data
- optional domain knowledge retriever for site-specific hints

### 7.3 Tool Layer

Tools expose system capabilities to the agent.

These should be first-class LangChain tools.

### 7.4 Orchestration Layer

This layer uses LangGraph to define the execution graph.

Why LangGraph:

- lets us keep explicit control over state
- supports conditional routing
- makes agent workflows debuggable
- works well for multi-step fill planning and validation

## 8. Proposed Tools

The agents should not operate on raw prompts alone. They should use tools.

### 8.1 User Context Tools

`get_user_profile`

- returns core user identity + profile fields
- exact source: PostgreSQL / Prisma

`get_user_links`

- returns LinkedIn, GitHub, portfolio, website, and other links

`get_user_addresses`

- returns permanent/current/other addresses

`get_user_work_history`

- exact work entries, sorted and filterable

`get_user_education_history`

- exact education entries

`get_user_projects`

- returns project metadata and tech stacks

`get_user_custom_answers`

- returns reusable answer library entries

`get_user_resumes`

- returns resume metadata, target role, description, and default resume pointer

### 8.2 Retrieval Tools

`search_user_knowledge`

- Pinecone-backed semantic search
- inputs:
  - `userId`
  - `query`
  - `types`
  - `topK`
- output:
  - retrieved chunks with score, source type, and metadata

`search_resume_context`

- focused retriever for resume chunks

`search_answer_library_context`

- focused retriever for reusable Q/A chunks

### 8.3 Form Understanding Tools

`normalize_form_fields`

- converts raw field descriptors into a consistent intermediate schema

`infer_form_domain`

- classifies page/form domain
- examples:
  - LinkedIn
  - Workday
  - Greenhouse
  - Lever
  - generic career portal

`get_form_state`

- optionally passed from extension
- returns current field-value state

`get_field_neighborhood`

- returns nearby labels/help text/group heading/section title if the extension can send it
- useful for ambiguous fields

### 8.4 Validation Tools

`validate_answer_format`

- checks date/email/url/phone/enumeration constraints

`match_dropdown_option`

- maps generated semantic value to the closest allowed option

`check_required_fields`

- verifies required fields are populated

`check_consistency`

- verifies outputs do not contradict user profile

### 8.5 Analytics and Logging Tools

`log_autofill_run`

- logs run metadata, latency, token usage, and outcome

`track_tool_usage`

- records which tools were used for which field classes

## 9. Proposed Agent Roles

Rather than one giant prompt, the system should use specialized logical roles inside the graph.

### 9.1 Intake Agent

Responsibilities:

- inspect incoming fields
- classify each field as:
  - deterministic
  - retrieval-needed
  - reasoning-needed
  - unresolved
- infer form type and domain

### 9.2 Retrieval Agent

Responsibilities:

- create targeted retrieval queries
- pull relevant user chunks
- fetch exact structured data when vector search is not enough
- compress context for downstream generation

### 9.3 Fill Planner Agent

Responsibilities:

- decide how to answer each unresolved field
- choose which tools to use
- group related fields into fill tasks
- avoid redundant retrieval calls

### 9.4 Answer Composer Agent

Responsibilities:

- generate final field values
- produce concise but grounded long-form answers
- follow site-appropriate tone and length

### 9.5 Validation Agent

Responsibilities:

- validate constraints
- ensure consistency with profile
- reject unsupported or hallucinated answers
- send bad answers back for repair

## 10. LangGraph State Design

The graph should operate on a strongly typed shared state.

Example state:

```ts
type AutofillGraphState = {
  userId: string;
  sessionId: string;
  domain?: string;
  formId?: string;
  fields: NormalizedField[];
  currentFormState: Record<string, string>;
  deterministicAnswers: Record<string, string>;
  pendingFields: NormalizedField[];
  retrievedContext: RetrievedChunk[];
  plannedActions: FillAction[];
  generatedAnswers: Record<string, string>;
  validatedAnswers: Record<string, string>;
  unresolvedFields: NormalizedField[];
  toolTrace: ToolInvocationTrace[];
  warnings: string[];
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
};
```

## 11. LangGraph Node Design

Recommended graph nodes:

### Node 1: `ingest_request`

Inputs:

- user id
- form fields
- current form state
- optional domain/page metadata

Outputs:

- normalized graph state

### Node 2: `classify_fields`

Tasks:

- label fields by complexity
- route obvious fields to deterministic path
- keep hard fields in `pendingFields`

### Node 3: `resolve_easy_fields`

Tasks:

- use existing rule-based resolver from `ai.service.ts`
- produce cheap and stable answers first

### Node 4: `retrieve_context`

Tasks:

- build retrieval query from pending fields + page context
- call Pinecone + exact DB tools
- return compressed grounding context

### Node 5: `plan_fill_actions`

Tasks:

- determine which groups of fields should be answered together
- example groups:
  - identity block
  - address block
  - work history block
  - motivation questions
  - summary/about-you questions

### Node 6: `compose_answers`

Tasks:

- use tools and retrieved context
- return structured candidate answers

### Node 7: `validate_answers`

Tasks:

- schema checks
- dropdown matching
- consistency checks
- hallucination prevention

### Node 8: `repair_answers`

Tasks:

- only runs if validation fails
- calls composer again with validation feedback

### Node 9: `finalize_fill_plan`

Tasks:

- merge deterministic + generated answers
- mark unresolved items with explanation
- produce final response payload for extension

### Node 10: `log_run`

Tasks:

- save analytics
- record tool trace
- record latency and token use

## 12. Graph Routing Logic

```text
ingest_request
  -> classify_fields
    -> resolve_easy_fields
      -> if pendingFields empty -> finalize_fill_plan
      -> else retrieve_context
        -> plan_fill_actions
          -> compose_answers
            -> validate_answers
              -> if valid -> finalize_fill_plan
              -> else repair_answers
                -> validate_answers
                  -> finalize_fill_plan
```

## 13. RAG Design for Form Filling

The RAG layer must be more field-aware than a generic chatbot retriever.

### 13.1 Retrieval Strategy

Retrieve context using:

- field labels
- placeholders
- section headings
- existing filled values
- domain/site metadata
- user instruction if refinement mode is active

### 13.2 Retrieval Modes

`mode = exact`

- use structured DB reads
- best for:
  - email
  - phone
  - company name
  - GPA
  - URLs

`mode = semantic`

- use Pinecone vector search
- best for:
  - explain your project
  - why do you want this role
  - tell us about yourself
  - write a short summary

`mode = hybrid`

- combine structured + semantic context
- best for:
  - role motivation
  - project fit
  - experience narratives

### 13.3 Context Compression

Do not pass raw long context blindly.

Use a compression step to:

- deduplicate overlapping chunks
- keep top-ranked evidence
- produce compact field-specific grounding

### 13.4 Retrieval Metadata

Each retrieved chunk should expose:

- chunk id
- chunk type
- title
- priority
- similarity score
- content

This helps debugging and future explainability.

## 14. Agent Prompting Strategy

Prompts should be role-specific and strict about grounding.

### 14.1 System Policy for Composer

The answer composer should be instructed:

- never invent facts not found in tools or retrieved context
- prefer exact profile data over semantic inference
- if uncertain, leave a field unresolved rather than fabricate
- output only JSON matching schema
- keep answers concise unless field type requires detail

### 14.2 System Policy for Validator

The validator should:

- reject claims unsupported by retrieved evidence
- reject values violating field constraints
- reject contradictions across related fields

## 15. Output Contract

The final graph output must be stable for the extension.

Recommended payload:

```json
{
  "answers": {
    "fieldKey1": "value",
    "fieldKey2": "value"
  },
  "unresolved": [
    {
      "fieldKey": "fieldKey3",
      "reason": "Insufficient user context"
    }
  ],
  "warnings": [
    "Selected closest dropdown option for current location"
  ],
  "trace": {
    "usedRag": true,
    "usedTools": ["get_user_profile", "search_user_knowledge", "match_dropdown_option"]
  }
}
```

## 16. Suggested LangChain Structure

Recommended package structure:

```text
backend/src/modules/ai/
  llm/
    models/
      chatModels.ts
    prompts/
      intake.prompt.ts
      planner.prompt.ts
      composer.prompt.ts
      validator.prompt.ts
    tools/
      userProfile.tool.ts
      userWorkHistory.tool.ts
      userProjects.tool.ts
      answerLibrary.tool.ts
      resume.tool.ts
      ragSearch.tool.ts
      dropdownMatcher.tool.ts
      validator.tool.ts
    retrievers/
      pineconeRetriever.ts
      hybridRetriever.ts
    graphs/
      autofill.graph.ts
      refine.graph.ts
    schemas/
      autofill.schemas.ts
    services/
      autofillAgent.service.ts
      refineAgent.service.ts
```

## 17. Suggested LangGraph Split

Use two graphs, not one:

### `autofill.graph`

Used when:

- user wants initial form fill
- no special instruction is given

Primary objective:

- maximize accurate population of many fields quickly

### `refine.graph`

Used when:

- user gives a chat instruction
- user wants edits on an already filled form

Primary objective:

- selectively update only relevant fields

## 18. Safety Rules

The LLM layer should enforce:

- no hallucinated employment history
- no hallucinated degrees, companies, or achievements
- no silent rewriting of fields already set unless explicitly asked
- no unsupported claims such as years of experience unless derivable from exact data
- no insertion of fake phone numbers, addresses, or links in authenticated mode

## 19. Performance Strategy

To keep latency acceptable:

- run deterministic resolver first
- invoke graph only for unresolved fields
- retrieve once per field group, not per field
- use smaller model for classification and validation
- cache recent user retrieval results per session
- log slow domains and problematic field patterns

Target execution pattern:

- easy form: mostly deterministic, minimal LLM
- medium form: one retrieval + one compose pass
- hard form: retrieval + compose + validate + repair

## 20. Memory Strategy

The current Pinecone sync model can remain, but the LLM layer should use richer chunk policies.

Recommended chunk additions:

- `DOMAIN_SPECIFIC_ANSWER`
  - tailored answers previously accepted for a known site/domain
- `SUCCESSFUL_FILL_PATTERN`
  - reusable patterns from successful form completions
- `USER_PREFERENCE`
  - preferences like preferred short bio, short summary length, tone

Future enhancement:

- feedback loop from successful user-edited outputs into memory

## 21. Evaluation Plan

The LLM layer should be evaluated on:

- field fill accuracy
- hallucination rate
- unresolved field rate
- dropdown mapping accuracy
- long-form answer relevance
- latency per autofill request
- token cost per autofill request

Recommended benchmark sets:

- simple contact forms
- job application forms
- long profile forms
- domain-specific forms:
  - LinkedIn
  - Workday
  - Greenhouse
  - Lever

## 22. Rollout Plan

### Phase 1

- keep current deterministic resolver
- wrap retrieval as LangChain retriever
- add LangGraph only for refinement path

### Phase 2

- add field classification node
- route unresolved fields through autofill graph
- add validation node and repair loop

### Phase 3

- add domain-specific tools and prompts
- learn from successful fills
- add analytics-driven optimization

## 23. Recommended Mental Model

The future Form Pilot LLM layer should behave less like:

- a chatbot answering arbitrary prompts

and more like:

- a controlled reasoning engine with access to user data, retrieval memory, and validation tools

In short:

```text
Deterministic resolver handles easy fields
RAG provides grounded user context
LangChain exposes tools and model interfaces
LangGraph orchestrates planning, composing, validating, and repairing
Final output stays structured and safe for browser autofill
```

## 24. Implementation Summary

The recommended architecture is:

- keep the current Prisma-backed profile model
- keep Pinecone as the user knowledge store
- wrap retrieval and DB access as LangChain tools
- build a LangGraph autofill graph and a LangGraph refinement graph
- use deterministic filling first, agentic filling second
- always validate before returning answers to the extension

This gives Form Pilot a practical agentic LLM layer without losing reliability.
