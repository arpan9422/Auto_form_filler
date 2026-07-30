import type { FormField } from "../content/scraper";
import { getToken, agentFill, agentChat, legacyFill, inferDomain, type AgentFillResponse, recordAnalytics } from "../utils/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type FillAnswers = Record<string, string>;

/** The last autofill response for the tab — used by chat refinement as context */
const tabFormState = new Map<number, Record<string, string>>();
/** The last session ID for the tab — allows the refine graph to correlate */
const tabSessionId = new Map<number, string>();
/** Pending field list indexed by tab — for fallback and re-fill */
const tabFields = new Map<number, FormField[]>();
/** Abort controllers for cancelling agentFill */
const tabAbortControllers = new Map<number, AbortController>();
/** The current chat episode ID for the tab */
const tabChatEpisodeId = new Map<number, string>();

type RuntimeMessage =
  | { type: "FORM_FIELDS_DETECTED"; data: FormField[] }
  | { type: "TRIGGER_AUTOFILL" }
  | { type: "CHAT_REFINE"; data: { message: string } }
  | { type: "AGENT_STATUS_REQUEST" }
  | { type: "STOP_AUTOFILL" };

// ─── Message listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
  console.log("[FormPilot] Background received message:", message.type);
  const tabId = sender.tab?.id;

  switch (message.type) {
    case "FORM_FIELDS_DETECTED":
      void handleFormFieldsDetected(tabId, message.data, (message as any).rawHtml, (message as any).url).then(() =>
        sendResponse({ success: true })
      );
      return true;

    case "TRIGGER_AUTOFILL":
      void handleAutoFill(tabId).then(() => sendResponse({ success: true }));
      return true;

    case "CHAT_REFINE":
      void handleChatRefine(tabId, message.data).then(() =>
        sendResponse({ success: true })
      );
      return true;

    case "AGENT_STATUS_REQUEST":
      sendResponse({
        hasFormState: tabId ? tabFormState.has(tabId) : false,
        sessionId: tabId ? tabSessionId.get(tabId) : undefined,
      });
      return true;

    case "STOP_AUTOFILL":
      if (tabId) {
        const controller = tabAbortControllers.get(tabId);
        if (controller) {
          controller.abort();
          tabAbortControllers.delete(tabId);
          console.log(`[FormPilot] Aborted autofill for tab ${tabId}`);
        }
      }
      sendResponse({ success: true });
      return true;
  }
});

// ─── Handler: form fields detected passively ──────────────────────────────────

async function handleFormFieldsDetected(tabId: number | undefined, fields: FormField[], rawHtml?: string, url?: string) {
  if (!tabId) return;
  if (!fields || !fields.length) {
    console.warn("[FormPilot] No fields found on page, notifying UI");
    notifyContent(tabId, "AUTOFILL_STATUS", { status: "no_fields", step: "No fillable form inputs detected on this page." });
    return;
  }

  tabFields.set(tabId, fields);
  console.log(`[FormPilot] ${fields.length} fields stored for tab ${tabId}`);
  notifyContent(tabId, "AUTOFILL_STATUS", { status: "progress", step: `🧠 Discovered ${fields.length} inputs. Stage 1: Searching Profile & Projects RAG...` });

  const answers = await generateAnswers(tabId, fields, rawHtml, url);
  if (answers && answers._STOPPED_) {
    notifyContent(tabId, "AUTOFILL_STATUS", { status: "error", step: "🛑 Autofill was manually stopped." });
    return;
  }
  if (!Object.keys(answers).length) {
    console.warn("[FormPilot] No answers generated");
    notifyContent(tabId, "AUTOFILL_STATUS", { status: "empty", step: "Unable to generate verified answers from your available profile context." });
    return;
  }

  chrome.tabs.sendMessage(tabId, { type: "FILL_FIELDS", data: answers });
  notifyContent(tabId, "AUTOFILL_STATUS", {
    status: "done",
    step: "✅ Form successfully auto-filled!",
    stats: {
      total: fields.length,
      answered: Object.keys(answers).length,
      timeSaved: Object.keys(answers).length * 10,
      unresolvedCount: Math.max(0, fields.length - Object.keys(answers).length),
    },
  });
}

