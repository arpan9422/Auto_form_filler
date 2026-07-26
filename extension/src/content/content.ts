// Content script injected into every page.
// Prepares form data, handles autofill events, controls the floating button, and hosts the chat UI.

import { detectFormFields } from "./formDetector";
import { fillFormFields, highlightField } from "./formFiller";
import { getFormFields } from "./scraper";

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  console.log("[FormPilot] Extension initialized");
}


// ─── Scan forms on demand (triggered by floating button click) ─────────────────

export function scanFormsOnDemand() {
  try {
    const formFields = getFormFields();
    console.log(`[FormPilot] Found ${formFields.length} form fields`);

    if (!formFields.length) {
      console.warn("[FormPilot] No fields found on this page");
      return [];
    }

    // Gather raw HTML for refine context
    const forms = document.querySelectorAll("form");
    let rawHtml = "";
    if (forms.length > 0) {
      rawHtml = Array.from(forms).map((f) => f.outerHTML).join("\n\n");
    } else {
      const bodyClone = document.body.cloneNode(true) as HTMLElement;
      bodyClone.querySelectorAll("script, style, svg, img").forEach((el) => el.remove());
      rawHtml = bodyClone.innerHTML;
    }
    if (rawHtml.length > 50000) {
      rawHtml = rawHtml.substring(0, 50000) + "\n...[truncated]";
    }

    // Send to background which will call /agent/fill → /generate → fallback
    chrome.runtime.sendMessage(
      { 
        type: "FORM_FIELDS_DETECTED", 
        data: formFields,
        rawHtml: rawHtml,
        url: window.location.href 
      },
      () => {
        if (chrome.runtime.lastError) {
          console.warn("[FormPilot] Message warning:", chrome.runtime.lastError);
        } else {
          console.log("[FormPilot] Fields sent to background");
        }
      }
    );

    return formFields;
  } catch (error) {
    console.error("[FormPilot] Error scanning forms:", error);
    return [];
  }
}

// ─── AUTOFILL_CLICKED event (from floating button) ───────────────────────────

window.addEventListener("AUTOFILL_CLICKED", () => {
  console.log("[FormPilot] AUTOFILL_CLICKED received");
  scanFormsOnDemand();
});

// ─── Message listener (from background and chatInjector) ──────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {

    // ── Popup / external trigger ──────────────────────────────────────────────
    case "SCAN_AND_FILL":
      scanFormsOnDemand();
      sendResponse({ success: true });
      break;

    // ── Background requests current fields ────────────────────────────────────
    case "DETECT_FIELDS": {
      const fields = detectFormFields();
      sendResponse({ fields });
      break;
    }

    // ── Background sends filled answer map ────────────────────────────────────
    case "FILL_FIELDS":
      void fillFormFields(message.data as Record<string, string>);
      sendResponse({ success: true });
      break;

    // ── Background sends partial update from refine agent ─────────────────────
    case "UPDATE_FIELDS":
      void (async () => {
        for (const [key, value] of Object.entries(message.data as Record<string, string>)) {
          await fillFormFields({ [key]: value });
          highlightField(key);
        }
      })();
      sendResponse({ success: true });
      break;

    // ── Background bubbles agent warnings/unresolved fields ───────────────────
    // chatInjector handles AGENT_FILL_META and CHAT_REFINE_RESULT directly
    // because it registers its own chrome.runtime.onMessage listener.
    // No duplication needed here.
  }

  // Return true to keep the message channel open for async sendResponse callers
  return true;
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void init());
} else {
  void init();
}

