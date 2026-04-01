# 🧠 AI Form Assistant – System Design & Implementation Guide (v2)

## 🚀 Overview

We are building an **AI-powered Chrome Extension + Web App** that acts as a **Form Copilot**.

Instead of previewing answers before filling, the system:

* Instantly fills forms using AI
* Opens a **chat-based refinement UI**
* Lets users iteratively improve answers via conversation
* Learns from user edits over time

---

## 🔥 Core UX (IMPORTANT CHANGE)

### Old Flow ❌

Generate → Preview → Fill

### New Flow ✅

Generate → Fill → Chat Refine

---

## 🧠 Final User Flow

### 1. User clicks “Auto Fill”

* Extension detects fields
* AI generates answers using RAG
* Fields are filled instantly

---

### 2. Chat UI Opens (Side Panel / Floating)

```text
🤖 Form Assistant

I’ve filled the form for you.

You can:
• Improve answers
• Change tone
• Add/remove details

Type your instruction...
```

---

### 3. User Interacts via Chat

Examples:

* “Make this more professional”
* “Shorten all answers”
* “Add my project Wisdomly”
* “Rewrite for a startup role”

---

### 4. AI Updates Form in Real-Time

* Only modified fields are updated
* Fields briefly highlighted (UX feedback)
* No manual copy-paste required

---

## 🏗️ Tech Stack

### Frontend

* Web App: Next.js (React)
* Extension UI: React (Vite)
* Styling: Tailwind CSS

### Backend

* Node.js + Express.js

### Database

* PostgreSQL via Supabase
* ORM: Prisma

### AI + Context

* LLM: OpenAI
* Embeddings: OpenAI `text-embedding-3-small`
* Vector DB: Pinecone
* Memory Layer (optional): Zep

---

## 🧠 Core Architecture

```text
Chrome Extension
    ↓
Backend API (Express)
    ↓
RAG Pipeline
    ↓
Pinecone (vector search)
    ↓
OpenAI (generation)
    ↓
Extension fills form + opens chat UI
```

---

## 🧩 Key Features

### 1. Form Detection (Extension)

* Detect inputs, textareas, selects
* Extract:

  * label
  * placeholder
  * name

---

### 2. Instant Autofill (NO PREVIEW)

* AI generates answers
* Fields filled immediately

---

### 3. Chat-Based Refinement (CORE FEATURE)

* Floating chat panel
* User modifies answers conversationally
* AI updates DOM in real-time

---

### 4. Feedback Learning

* Store user edits
* Improve future responses

---

## 🧠 RAG SYSTEM DESIGN

### Why RAG?

Avoid rigid structured storage.
Use embeddings to dynamically fetch relevant context.

---

### Data Stored in Pinecone

```json
{
  "id": "uuid",
  "type": "project | personal | experience | custom_answer",
  "content": "User built Wisdomly, a freelancing platform...",
  "metadata": {
    "userId": "user_id"
  }
}
```

---

### Embedding Flow

1. User adds data (projects, answers, etc.)
2. Convert to embeddings
3. Store in Pinecone

---

### Query Flow

1. Form field → embedding
2. Query Pinecone
3. Retrieve top-k context
4. Send to LLM

---

### Prompt Example (Initial Fill)

```text
You are an AI form assistant.

User Context:
{retrieved_context}

Form Fields:
{fields}

Generate answers for each field in JSON format.
```

---

## 💬 CHAT REFINEMENT SYSTEM (CORE)

### Request Format

```json
{
  "message": "Make this more professional",
  "formState": {
    "whyHire": "I am a builder focused on..."
  }
}
```

---

### Prompt for Chat Refinement

```text
You are an AI form assistant.

Current Form Data:
{form_state}

User Instruction:
{user_message}

Update ONLY the necessary fields.

Return JSON:
{
  "fieldName": "updated value"
}
```

---

### Response Example

```json
{
  "whyHire": "I am a highly motivated engineer with strong experience in building scalable systems..."
}
```

---

### Frontend Behavior

* Parse response
* Update corresponding fields
* Highlight updated inputs

---

## 🗄️ Prisma Schema (Supabase PostgreSQL)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  createdAt DateTime @default(now())
}

model Project {
  id          String   @id @default(uuid())
  userId      String
  title       String
  description String
  techStack   String
  createdAt   DateTime @default(now())
}

model CustomAnswer {
  id        String   @id @default(uuid())
  userId    String
  question  String
  answer    String
  createdAt DateTime @default(now())
}

model Feedback {
  id        String   @id @default(uuid())
  userId    String
  field     String
  aiAnswer  String
  userEdit  String
  createdAt DateTime @default(now())
}
```

---

## 🔌 Backend API Design

### Auth

* POST `/auth/signup`
* POST `/auth/login`

---

### User Data

* GET `/user`
* POST `/project`
* GET `/projects`
* POST `/custom-answer`

---

### AI Endpoints

#### 1. Initial Autofill

```
POST /ai/generate
```

Body:

```json
{
  "fields": [
    { "label": "Why should we hire you?" }
  ]
}
```

---

#### 2. Chat Refinement

```
POST /ai/chat
```

Body:

```json
{
  "message": "Make this shorter",
  "formState": { ... }
}
```

---

#### 3. Feedback

```
POST /ai/feedback
```

---

## 🧩 Chrome Extension Architecture

### Content Script

* Detect form fields
* Fill inputs
* Inject chat UI
* Highlight updates

---

### Popup UI

* Trigger autofill
* Select mode/profile (optional)

---

### Background Script

* API communication

---

## 🎨 Extension UI

### Floating Button

```
⚡ Auto Fill
```

---

### Chat Panel (Core UI)

```text
--------------------------------
🤖 Form Assistant

I’ve filled the form for you.

--------------------------------
User: Make it shorter

AI: Updated 2 fields ✅

--------------------------------
User: Add my project Wisdomly

AI: Added it ✅
--------------------------------
```

---

### UX Enhancements

* Highlight updated fields
* Show “Updated ✨”
* Quick action buttons:

  * Make Shorter
  * Make Formal
  * Regenerate All

---

## 🌐 Web App Features

### Dashboard

* Profile
* Projects
* Custom Answers

---

### Project Management

* Add / Edit / Delete projects

---

### Custom Answers

* Predefined responses

---

## 🔐 Security & Privacy

* Never auto-submit forms
* Ask before filling sensitive fields
* Secure API communication

---

## 🚀 MVP Roadmap

### Phase 1

* Basic extension
* Static autofill

---

### Phase 2

* AI autofill (no preview)
* Chat UI

---

### Phase 3

* Backend + Prisma + Supabase

---

### Phase 4

* RAG (Pinecone)
* Feedback learning

---

## 💡 Future Enhancements

* Resume parsing
* LinkedIn autofill
* One-click job applications
* ATS optimization
* Personal AI identity layer

---

## ✅ Final Vision

Build a system that behaves like:

👉 **“Cursor for Forms”**
👉 **“AI Copilot that fills and edits forms in real-time”**

---
