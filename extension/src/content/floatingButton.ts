// Floating button injected into pages that contain forms.

const FLOATING_BUTTON_ID = "ai-form-floating-btn";

type ButtonState = "idle" | "loading" | "done" | "error" | "no_fields";

const STATE_CONFIG: Record<ButtonState, { text: string; bg: string; shadow: string }> = {
  idle:      { text: "✨ Auto Fill",    bg: "linear-gradient(135deg, #f59e0b 0%, #fde68a 100%)", shadow: "rgba(245,158,11,0.4)" },
  loading:   { text: "⏳ Filling...",   bg: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)", shadow: "rgba(99,102,241,0.4)" },
  done:      { text: "✅ Filled!",      bg: "linear-gradient(135deg, #10b981 0%, #6ee7b7 100%)", shadow: "rgba(16,185,129,0.4)" },
  error:     { text: "❌ Retry",        bg: "linear-gradient(135deg, #ef4444 0%, #fca5a5 100%)", shadow: "rgba(239,68,68,0.4)" },
  no_fields: { text: "⚠ No fields",   bg: "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)", shadow: "rgba(107,114,128,0.4)" },
};

export function injectFloatingButton() {
  if (document.getElementById(FLOATING_BUTTON_ID)) return;

  const mountTarget = document.body ?? document.documentElement;
  if (!mountTarget) {
    console.warn("[FormPilot] Floating button mount target not ready");
    return;
  }

  const button = document.createElement("button");
  button.id = FLOATING_BUTTON_ID;
  button.setAttribute("aria-label", "Auto Fill form with Form Pilot");

  applyState(button, "idle");

  button.addEventListener("mouseover", () => {
    button.style.transform = "translateY(-2px) scale(1.04)";
  });

  button.addEventListener("mouseout", () => {
    button.style.transform = "translateY(0) scale(1)";
  });

  button.addEventListener("click", () => {
    console.log("[FormPilot] Auto Fill button clicked");

    if (!chrome?.runtime) {
      alert("Extension context lost. Please reload the page.");
      return;
    }

    // Dispatch to content.ts which will call scanFormsOnDemand
    // content.ts will pick this up via the AUTOFILL_CLICKED event listener
    window.dispatchEvent(new CustomEvent("AUTOFILL_CLICKED"));
  });

  mountTarget.appendChild(button);
  console.log("[FormPilot] Floating button injected");

  // ── Listen for status updates from background ─────────────────────────────
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "AUTOFILL_STATUS") {
      const btn = document.getElementById(FLOATING_BUTTON_ID) as HTMLButtonElement | null;
      if (!btn) return;

      const stateMap: Record<string, ButtonState> = {
        loading:   "loading",
        done:      "done",
        error:     "error",
        empty:     "done",       // treated as done (chat UI will explain)
        no_fields: "no_fields",
      };

      const state: ButtonState = stateMap[message.status] ?? "idle";
      applyState(btn, state);

      // Reset back to idle after a few seconds for terminal states
      if (state !== "loading") {
        setTimeout(() => applyState(btn, "idle"), 4000);
      }

      sendResponse({ received: true });
    }
    return true;
  });
}

export function removeFloatingButton() {
  document.getElementById(FLOATING_BUTTON_ID)?.remove();
  console.log("[FormPilot] Floating button removed");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let progressInterval: number | null = null;
const PROGRESS_STEPS = [
  "⏳ Reading form...",
  "🧠 Classifying fields...",
  "📚 Gathering context...",
  "✍️ Generating answers...",
  "🔍 Validating...",
  "✨ Almost done..."
];

function applyState(button: HTMLButtonElement, state: ButtonState) {
  if (progressInterval) {
    window.clearInterval(progressInterval);
    progressInterval = null;
  }

  const { text, bg, shadow } = STATE_CONFIG[state];
  const isLoading = state === "loading";

  button.textContent = text;
  button.disabled = isLoading;
  
  // Base styles
  button.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 12px 24px;
    background: ${bg};
    color: #0b0b0c;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    font-weight: 700;
    font-size: 14px;
    font-family: 'DM Mono', 'DM Sans', system-ui, sans-serif;
    cursor: ${isLoading ? "not-allowed" : "pointer"};
    z-index: 999999;
    box-shadow: 0 8px 24px ${shadow}, inset 0 1px 1px rgba(255,255,255,0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    letter-spacing: 0.02em;
    opacity: ${isLoading ? "0.9" : "1"};
    display: flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(8px);
  `;

  if (isLoading) {
    button.style.animation = "formPilotPulse 2s infinite";
    
    // Inject animation keyframes if not present
    if (!document.getElementById("form-pilot-keyframes")) {
      const style = document.createElement("style");
      style.id = "form-pilot-keyframes";
      style.textContent = `
        @keyframes formPilotPulse {
          0% { transform: scale(1); box-shadow: 0 8px 24px ${shadow}, 0 0 0 0 rgba(99,102,241,0.4); }
          50% { transform: scale(1.02); box-shadow: 0 8px 24px ${shadow}, 0 0 0 10px rgba(99,102,241,0); }
          100% { transform: scale(1); box-shadow: 0 8px 24px ${shadow}, 0 0 0 0 rgba(99,102,241,0); }
        }
      `;
      document.head.appendChild(style);
    }

    let stepIndex = 0;
    button.textContent = PROGRESS_STEPS[0];
    
    progressInterval = window.setInterval(() => {
      stepIndex++;
      if (stepIndex < PROGRESS_STEPS.length) {
        button.textContent = PROGRESS_STEPS[stepIndex];
      }
    }, 1800);
  } else {
    button.style.animation = "none";
  }
}
