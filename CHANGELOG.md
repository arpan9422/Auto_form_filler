# Changelog

All notable changes to FormPilot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- Open-source community files (CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, issue templates)
- Project priority system (1–5 stars) that influences LLM context retrieval via RAG scoring
- Episodic memory for Chat Agent — past conversations persisted in `ChatEpisode`/`ChatMessage` tables and embedded in ChromaDB
- Chat Agent dashboard tab with full episode history and RAG-backed responses
- Forms Filled count on the dashboard home overview card

### Changed
- Logout redirect now goes to home page (`/`) instead of `/auth`
- Removed post-autofill chat popup from Chrome extension
- Removed Pricing section from landing page
- Removed "Chat Refinement" from landing page features — replaced with "Smart Context Matching"
- Step 3 in How It Works now reads "Review & Submit" instead of "Refine via Chat"
- Removed "Avg. fill time" stat from Hero and HowItWorks sections
- Extension "Get" button removed from Uploaded Documents (feature removed)

### Fixed
- `classify_fields` LangGraph node: escaped curly braces in JSON examples inside prompt templates to prevent LangChain variable interpolation errors
- Chat agent prompt: escaped JSON examples in system prompt that caused `INVALID_PROMPT_INPUT` errors

---

## [0.1.0] - 2025-07-01

### Added
- Initial release of FormPilot
- Chrome Extension (Manifest V3) with content script, floating button, popup UI
- Universal form field detection and DOM-level form filling
- LangGraph 5-node autofill agent: Intake → Planner → Context → Composer → Validator
- RAG system with ChromaDB and OpenAI embeddings
- 7 RAG chunk types: PERSONAL, PROJECT, EXPERIENCE, EDUCATION, ANSWER, RESUME, EPISODIC
- Smart type inference for RAG queries based on field labels
- Next.js 14 dashboard with profile management, projects, resume upload, analytics
- Answer Library with per-category custom answers embedded into RAG
- AI Memory browser — view and manage all RAG chunks
- JWT authentication with access + refresh token rotation
- AWS S3 resume upload
- GitHub OAuth integration
- Usage analytics with 7-day chart, token tracking, platform breakdown
- PostgreSQL database with Prisma ORM
- Docker Compose setup for PostgreSQL + ChromaDB