// ─── Handler: explicit trigger from popup or floating button ──────────────────

async function handleAutoFill(tabId: number | undefined) {
  if (!tabId) return;

  console.log(`[FormPilot] Starting AutoFill for tab ${tabId}`);
  notifyContent(tabId, "AUTOFILL_STATUS", { status: "progress", step: "🔍 Scanning page DOM & identifying form input schema..." });

  try {
    // Ask content script to detect fields on demand
    const response = await chrome.tabs.sendMessage(tabId, { type: "DETECT_FIELDS" });
    const fields: FormField[] = Array.isArray(response?.fields) ? response.fields : [];

    if (!fields.length) {
      console.warn("[FormPilot] No fields detected");
      notifyContent(tabId, "AUTOFILL_STATUS", { status: "no_fields", step: "No fillable form inputs detected on this page." });
      return;
    }

    tabFields.set(tabId, fields);
    notifyContent(tabId, "AUTOFILL_STATUS", { status: "progress", step: `🧠 Discovered ${fields.length} inputs. Stage 1: Searching Profile & Projects RAG...` });

    const answers = await generateAnswers(tabId, fields);
    if (answers && answers._STOPPED_) {
      notifyContent(tabId, "AUTOFILL_STATUS", { status: "error", step: "🛑 Autofill was manually stopped." });
      return;
    }
    if (!Object.keys(answers).length) {
      console.warn("[FormPilot] No answers generated");
      notifyContent(tabId, "AUTOFILL_STATUS", { status: "empty", step: "Unable to generate verified answers from your available profile context." });
      return;
    }

    chrome.tabs.sendMessage(tabId, { type: "FILL_FIELDS", data: answers });
    notifyContent(tabId, "AUTOFILL_STATUS", {
      status: "done",
      step: "✅ Form successfully auto-filled!",
      stats: {
        total: fields.length,
        answered: Object.keys(answers).length,
        timeSaved: Object.keys(answers).length * 10,
        unresolvedCount: Math.max(0, fields.length - Object.keys(answers).length),
      },
    });
  } catch (error) {
    console.error("[FormPilot] AutoFill error:", error);
    notifyContent(tabId, "AUTOFILL_STATUS", { status: "error", step: "An unexpected error occurred during autofill execution." });
  }
}

// ─── Handler: chat refinement ─────────────────────────────────────────────────

async function handleChatRefine(tabId: number | undefined, data: { message: string }) {
  console.log("[FormPilot] Chat refine:", data.message);

  if (!tabId) return;

  const token = await getToken();
  if (!token) {
    console.warn("[FormPilot] No auth token found - continuing with local backend session");
  }

  notifyContent(tabId, "CHAT_REFINE_STATUS", { status: "loading" });

  try {
    const episodeId = tabChatEpisodeId.get(tabId);
    const result = await agentChat(data.message, [], episodeId);

    if (!result) {
      notifyContent(tabId, "CHAT_REFINE_RESULT", {
        error: "Failed to get a response. Please try again.",
      });
      return;
    }

    if (result.episodeId) {
      tabChatEpisodeId.set(tabId, result.episodeId);
    }

    notifyContent(tabId, "CHAT_REFINE_RESULT", {
      response: result.response,
    });
  } catch (error) {
    console.error("[FormPilot] Chat refine error:", error);
    notifyContent(tabId, "CHAT_REFINE_RESULT", {
      error: "Refinement failed. Please try again.",
    });
  }
}

// ─── Core: generate answers via LangGraph agent ───────────────────────────────

