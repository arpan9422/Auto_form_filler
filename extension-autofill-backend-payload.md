# Extension Autofill -> Backend Payload

This file explains what happens when the user clicks the `Auto Fill` button in the browser extension, and what data is intended to be sent to the backend.

## Short answer

Right now, clicking the extension's `Auto Fill` button does **not** send a backend API request.

The current flow is:

1. The floating button dispatches an `AUTOFILL_CLICKED` event.
2. The content script scrapes the form fields from the page.
3. The content script sends those fields to the background script with `chrome.runtime.sendMessage`.
4. The background script generates **mock answers locally**.
5. The background script sends the generated answers back to the content script to fill the form.

So, at the moment:

- Data sent from content script to background script: `FORM_FIELDS_DETECTED`
- Data sent from background script to backend: **nothing**

## Current click flow

### 1. Floating button click

When the `Auto Fill` button is clicked, the extension dispatches:

```ts
window.dispatchEvent(new CustomEvent("AUTOFILL_CLICKED"));
```

### 2. Content script scans the page

The content script listens for that event and calls `scanFormsOnDemand()`.

That function collects form fields using `getFormFields()` and sends:

```ts
chrome.runtime.sendMessage({
  type: "FORM_FIELDS_DETECTED",
  data: formFields,
});
```

## What the extension currently sends internally

The payload sent from the content script to the background script looks like this:

```json
{
  "type": "FORM_FIELDS_DETECTED",
  "data": [
    {
      "id": "email",
      "label": "Email",
      "placeholder": "Enter your email",
      "name": "email",
      "tag": "input",
      "inputType": "email",
      "required": true,
      "options": [],
      "selector": "#email",
      "formId": "form-0",
      "role": null
    }
  ]
}
```

## Form field shape

Each scraped field can contain:

```ts
type FormField = {
  id: string;
  label: string;
  placeholder?: string;
  name?: string;
  tag: "input" | "textarea" | "select" | "div" | "text";
  inputType?: string;
  required: boolean;
  options?: string[];
  selector: string;
  formId?: string;
  role?: string;
};
```

## What happens next today

The background script receives:

```json
{
  "type": "FORM_FIELDS_DETECTED",
  "data": [/* scraped fields */]
}
```

Then it:

1. Calls `generateAnswers(fields)`
2. Uses hardcoded mock data
3. Sends this back to the content script:

```json
{
  "type": "FILL_FIELDS",
  "data": {
    "#email": "test@example.com",
    "[name=\"fullname\"]": "John Doe"
  }
}
```

This means the current implementation fills the page without calling `/api/ai/generate`.

## What the backend expects

The backend route already exists:

- `POST /api/ai/generate`

It expects an authenticated JSON body shaped like:

```json
{
  "fields": [
    {
      "label": "Email",
      "placeholder": "Enter your email",
      "name": "email",
      "type": "email"
    },
    {
      "label": "Full name",
      "placeholder": "Your full name",
      "name": "fullName",
      "type": "text"
    }
  ]
}
```

## Important mismatch to know

There is a mismatch between:

- The richer field object produced by `getFormFields()` in the content script
- The simpler field object expected by the backend AI service

The backend AI service currently uses fields shaped like:

```ts
interface FormField {
  label: string;
  placeholder?: string;
  name?: string;
  type?: string;
}
```

So if we wire the extension to the backend, we should send:

```json
{
  "fields": [
    {
      "label": "Email",
      "placeholder": "Enter your email",
      "name": "email",
      "type": "email"
    }
  ]
}
```

Not the full internal scraper object unless the backend is updated to support it.

## Recommended backend request payload

If the extension is updated to call the backend on autofill click, the request should be:

### Endpoint

`POST http://localhost:5000/api/ai/generate`

### Headers

```http
Content-Type: application/json
Authorization: Bearer <token>
```

### Body

```json
{
  "fields": [
    {
      "label": "Email",
      "placeholder": "Enter your email",
      "name": "email",
      "type": "email"
    },
    {
      "label": "Country",
      "placeholder": "",
      "name": "country",
      "type": "select"
    }
  ]
}
```

## Summary

When the extension autofill button is clicked:

- The extension currently sends scraped fields to the background script, not the backend.
- The current message is `FORM_FIELDS_DETECTED`.
- The background script currently generates mock answers locally.
- The backend endpoint that should eventually receive data is `POST /api/ai/generate`.
- That backend expects the payload in the form:

```json
{
  "fields": [...]
}
```

## Relevant files

- `extension/src/content/floatingButton.ts`
- `extension/src/content/content.ts`
- `extension/src/content/scraper.ts`
- `extension/src/background/background.ts`
- `backend/src/modules/ai/ai.routes.ts`
- `backend/src/modules/ai/ai.controller.ts`
- `backend/src/modules/ai/ai.service.ts`
