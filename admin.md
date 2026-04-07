# Form Pilot Admin Portal Specification

This document outlines the recommended structure and features for the **Form Pilot Admin Portal**. The admin portal will act as the central control center for managing users, credits, forms, payments, AI usage, and system health.

---

## 1. Dashboard (Main Overview)

The first screen after admin login should provide a quick snapshot of product health.

### KPI Cards

* Total Users
* Active Users (Today / This Week)
* New Signups
* Forms Filled Today
* Credits Used Today
* Revenue
* Conversion Rate (Free → Paid)
* Failed Autofill Attempts
* AI Token Usage
* Extension Active Sessions

### Charts

* Daily signups
* Daily form submissions
* Credit usage trends
* Revenue trends
* Top active users
* Most-used websites

---

## 2. User Management

Manage all registered users from a central table.

### Table Columns

* Name
* Email
* Signup Date
* Plan / Credits
* Credits Left
* Total Forms Filled
* Last Active
* Status (Active / Blocked)

### Admin Actions

* View user details
* Block / unblock user
* Suspend account
* Delete account
* Manually add credits
* Deduct credits
* Upgrade plan
* Reset password link
* Impersonate user

---

## 3. Credits & Billing Management

A dedicated section for tracking and managing user credits.

### Features

* Total credits purchased
* Credits consumed
* Credit history
* Refund credits
* Bonus credits
* Promotional credits
* Expired credits

### Credit Ledger Example

| Action | Credits | Reason      | Date  |
| ------ | ------: | ----------- | ----- |
| Added  |    +100 | Purchase    | 3 Apr |
| Used   |      -5 | Resume fill | 3 Apr |
| Bonus  |     +20 | Referral    | 3 Apr |

---

## 4. Payment Management

Track all financial transactions.

### Features

* Payment status
* Successful payments
* Failed payments
* Refunds
* Invoices
* Subscription history
* Webhook logs

### Fields

* Transaction ID
* Amount
* User
* Status
* Payment Gateway
* Date

---

## 5. Form Activity Monitoring

Core analytics module for Form Pilot.

### Fields

* User
* Website URL
* Website Domain
* Fields Detected
* Fields Successfully Filled
* Failed Fields
* AI Used / Cached
* Fill Time
* Browser

### Example Table

| User   | Website  | Success Rate |
| ------ | -------- | -----------: |
| Arpan  | LinkedIn |          95% |
| User 2 | Workday  |          72% |

---

## 6. Website / Domain Performance

Track performance domain-wise.

### Supported Domains

* LinkedIn
* Workday
* Lever
* Greenhouse
* Taleo

### Metrics

* Total fills
* Success percentage
* Average fill time
* AI token usage
* Failed selectors
* Dropdown issues

---

## 7. AI / LLM Usage Monitoring

Track AI costs and performance.

### Metrics

* Total tokens used
* Total prompts
* Average response time
* Failed requests
* Retry count
* Cache hit rate
* Vector DB queries
* Model used

---

## 8. Resume / Data Storage Management

Manage uploaded resumes and extracted data.

### Features

* Uploaded resumes
* Storage used
* Parsed status
* Extraction success
* Version history

### Extracted Sections

* Skills
* Education
* Projects
* Experience

---

## 9. Prompt / AI Rules Management

Allow admin to edit AI prompts dynamically.

### Editable Prompts

* System prompt
* Field extraction prompt
* Autofill formatting rules
* Tone rules

---

## 10. Support / Issue Management

Integrated ticketing system.

### Ticket Types

* Autofill failed
* Credits issue
* Payment failed
* Extension bug

### Fields

* Ticket ID
* User
* Priority
* Issue type
* Status
* Assigned admin

### Status Options

* Open
* In Progress
* Resolved

---

## 11. Error Logs / System Logs

For debugging and operational monitoring.

### Track

* Backend errors
* Extension errors
* API failures
* Scraping failures
* Authentication issues
* Database errors

### Filters

* Severity
* Date
* User
* Endpoint

---

## 12. Content / Announcements

Broadcast messages to users.

### Use Cases

* Maintenance alerts
* New feature launches
* Credits offers
* Downtime notices

---

## 13. Referral / Promo Code Management

Growth and marketing module.

### Features

* Create coupon codes
* Referral rewards
* Discount percentages
* Expiry dates

### Example

`FORMPILOT50` → 50 bonus credits

---

## 14. Product Analytics

Useful for growth and retention decisions.

### Track

* Most-used feature
* Drop-off step
* Failed onboarding step
* Signup abandonment rate

---

## 15. Role-Based Access Control

Support multiple admin roles.

### Roles

* Super Admin
* Support Admin
* Finance Admin
* Analytics Viewer

---

## MVP Priority Modules

### Priority 1

* Dashboard
* User Management
* Credits
* Payments
* Form Activity
* Error Logs

### Priority 2

* AI Monitoring
* Tickets
* Domain Analytics
* Announcements

---

## Recommended Tech Stack

* Next.js
* Tailwind CSS
* shadcn/ui
* Recharts
* TanStack Table
* Prisma
* PostgreSQL

---

## Final Recommendation

For the first production version, prioritize:

1. Dashboard
2. User & credits management
3. Form analytics
4. Payment logs
5. Error monitoring

These modules will make Form Pilot feel like a production-grade SaaS platform.
