# Contributing to FormPilot

First off, thanks for taking the time to contribute! FormPilot is an open-source project and we welcome contributions of all kinds — bug fixes, new features, documentation improvements, and more.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Project Structure Guide](#project-structure-guide)
- [Areas Where We Need Help](#areas-where-we-need-help)

---

## Code of Conduct

This project adheres to our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold it. Please report unacceptable behaviour to the maintainers.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/Auto_form_filler.git
   cd Auto_form_filler
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/arpan9422/Auto_form_filler.git
   ```
4. **Set up the development environment** (see [Development Setup](#development-setup))
5. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

---

## How to Contribute

### Reporting Bugs

Before filing a bug report, please:
- Search existing [issues](../../issues) to avoid duplicates
- Make sure you can reproduce it on the latest `main` branch

When filing a bug, use the **Bug Report** issue template and include:
- A clear, descriptive title
- Steps to reproduce the bug
- Expected vs actual behaviour
- Screenshots or logs if applicable
- Your environment (OS, Node version, browser version)

### Suggesting Features

Use the **Feature Request** issue template and describe:
- The problem you are solving
- Your proposed solution
- Any alternatives you have considered

### Improving Documentation

Documentation PRs are always welcome. This includes:
- Fixing typos or unclear wording in `README.md`
- Adding usage examples
- Improving inline code comments

### Submitting Code

Check the [Areas Where We Need Help](#areas-where-we-need-help) section for ideas. For larger changes, **open an issue first** to discuss the approach before investing time in implementation.

---

## Development Setup

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Docker** and Docker Compose
- **OpenAI API Key** (required for LLM features)
- **AWS S3 Bucket** (required for resume upload feature)

### 1. Start Infrastructure

```bash
docker-compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your API keys

npm install
npx prisma db push
npm run prisma:generate
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Chrome Extension

```bash
cd extension
npm install
npm run build
# Load extension/dist in chrome://extensions with Developer mode on
```

### Running Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

---

## Coding Standards

### TypeScript

- Use strict TypeScript — avoid `any` wherever possible
- Define proper interfaces and types in the relevant `types/` or `schemas/` directory
- Use Zod for runtime validation of incoming data

### Backend

- Follow the existing module pattern: `module.controller.ts`, `module.service.ts`, `module.repository.ts`, `module.routes.ts`
- All database queries go in `*.repository.ts`, business logic in `*.service.ts`
- Use `AppError` for all thrown errors with appropriate HTTP status codes
- Wrap async route handlers with `asyncHandler`

### Frontend

- Use functional React components with hooks
- Keep component files focused — split large components into smaller ones
- Use the typed `services.ts` layer for all API calls, never `fetch` directly in components
- Follow the existing inline-styles approach for dashboard components

### Extension

- Content scripts must not introduce memory leaks — clean up all event listeners
- All API calls go through `utils/api.ts`
- Message types must be documented in comments at point of use

### General

- No console.log in production code — use the existing logger utilities
- Keep PR scope focused — one feature or fix per PR

---

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:**

| Type | Usage |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `refactor` | Code change that is neither a fix nor a feature |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Build process, dependency updates |
| `ci` | CI/CD configuration changes |

**Examples:**

```
feat(extension): add drag-and-drop support for resume injection
fix(rag): correct token count accumulation across graph nodes
docs(readme): add ChromaDB setup section
chore(deps): bump langchain to 0.3.15
```

---

## Pull Request Process

1. **Sync with upstream** before starting:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Write a clear PR description** using the PR template — explain *what* and *why*, not just *how*

3. **Keep PRs focused** — one feature or fix per PR. Avoid mixing refactors with feature work

4. **Link the related issue** in the PR description:
   ```
   Closes #42
   ```

5. **All checks must pass** — TypeScript compilation, linting, and any existing tests

6. **Respond to review feedback** promptly. PRs with no activity for 14 days may be closed

7. **Squash commits** before merging if your branch has many small/fixup commits

---

## Project Structure Guide

When adding a new backend module, follow this pattern:

```
src/modules/<your-module>/
  <module>.routes.ts       # Express router
  <module>.controller.ts   # Request/response handling
  <module>.service.ts      # Business logic
  <module>.repository.ts   # DB queries (Prisma)
```

When adding a new LangGraph node or graph:

- Define state shape using `Annotation.Root` in the graph file
- Keep node functions pure and side-effect-free where possible
- Use the shared `getBaseFastModel()` / `getReasoningModel()` from `llm/models/`

When adding a new frontend dashboard tab:

- Create a component in `frontend/src/components/dashboard/`
- Add the tab config to the `TABS` array in `dashboard/page.tsx`
- Add API calls to `frontend/src/lib/services.ts` with proper types

---

## Areas Where We Need Help

Here are specific areas where contributions would be most valuable:

| Area | Description |
|---|---|
| **More form site support** | Improve field detection/normalization for specific ATS platforms (Lever, Ashby, Rippling, etc.) |
| **Test coverage** | Unit and integration tests for backend services and graph nodes |
| **Field type support** | Better support for date pickers, rich text editors, file inputs |
| **Onboarding UX** | Improve the first-time setup wizard flow |
| **Extension UI polish** | Improve the popup UI design |
| **CI/CD pipeline** | GitHub Actions for automated testing and linting |
| **Docker improvements** | Production-ready Docker setup for full-stack deployment |
| **Internationalization** | i18n support for non-English form fields |

---

## Questions?

If you are unsure about anything, feel free to open a [Discussion](../../discussions) or mention it in the relevant issue. We are happy to help!