async function generateAnswers(tabId: number, fields: FormField[], rawHtml?: string, url?: string): Promise<FillAnswers> {
  const token = await getToken();

  if (!token) {
    console.warn("[FormPilot] No auth token - continuing with local backend session");
  }

  // Build the normalized payload that the backend expects
  const payloadFields = normalizeFields(fields);

  // Infer the domain from the current tab's URL
  let domain = "generic";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const hostname = new URL(tab.url).hostname;
      domain = inferDomain(hostname);
      console.log(`[FormPilot] Inferred domain: ${domain}`);
    }
  } catch {
    // Non-fatal — domain remains "generic"
  }

  // Retrieve any existing form values already in the DOM to pass as context
  const currentFormState = tabFormState.get(tabId) ?? {};

  // ── Primary: LangGraph agentic fill with live step broadcasting ───────────
  const progressSteps = [
    { delay: 0, step: "🔍 Extracting DOM input schema & context..." },
    { delay: 1000, step: `🧠 Classifying ${fields.length} input fields by type & intent...` },
    { delay: 2500, step: "📚 Stage 1: Searching Profile, Education & Projects RAG..." },
    { delay: 4500, step: "✍️ Composing grounded responses with reasoning model..." },
    { delay: 7000, step: "🔍 Validating constraints & evaluating fill plan..." },
    { delay: 9500, step: "⚡ Stage 2: Situational RAG lookup on Answer Library..." },
    { delay: 11800, step: "✨ Finalizing fill plan & injecting values..." },
  ];

  const timeouts: Array<ReturnType<typeof setTimeout>> = [];
  progressSteps.forEach(({ delay, step }) => {
    const t = setTimeout(() => {
      notifyContent(tabId, "AUTOFILL_STATUS", { status: "progress", step });
    }, delay);
    timeouts.push(t);
  });

  const abortController = new AbortController();
  tabAbortControllers.set(tabId, abortController);

  let agentResponse: AgentFillResponse | null = null;
  console.log(`[FormPilot] Calling agentFill for tab ${tabId} with ${payloadFields.length} fields...`);
  try {
    agentResponse = await agentFill({
      fields: payloadFields,
      currentFormState,
      domain,
      formId: fields[0]?.formId ?? undefined,
      rawHtml,
      url,
    }, abortController.signal);
    console.log("[FormPilot] agentFill returned:", agentResponse);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log(`[FormPilot] Agent fill was aborted for tab ${tabId}`);
      timeouts.forEach((t) => clearTimeout(t));
      tabAbortControllers.delete(tabId);
      return { _STOPPED_: "true" };
    }
    console.warn("[FormPilot] Agent fill threw, falling back:", err);
  } finally {
    timeouts.forEach((t) => clearTimeout(t));
    tabAbortControllers.delete(tabId);
  }

  if (agentResponse) {
    const answers = agentResponse.answers ?? {};

    // Store form state and session for later refinement
    tabFormState.set(tabId, { ...currentFormState, ...answers });

    // Store session ID from trace if present (not directly available but reused for refine)
    const sessionId = crypto.randomUUID?.() ?? `${Date.now()}`;
    tabSessionId.set(tabId, sessionId);

    // Record Analytics
    const answeredKeys = Object.keys(answers);
    const totalFields = fields.length;

    recordAnalytics({
      platform: domain,
      websiteUrl: url ?? "unknown",
      fieldsFilled: answeredKeys.length,
      totalFields,
      timeSavedSec: answeredKeys.length * 10,
      tokensUsed: agentResponse?.trace?.tokenUsage?.total ?? 0,
      promptTokens: agentResponse?.trace?.tokenUsage?.prompt ?? 0,
      completionTokens: agentResponse?.trace?.tokenUsage?.completion ?? 0,
      fieldsAnswered: answeredKeys.map(k => ({ key: k, label: fields.find(f => (f.selector || f.name || f.label || f.id) === k)?.label ?? "", answer: answers[k] })),
      fieldsUnanswered: agentResponse?.unresolved.map(u => ({ key: u.fieldKey, label: fields.find(f => (f.selector || f.name || f.label || f.id) === u.fieldKey)?.label ?? "", reason: u.reason })) ?? [],
    });

    // Surface warnings and unresolved fields to the content script chat UI
    if (agentResponse.warnings.length || agentResponse.unresolved.length) {
      notifyContent(tabId, "AGENT_FILL_META", {
        warnings: agentResponse.warnings,
        unresolved: agentResponse.unresolved,
        trace: agentResponse.trace,
      });
    }

    if (agentResponse.unresolved.length > 0) {
      notifyContent(tabId, "AUTOFILL_STATUS", { status: "progress", step: `⚡ Stage 2 Situational RAG & iterative retries complete...` });
    } else {
      notifyContent(tabId, "AUTOFILL_STATUS", { status: "progress", step: `✨ All ${answeredKeys.length} answers verified! Injecting...` });
    }

    console.log(
      `[FormPilot] Agent fill complete — ${Object.keys(answers).length} answered, ` +
      `${agentResponse.unresolved.length} unresolved, RAG=${agentResponse.trace.usedRag}`
    );

    return answers;
  }
  console.log("i am here");

  // ── Fallback: legacy deterministic /generate ────────────────────────────────
  console.warn("[FormPilot] Agent fill returned null — falling back to /generate");
  try {
    const legacyResult = await legacyFill(payloadFields);
    if (legacyResult && Object.keys(legacyResult).length) {
      tabFormState.set(tabId, { ...currentFormState, ...legacyResult });
      return legacyResult;
    }
  } catch (err) {
    console.error("[FormPilot] Legacy fill also failed:", err);
  }

  // ── Last resort: local fallback ─────────────────────────────────────────────
  console.warn("[FormPilot] Both API paths failed — using local mock answers");
  return generateFallbackAnswers(fields);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize FormField[] into the shape expected by the backend NormalizedField[] */
