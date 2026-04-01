# 💰 AI Form Assistant – Pricing Model

## 🚀 Overview

We are implementing a **freemium pricing model** designed to:

* Let users experience real value quickly
* Encourage habit formation
* Convert power users into paid users

---

## 🧠 Core Pricing Strategy

### 🎯 Philosophy

* Give enough free usage to hook users
* Charge when usage becomes valuable
* Keep pricing simple and transparent

---

## 🆓 Free Tier (Starter Plan)

### Limits:

* ✅ **10 form fills per week**
* ✅ Full AI capabilities (no feature restriction)
* ✅ Chat refinement included

---

### Included Features:

* AI autofill
* Chat-based refinement
* RAG-powered context
* Basic history

---

### Restrictions:

* Weekly cap (10 forms)
* No priority processing
* Limited history retention

---

### Reset Logic:

* Usage resets every 7 days
* Based on user account timestamp

---

## 💎 Paid Tier (Pro Plan)

### Pricing:

* ₹299/month *(suggested for India market)*
* OR $5/month (global)

---

### Limits:

* 🚀 Unlimited form fills
* 🚀 Faster AI responses
* 🚀 Priority processing

---

### Features:

* Unlimited AI autofill
* Unlimited chat refinement
* Full history access
* Advanced context memory
* Priority RAG retrieval

---

## ⚡ Optional Tier (Power Users / Future)

### Pro+ Plan (Future)

* ₹599/month
* Features:

  * Multi-profile support
  * Resume upload & parsing
  * Job-specific optimization
  * Analytics (which answers perform best)

---

## 🧮 Usage Definition (IMPORTANT)

### What counts as **1 form fill**?

A "form fill" is counted when:

* User clicks **Auto Fill**
* AND at least one field is filled by AI

---

### What does NOT count?

* Chat refinements
* Edits after filling
* Manual typing

---

## 🔌 Backend Implementation Logic

### Track Usage

```ts id="c6lpxr"
model Usage {
  id        String   @id @default(uuid())
  userId    String
  count     Int
  weekStart DateTime
}
```

---

### Logic

```ts id="9u8y9p"
if (user.plan === "FREE" && usage.count >= 10) {
  throw new Error("Weekly limit reached");
}
```

---

## 🚫 Limit Reached UX

When user hits limit:

```text id="a5z3jx"
You've reached your weekly limit (10 forms).

Upgrade to Pro for unlimited access.

[ Upgrade Now ]
```

---

## 🎨 Upgrade Triggers (IMPORTANT)

Show upgrade prompts when:

* User reaches 80% usage (8/10 forms)
* User hits limit
* User tries to autofill again

---

## 🧠 Psychological Triggers

* “You saved 2 hours this week”
* “Used in 8 applications”
* “Upgrade to continue momentum”

---

## 💳 Payment Integration

### Recommended:

* Stripe (global)
* Razorpay (India)

---

## 🔐 Plan Storage

```ts id="2nl21q"
model User {
  id        String
  email     String
  plan      String   @default("FREE")
}
```

---

## 📊 Metrics to Track

* Free → Paid conversion rate
* Avg forms per user
* Retention after 7 days
* Most active users

---

## 🚀 Growth Strategy

### Phase 1:

* Keep pricing simple (Free + Pro)

---

### Phase 2:

* Add annual discount
* Add Pro+ tier

---

### Phase 3:

* Team plans (recruiters, agencies)

---

## ✅ Final Goal

Create a pricing model that:

* Feels fair
* Encourages usage
* Converts naturally

👉 Users should think:
“I’m already using this so much… paying makes sense.”

---
