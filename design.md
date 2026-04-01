# 🎨 AI Form Assistant – UI Style Guide

## 🚀 Design Philosophy

We are NOT building a typical “AI-looking” product.

### ❌ Avoid:

* Overused gradients
* ChatGPT-like bubbly UI
* Cartoonish AI elements
* Cluttered dashboards

### ✅ Aim for:

* Minimal
* Dark, premium feel
* Subtle motion
* Developer-tool aesthetic
* Confident typography

---

## 🧠 Visual Inspiration

Inspired by:

* Omnara (reference screenshot)
* Linear
* Vercel
* Raycast

---

## 🎯 Core Design Principles

### 1. Minimal but Powerful

* Fewer elements
* More breathing space
* Strong hierarchy

---

### 2. Dark First UI 🌑

Primary background:

```css
background: #0b0b0c;
```

Secondary layers:

```css
background: #111113;
```

Borders:

```css
border: 1px solid rgba(255,255,255,0.08);
```

---

### 3. Typography (VERY IMPORTANT)

Use clean, modern fonts:

* Inter
* Geist (preferred)
* SF Pro (if available)

---

### Heading Style:

```css
font-size: 64px;
font-weight: 600;
letter-spacing: -1px;
color: #e5e7eb;
```

👉 Big, bold, confident
👉 Slightly muted white (not pure white)

---

### Subtext:

```css
color: #9ca3af;
font-size: 16px;
```

---

## 🎨 Color System

### Base

* Background: `#0b0b0c`
* Surface: `#111113`
* Border: `rgba(255,255,255,0.08)`

---

### Accent (Primary)

```css
color: #6366f1;
```

👉 Use VERY sparingly

---

### Text

* Primary: `#e5e7eb`
* Secondary: `#9ca3af`
* Muted: `#6b7280`

---

## 🧩 Layout Structure (Landing Page)

---

### 🧱 Navbar

Minimal:

```text
[Logo]    Docs  Blog  Pricing    Contact      [Get Started]
```

Rules:

* Transparent background
* Slight blur on scroll
* No heavy borders

---

### 🧠 Hero Section (Like Screenshot)

Structure:

```text
Small badge (Backed by X)

BIG HEADING:
Your Form Copilot. Anywhere.

Subtext:
Fill forms instantly. Refine with AI.

[Primary CTA]   [Secondary CTA]
```

---

### Hero Styling

* Center aligned
* Huge heading (60–72px)
* Wide spacing
* Soft fade-in animation

---

## 💻 Code Block UI (IMPORTANT)

Inspired by screenshot:

```bash
curl -fsSL install.sh | bash
```

Style:

```css
background: #111113;
border-radius: 12px;
padding: 16px;
border: 1px solid rgba(255,255,255,0.08);
font-family: monospace;
```

---

## 🧩 Cards & Containers

```css
background: #111113;
border-radius: 16px;
border: 1px solid rgba(255,255,255,0.06);
padding: 20px;
```

---

## ⚡ Buttons

### Primary Button

```css
background: #ffffff;
color: #000000;
border-radius: 10px;
padding: 10px 16px;
font-weight: 500;
```

---

### Secondary Button

```css
background: transparent;
border: 1px solid rgba(255,255,255,0.1);
color: #e5e7eb;
```

---

## ✨ Motion & Interaction

### Animations:

* Fade-in (0.4s ease)
* Slight hover lift:

```css
transform: translateY(-2px);
```

---

### Hover Effects:

* Subtle glow
* Border highlight

---

## 🧠 Chat UI (Extension Style)

### Design Direction:

* Looks like **developer console + chat hybrid**
* Not WhatsApp-style bubbles

---

### Chat Container

```css
background: #0f0f10;
border-left: 1px solid rgba(255,255,255,0.08);
```

---

### Messages

User:

* Right aligned
* Slightly brighter

AI:

* Left aligned
* Muted tone

---

### Input Box

```css
background: #111113;
border: 1px solid rgba(255,255,255,0.08);
border-radius: 10px;
```

---

## 🧩 Extension UI Style

### Floating Button

* Small
* Circular
* Subtle glow
* Bottom-right

---

### Chat Panel

* Slides from right
* Width: ~320px
* Dark + minimal

---

## 🚫 What Makes It Look “AI Generated” (AVOID)

* Too many gradients
* Neon colors everywhere
* Rounded blobs
* Over-animated UI
* Excess shadows

---

## ✅ What Makes It Feel Premium

* Restraint
* Spacing
* Typography
* Subtle interactions
* Consistency

---

## 🧠 Final Design Goal

The product should feel like:

👉 A **developer tool**
👉 A **serious productivity system**
👉 Not a gimmicky AI app

---

## 🔥 Tagline Direction

* “Your Form Copilot. Anywhere.”
* “Fill. Refine. Done.”
* “AI that actually does the work.”

---

## 📌 Implementation Notes

* Use Tailwind CSS
* Maintain consistent spacing scale (8px grid)
* Avoid random colors
* Keep everything aligned and intentional

---

## ✅ Final Check

Before shipping any UI:

* Is it simple?
* Is it clean?
* Does it feel premium?
* Would a developer trust this?

If YES → ship it 🚀

---
