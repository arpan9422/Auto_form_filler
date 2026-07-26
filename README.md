# FormPilot — AI Form Filler

> **Intelligent form auto-completion powered by LangGraph, RAG, and your personal knowledge base.**
> Fill any web form instantly — from job applications to surveys — with AI-generated answers rooted in your real profile.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [AI / LLM Layer](#ai--llm-layer)
- [RAG System](#rag-system)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Chrome Extension](#chrome-extension)
- [Dashboard](#dashboard)

---

## Overview

FormPilot is a full-stack AI application built to automate form filling across any website. It combines a **Chrome extension** that detects and fills form fields on any page, a **Next.js dashboard** for managing your profile and viewing analytics, and a **Node.js/Express backend** that runs a multi-step LangGraph agent to generate contextually accurate answers.

The core intelligence comes from a **RAG (Retrieval-Augmented Generation)** pipeline backed by ChromaDB that stores and retrieves your personal profile data — work experience, education, projects, answers, and episodic chat history — to generate personalized, human-sounding responses for each form field.

---

## Architecture

```
+-------------------------------------------------------------+
|                     Chrome Extension                        |
|  +--------------+  +-----------------+  +---------------+  |
|  |   Popup UI   |  |  Content Script |  |   Background  |  |
|  |  (React/TSX) |  |  (Form Scanner) |  | Service Worker|  |
|  +--------------+  +-----------------+  +---------------+  |
+------------------------------|------------------------------+
                               |  HTTP / Chrome Messages
                               v
+-------------------------------------------------------------+
|                  Express Backend (Node.js)                   |
|                                                             |
|  +------------------------------------------------------+   |
|  |              LangGraph Autofill Agent                |   |
|  |  Intake -> Planner -> Context Retrieval -> Composer  |   |
|  |         -> Validator -> Repair (if needed)           |   |
|  +-------------------------+----------------------------+   |
|                            |                                |
|  +-------------------------v----------------------------+   |
|  |          RAG Service (ChromaDB + OpenAI Embeddings)  |   |
|  |  PERSONAL | PROJECT | EXPERIENCE | EDUCATION |        |   |
|  |  ANSWER   | RESUME  | EPISODIC                       |   |
|  +------------------------------------------------------+   |
|                                                             |
|  +------------------------------------------------------+   |
|  |               PostgreSQL (Prisma ORM)                |   |
|  +------------------------------------------------------+   |
+-------------------------------------------------------------+
          |
          v
+-------------------------------------------------------------+
|                   Next.js Dashboard                         |
|  Profile | Projects | Resume | Analytics | AI Memory | Chat |
+-------------------------------------------------------------+
```

---

## Tech Stack

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| ORM | Prisma v7 |
| Database | PostgreSQL 15 (Docker) |
| Vector Store | ChromaDB (Docker) |
| AI Orchestration | LangGraph (LangChain.js) |
| LLM | OpenAI GPT-4o / GPT-4o-mini |
| Embeddings | OpenAI text-embedding-3-small |
| File Storage | AWS S3 |
| Auth | JWT (Access + Refresh tokens) |

### Frontend

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript + React |
| Styling | Vanilla CSS + inline styles |
| Animation | GSAP + ScrollTrigger |
| Icons | Lucide React |

### Chrome Extension

| Layer | Technology |
|---|---|
| Framework | Vite + React (Manifest V3) |
| Language | TypeScript |
| Build | Vite |

---

## Features

### Autofill
- **One-click autofill** via a floating button injected on any page with a form
- **Universal form detection** — detects `input`, `textarea`, `select`, radio buttons, checkboxes, and dropdowns across any website
- **LangGraph multi-step agent** with 5 sequential nodes: Intake -> Planner -> Context -> Composer -> Validator
- **Deterministic pre-fill** for known fields (name, email, phone) before invoking the LLM
- **Repair loop** — automatically re-generates fields that fail JSON validation

### RAG Knowledge Base
- **7 chunk types**: `PERSONAL`, `PROJECT`, `EXPERIENCE`, `EDUCATION`, `ANSWER`, `RESUME`, `EPISODIC`
- **Smart type inference** — selects the most relevant chunk types based on field labels/context
- **Project priority** — higher-priority projects (1–5 stars) score higher in vector retrieval
- **Episodic memory** — past chat conversations are embedded and retrieved to maintain user context

### Dashboard
- **Profile management** — name, bio, skills, links, addresses
- **Work & Education** — full work history with role type and dates
- **Projects** — tech stacks, links, priority rating (influences LLM context)
- **Resume upload** — PDF upload to AWS S3, multiple resumes supported
- **Answer Library** — custom pre-written answers per category, used in RAG retrieval
- **AI Memory** — view, edit, and delete all RAG chunks that the AI uses about you
- **Chat Agent** — episodic conversational AI using your full profile for context
- **Usage Analytics** — forms filled, time saved, tokens used, top platforms, 7-day chart

### Extension
- **Floating button** — injected on every page with forms, shows real-time progress steps during filling
- **Popup UI** — quick autofill trigger and direct dashboard link
- **Progress states** — Reading form -> Classifying fields -> Gathering context -> Generating answers -> Validating

---

## Project Structure

```
Auto_form_filler/
+-- backend/                      # Express API
|   +-- prisma/
|   |   +-- schema.prisma         # Full DB schema
|   +-- src/
|       +-- config/               # DB, ChromaDB, Prisma connections
|       +-- middleware/           # Auth, logging, error handling
|       +-- modules/
|           +-- ai/               # LLM layer + RAG
|           |   +-- ai.controller.ts
|           |   +-- ai.service.ts
|           |   +-- rag.service.ts
|           |   +-- llm/
|           |       +-- graphs/
|           |       |   +-- autofill.graph.ts   # Main 5-node LangGraph agent
|           |       |   +-- chat.graph.ts        # Chat agent with episodic memory
|           |       |   +-- refine.graph.ts      # Field refinement agent
|           |       +-- models/       # LLM model instantiation
|           |       +-- prompts/      # System + user prompts
|           |       +-- schemas/      # Zod field schemas
|           |       +-- services/     # Agent service orchestrators
|           |       +-- tools/        # LangGraph tool definitions
|           +-- answer/           # Answer Library CRUD
|           +-- dashboard/        # Overview & analytics endpoints
|           +-- formFill/         # Form session persistence
|           +-- github/           # GitHub OAuth integration
|           +-- memory/           # RAG memory sync endpoint
|           +-- project/          # Projects CRUD
|           +-- resume/           # Resume upload (S3)
|           +-- user/             # User profile CRUD
|
+-- frontend/                     # Next.js 14 dashboard + landing
|   +-- src/
|       +-- app/
|       |   +-- page.tsx          # Landing home page
|       |   +-- auth/             # Login / Register
|       |   +-- dashboard/        # Main dashboard shell
|       |   +-- onboarding/       # First-time setup wizard
|       +-- components/
|       |   +-- dashboard/
|       |   |   +-- DashboardOverview.tsx   # Home stats + activity
|       |   |   +-- ProfileContext.tsx      # Full profile editor
|       |   |   +-- ProjectsSection.tsx     # Projects + priority UI
|       |   |   +-- ResumeSection.tsx       # Resume manager
|       |   |   +-- AnswersLibrary.tsx      # Custom answer library
|       |   |   +-- AIMemory.tsx            # RAG memory browser
|       |   |   +-- ChatAgent.tsx           # Episodic chat UI
|       |   |   +-- UsageAnalytics.tsx      # Analytics charts
|       |   +-- landing/          # Hero, Features, HowItWorks, CTA
|       |   +-- layout/           # Navbar, Footer
|       +-- lib/
|           +-- api.ts            # Axios instance + interceptors
|           +-- auth.ts           # JWT token helpers
|           +-- services.ts       # Typed API service layer
|
+-- extension/                    # Chrome Extension (MV3)
|   +-- public/
|   |   +-- manifest.json
|   +-- src/
|       +-- background/           # Service worker (message routing)
|       +-- content/
|       |   +-- content.ts        # Main content script entrypoint
|       |   +-- scraper.ts        # Form field detection + normalization
|       |   +-- formFiller.ts     # DOM field population
|       |   +-- formDetector.ts   # Heuristic form detection
|       |   +-- floatingButton.ts # Floating Auto Fill button
|       +-- popup/
|       |   +-- Popup.tsx         # Extension popup UI
|       +-- utils/
|           +-- api.ts            # Extension API client + auth helpers
|
+-- docker-compose.yml            # PostgreSQL + ChromaDB
```

---

## Database Schema

### Core Models

| Model | Description |
|---|---|
| `User` | Core user profile — name, email, phone, bio, skills |
| `Link` | Social/portfolio links (LinkedIn, GitHub, portfolio, etc.) |
| `Address` | Permanent / current / other addresses |
| `Education` | Institutions, degrees, GPA, dates |
| `Work` | Companies, positions, work type (INTERNSHIP/FULL_TIME/PART_TIME/FREELANCE) |
| `Project` | Projects with tech stacks, links, and priority (0–5) |
| `AnswerLibrary` | Custom pre-written answers by category |
| `Resume` | PDF resume metadata + S3 URL |
| `Memory` | RAG chunk registry (PERSONAL/PROJECT/EXPERIENCE/EDUCATION/ANSWER/RESUME/EPISODIC) |

### Analytics & Sessions

| Model | Description |
|---|---|
| `UsageAnalytics` | Per-fill record: platform, fields filled, tokens used, time saved |
| `FormSession` | Session-scoped field state for multi-step forms |
| `RequestLog` | HTTP request logging with auth context |
| `AppLog` | General application event log |

### Chat / Episodic Memory

| Model | Description |
|---|---|
| `ChatEpisode` | A conversation session with title and optional AI-generated summary |
| `ChatMessage` | Individual messages within an episode with RAG sources |
| `GitHubConnection` | OAuth token for GitHub integration |

---

## AI / LLM Layer

### Autofill Agent (autofill.graph.ts)

The main form-filling agent is a **5-node LangGraph StateGraph**:

```
START
  |
  v
[intake]            Normalize raw form fields, identify domain/platform,
  |                 resolve deterministic fields (name, email, phone)
  |                 without LLM calls
  v
[planner]           Plan which fields need LLM generation, group by
  |                 semantic category, classify field intent
  |
  v
[context_retrieval] Query ChromaDB with RAG for the most relevant
  |                 user profile chunks based on field types
  |
  v
[composer]          LLM generates all pending field answers using
  |                 the retrieved context, system prompt, and field metadata.
  |                 Output is a strict JSON map {fieldKey: value}
  |
  v
[validator]         Parse and validate the JSON. If fields are missing
  |                 or malformed, routes back to composer for repair
  |                 (up to 2 repair attempts)
  |
  v
END
```

**Key design decisions:**
- Deterministic pre-fill runs before any LLM call to save tokens on known fields
- The composer uses `getDomainToneBlock()` to inject platform-specific voice instructions (LinkedIn, Workday, Greenhouse, etc.)
- JSON output is parsed with a `safeParse` fallback that extracts valid JSON from markdown code blocks
- Token usage is aggregated across all nodes via an Annotation reducer

### Chat Agent (chat.graph.ts)

A conversational AI agent with **episodic memory persistence**:
- Loads the last N messages from `ChatEpisode`/`ChatMessage` tables as conversation history
- Embeds new exchanges into ChromaDB as `EPISODIC` chunks
- Retrieves relevant past episodes via semantic search to maintain long-term context
- Uses a custom humanized prompt — no formatting, no asterisks, short and natural by default

### Refine Agent (refine.graph.ts)

Handles post-fill refinement requests — updates specific fields based on natural language instructions without re-running the full pipeline.

---

## RAG System

### Chunk Types

| Type | Source Data |
|---|---|
| `PERSONAL` | Name, email, phone, bio, skills, location, links |
| `PROJECT` | Project name, description, tech stacks, links, priority |
| `EXPERIENCE` | Company, role, type, dates |
| `EDUCATION` | Institution, degree, GPA, dates |
| `ANSWER` | Custom answer library entries per category |
| `RESUME` | PDF resume label and target role |
| `EPISODIC` | Chat episode summaries and message history |

### Smart Type Inference

Before querying ChromaDB, the RAG service infers which chunk types are most relevant based on form field labels:

```
"skills"      -> PROJECT, EXPERIENCE
"experience"  -> EXPERIENCE, PROJECT
"education"   -> EDUCATION
"name/email"  -> PERSONAL
"portfolio"   -> PERSONAL, PROJECT
```

### Project Priority Scoring

| Priority | Label | RAG Score Boost |
|---|---|---|
| 5 | Featured | +10 |
| 4 | Showcase | +8 |
| 3 | Important | +5 |
| 2 | Standard | +2 |
| 1 | Low | +1 |
| 0 | Unrated | +0 |

### Sync Flow

After any profile update (work, education, project, answer):
1. Backend deletes existing RAG chunks for that user/type
2. Re-builds all chunks from the current DB state
3. Batch-upserts into ChromaDB with embeddings from `text-embedding-3-small`

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker + Docker Compose
- OpenAI API key
- AWS S3 bucket (for resume uploads)
- GitHub OAuth App (optional)

### 1. Clone and Install

```bash
git clone https://github.com/your-username/Auto_form_filler.git
cd Auto_form_filler
```

### 2. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL 15** on `localhost:5432` (database: `form_pilot`)
- **ChromaDB** on `localhost:8000`

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your values in .env

npm install

# Push schema to DB and generate Prisma client
npx prisma db push
npm run prisma:generate

# Start dev server
npm run dev
```

Backend runs on `http://localhost:5000`.

### 4. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

### 5. Chrome Extension Setup

```bash
cd ../extension
npm install
npm run build
```

Load in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/dist` folder

---

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
# Server
PORT=5000
NODE_ENV=development
API_BASE_URL=http://localhost:5000

# PostgreSQL
DATABASE_URL=postgresql://postgres:password123@localhost:5432/form_pilot

# JWT Auth
JWT_SECRET=your-fallback-jwt-secret
JWT_ACCESS_SECRET=your-access-jwt-secret
JWT_REFRESH_SECRET=your-refresh-jwt-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI (required)
OPENAI_API_KEY=sk-...

# AWS S3 (for resume uploads)
AWS_ACCESS_KEY_ID=your-key-id
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket-name

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-github-app-client-id
GITHUB_CLIENT_SECRET=your-github-app-client-secret
GITHUB_TOKEN=your-github-personal-access-token
FRONTEND_URL=http://localhost:3000

# ChromaDB
CHROMADB_PORT=8080
```

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, returns access + refresh tokens |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/logout` | Invalidate refresh token |

### User Profile

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user` | Get full user profile |
| `PUT` | `/api/user` | Update profile (name, bio, skills, links, etc.) |
| `PUT` | `/api/user/work` | Update work history |
| `PUT` | `/api/user/education` | Update education |
| `PUT` | `/api/user/address` | Update addresses |

### Projects

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create project |
| `PUT` | `/api/projects/:id` | Update project (includes priority) |
| `DELETE` | `/api/projects/:id` | Delete project |

### Resume

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/resume` | List all resumes |
| `POST` | `/api/resume` | Upload resume PDF to S3 |
| `DELETE` | `/api/resume/:id` | Delete resume |

### AI / Autofill

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/agent/fill` | Run the LangGraph autofill agent |
| `POST` | `/api/ai/generate` | Legacy deterministic fill (fallback) |
| `POST` | `/api/ai/agent/refine` | Refine specific fields post-fill |
| `POST` | `/api/ai/agent/chat` | Chat agent with episodic memory |
| `POST` | `/api/ai/rag/sync` | Re-sync all RAG chunks for a user |

### Dashboard & Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/overview` | Home stats (forms filled, time saved, recent sites) |
| `GET` | `/api/dashboard/analytics` | Full analytics (7-day chart, top platforms, tokens) |
| `POST` | `/api/dashboard/analytics` | Record a new fill event |

### Memory

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/memory` | List all RAG memory chunks |
| `DELETE` | `/api/memory/:id` | Delete a specific memory chunk |

---

## Chrome Extension

### Content Script (content.ts)
- Injected on every page
- Listens for `SCAN_AND_FILL` message from popup or `AUTOFILL_CLICKED` from the floating button
- Calls `getFormFields()` to scrape all form fields and their metadata
- Sends the field array + raw HTML to the background service worker

### Scraper (scraper.ts)
- Detects `input`, `textarea`, `select`, radio buttons, checkboxes
- Normalizes fields into a standard `{key, label, type, required, options}` format
- Uses heuristics to infer labels from `<label>` tags, `placeholder`, `aria-label`, `name` attributes

### Background Service Worker
- Receives `FORM_FIELDS_DETECTED` from the content script
- Calls the backend `/api/ai/agent/fill` endpoint with the fields + user token
- Sends the answer map back to the content script as `FILL_FIELDS`

### Form Filler (formFiller.ts)
- Receives the answer map `{fieldKey: value}`
- Programmatically sets values on each matched DOM element
- Fires `input`, `change`, `blur` events to trigger React/Vue/Angular form state updates
- Highlights filled fields with a brief amber outline animation

### Floating Button (floatingButton.ts)
- Injected on pages with forms
- Shows real-time progress steps as the fill proceeds
- States: `idle -> loading -> done / error / no_fields`
- Automatically resets to idle after 4 seconds

---

## Dashboard

| Tab | Description |
|---|---|
| **Home** | Overview stats: forms filled, time saved this week, AI edits, recent sites |
| **Profile** | Edit name, bio, skills, work history, education, addresses, links |
| **Projects** | Manage projects with tech stacks, links, and a 1–5 priority rating |
| **Resume** | Upload and manage PDF resumes (stored on AWS S3) |
| **AI Memory** | Browse all RAG chunks the AI knows about you — edit or delete any |
| **Answers** | Custom answer library per category — answers are embedded into RAG |
| **Chat** | Episodic AI chat assistant — ask it to write LinkedIn messages, emails, etc. |
| **Analytics** | Form fill history, 7-day chart, top platforms, token usage |

---

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) to get started.

Please adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md) when participating in this project.

---
---

## Security

For security vulnerabilities and reporting guidelines, please refer to our [Security Policy](./SECURITY.md).

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a detailed history of changes in each release.

---

## License

This project is licensed under the [MIT License](./LICENSE).