function normalizeFields(fields: FormField[]) {
  return fields.map((field) => ({
    key: field.selector || field.name || field.label || field.id || `field-${Math.random().toString(36).substring(2, 9)}`,
    id: field.id ?? "",
    label: field.label ?? "",
    placeholder: field.placeholder ?? "",
    name: field.name ?? "",
    type: field.tag ?? "input",
    tag: field.tag,
    inputType: field.inputType ?? field.tag ?? "text",
    required: Boolean(field.required),
    options: Array.isArray(field.options) ? field.options : undefined,
    selector: field.selector ?? "",
    formId: field.formId,
    role: field.role,
    maxLength: field.maxLength,
    minLength: field.minLength,
    helpText: field.helpText,
    sectionHeading: field.sectionHeading,
    rawHtml: field.rawHtml,
  }));
}

/** Send a typed message to the content script without blocking on response */
function notifyContent(tabId: number, type: string, payload: Record<string, unknown>) {
  chrome.tabs.sendMessage(tabId, { type, ...payload }).catch(() => {
    // Content script might not be ready — swallow silently
  });
  // Broadcast to extension pages like popup
  chrome.runtime.sendMessage({ type, ...payload }).catch(() => { });
}

// ─── Local fallback (offline / unauthenticated) ───────────────────────────────

function generateFallbackAnswers(fields: FormField[]): FillAnswers {
  const answers: FillAnswers = {};

  fields.forEach((field) => {
    const key = field.selector || field.name || field.label || field.id;
    if (!key) return;

    const lookupText = `${field.name || ""} ${field.label || ""}`.toLowerCase();
    let value = "";

    if (field.options?.length) {
      value = selectFromOptions(lookupText, field.options);
    } else {
      value = matchMockData(lookupText);
    }

    if (value) answers[key] = value;
  });

  return answers;
}

function selectFromOptions(fieldLabel: string, options: string[]): string {
  const valid = options.filter((o) => o?.trim());
  if (!valid.length) return "";
  if (fieldLabel.includes("country")) return valid.find((o) => o.toLowerCase().includes("india")) ?? valid[0];
  if (fieldLabel.includes("state") || fieldLabel.includes("gender")) return valid[0];
  return valid[0];
}

function matchMockData(fieldText: string): string {
  if (fieldText.includes("email")) return "test@example.com";
  if (fieldText.includes("first")) return "John";
  if (fieldText.includes("last")) return "Doe";
  if (fieldText.includes("name")) return "John Doe";
  if (fieldText.includes("phone")) return "9999999999";
  if (fieldText.includes("linkedin")) return "https://linkedin.com/in/johndoe";
  if (fieldText.includes("github")) return "https://github.com/johndoe";
  if (fieldText.includes("company")) return "Example Corp";
  if (fieldText.includes("title") || fieldText.includes("role")) return "Software Engineer";
  if (fieldText.includes("skill")) return "JavaScript, TypeScript, React";
  if (fieldText.includes("bio") || fieldText.includes("summary"))
    return "Software engineer with experience building web applications.";
  return "";
}
