// Floating button & Real-time Auto-Fill Completion Popup injected into pages that contain forms.

import { injectChatUI } from "./chatInjector";

const FLOATING_BUTTON_ID = "ai-form-floating-btn";
const STATUS_MODAL_ID = "ai-form-status-modal";

type ButtonState = "idle" | "progress" | "loading" | "done" | "error" | "no_fields" | "empty";

const STATE_CONFIG: Record<string, { text: string; bg: string; shadow: string }> = {
  idle:      { text: "✨ Auto Fill",    bg: "linear-gradient(135deg, #f59e0b 0%, #fde68a 100%)", shadow: "rgba(245,158,11,0.4)" },
  loading:   { text: "⏳ Initializing...", bg: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)", shadow: "rgba(99,102,241,0.4)" },
  progress:  { text: "⚡ Filling...",   bg: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)", shadow: "rgba(99,102,241,0.4)" },
  done:      { text: "✅ Filled!",      bg: "linear-gradient(135deg, #10b981 0%, #6ee7b7 100%)", shadow: "rgba(16,185,129,0.4)" },
  error:     { text: "❌ Error",         bg: "linear-gradient(135deg, #ef4444 0%, #fca5a5 100%)", shadow: "rgba(239,68,68,0.4)" },
  no_fields: { text: "⚠ No fields",   bg: "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)", shadow: "rgba(107,114,128,0.4)" },
  empty:     { text: "⚠ No context",  bg: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)", shadow: "rgba(249,115,22,0.4)" },
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
    if (button.dataset.state !== "loading" && button.dataset.state !== "progress") {
      button.style.transform = "translateY(-2px) scale(1.04)";
    }
  });

  button.addEventListener("mouseout", () => {
    if (button.dataset.state !== "loading" && button.dataset.state !== "progress") {
      button.style.transform = "translateY(0) scale(1)";
    }
  });

  button.addEventListener("click", () => {
    console.log("[FormPilot] Auto Fill button clicked");

    if (button.dataset.state === "loading" || button.dataset.state === "progress") {
      console.log("[FormPilot] Already processing, ignoring click.");
      return;
    }

    if (!chrome?.runtime) {
      alert("Extension context lost. Please reload the page.");
      return;
    }

    // Open real-time progress status modal immediately upon click
    showOrUpdateStatusModal({
      state: "progress",
      title: "Initializing FormPilot Agent",
      step: "🔍 Scanning page DOM & identifying fillable inputs...",
      pulseColor: "#6366f1"
    });

    window.dispatchEvent(new CustomEvent("AUTOFILL_CLICKED"));
  });

  mountTarget.appendChild(button);
  console.log("[FormPilot] Floating button injected");

  // ── Listen for real-time status updates from background ────────────────────
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "AUTOFILL_STATUS") {
      const btn = document.getElementById(FLOATING_BUTTON_ID) as HTMLButtonElement | null;
      const status = message.status || "idle";
      if (btn) {
        applyState(btn, status as ButtonState);
      }

      if (status === "progress" || status === "loading") {
        injectOverlay(true);
        showOrUpdateStatusModal({
          state: "progress",
          title: "LangGraph Agent Active",
          step: message.step || "⏳ Executing automated fill plan...",
          pulseColor: "#818cf8",
        });
      } else if (status === "done") {
        injectOverlay(false);
        triggerConfetti();
        const stats = message.stats || {};
        showOrUpdateStatusModal({
          state: "done",
          title: "Form Successfully Filled!",
          step: message.step || "All detected fields verified & applied.",
          pulseColor: "#10b981",
          stats: {
            total: stats.total || 0,
            answered: stats.answered || 0,
            timeSaved: stats.timeSaved || 0,
            unresolved: stats.unresolvedCount || 0,
          },
        });
      } else if (status === "no_fields") {
        injectOverlay(false);
        showOrUpdateStatusModal({
          state: "info",
          title: "No Form Inputs Found",
          step: "We couldn't detect any fillable inputs on this webpage.",
          pulseColor: "#6b7280",
          autoCloseMs: 5000,
        });
      } else if (status === "empty" || status === "error") {
        injectOverlay(false);
        showOrUpdateStatusModal({
          state: "error",
          title: status === "error" ? "Auto-Fill Notice" : "Insufficient Profile Context",
          step: message.step || "We couldn't match enough verified profile data to answer these inputs automatically.",
          pulseColor: "#ef4444",
          autoCloseMs: 7000,
        });
      }

      if (status !== "loading" && status !== "progress") {
        setTimeout(() => {
          if (btn) applyState(btn, "idle");
        }, 5000);
      }

      sendResponse({ received: true });
    }
    return true;
  });
}

export function removeFloatingButton() {
  document.getElementById(FLOATING_BUTTON_ID)?.remove();
  document.getElementById(STATUS_MODAL_ID)?.remove();
  injectOverlay(false);
  console.log("[FormPilot] Floating button & modal removed");
}

// ─── Animations & Overlays ───────────────────────────────────────────────────

function injectOverlay(show: boolean) {
  let overlay = document.getElementById("fp-processing-overlay");
  if (show) {
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "fp-processing-overlay";
      overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(15, 17, 26, 0.5);
        backdrop-filter: blur(4px);
        z-index: 999997;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: all;
      `;
      const spinner = document.createElement("div");
      spinner.innerHTML = `<div style="width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.2); border-top: 4px solid #6366f1; border-radius: 50%; animation: formPilotSpin 1s linear infinite;"></div>`;
      overlay.appendChild(spinner);
      document.body.appendChild(overlay);
    }
  } else {
    overlay?.remove();
  }
}

function triggerConfetti() {
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7'];
  for (let i = 0; i < 70; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = (Math.random() * 100) + 'vw';
    confetti.style.top = '-20px';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    confetti.style.zIndex = '999999';
    confetti.style.pointerEvents = 'none';
    document.body.appendChild(confetti);

    const animation = confetti.animate([
      { transform: `translate3d(0, 0, 0) rotate(0deg)`, opacity: 1 },
      { transform: `translate3d(${Math.random() * 300 - 150}px, 100vh, 0) rotate(${Math.random() * 720}deg)`, opacity: 0 }
    ], {
      duration: Math.random() * 1500 + 1500,
      easing: 'cubic-bezier(.37,0,.63,1)'
    });

    animation.onfinish = () => confetti.remove();
  }
}

// ─── Helpers: Floating Button State ──────────────────────────────────────────

function applyState(button: HTMLButtonElement, state: ButtonState) {
  button.dataset.state = state;
  const config = STATE_CONFIG[state] ?? STATE_CONFIG.idle;
  const isLoading = state === "loading" || state === "progress";

  button.textContent = config.text;
  button.disabled = isLoading;
  
  // Base button styling
  button.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 12px 24px;
    background: ${config.bg};
    color: #0b0b0c;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px;
    font-weight: 700;
    font-size: 14px;
    font-family: system-ui, -apple-system, sans-serif;
    cursor: ${isLoading ? "wait" : "pointer"};
    z-index: 999999;
    box-shadow: 0 8px 24px ${config.shadow}, inset 0 1px 1px rgba(255,255,255,0.25);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    letter-spacing: 0.02em;
    opacity: ${isLoading ? "0.95" : "1"};
    display: flex;
    align-items: center;
    gap: 8px;
    backdrop-filter: blur(8px);
  `;

  if (isLoading) {
    button.style.animation = "formPilotPulse 2s infinite";
    injectPulseAnimation(config.shadow);
  } else {
    button.style.animation = "none";
  }
}

function injectPulseAnimation(shadow: string) {
  if (!document.getElementById("form-pilot-keyframes")) {
    const style = document.createElement("style");
    style.id = "form-pilot-keyframes";
    style.textContent = `
      @keyframes formPilotPulse {
        0% { transform: scale(1); box-shadow: 0 8px 24px ${shadow}, 0 0 0 0 rgba(99,102,241,0.5); }
        50% { transform: scale(1.03); box-shadow: 0 8px 24px ${shadow}, 0 0 0 12px rgba(99,102,241,0); }
        100% { transform: scale(1); box-shadow: 0 8px 24px ${shadow}, 0 0 0 0 rgba(99,102,241,0); }
      }
      @keyframes formPilotModalFadeIn {
        0% { opacity: 0; transform: translateY(15px) scale(0.96); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes formPilotSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

// ─── Interactive Real-Time Status & Completion Modal ──────────────────────────

interface ModalPayload {
  state: "progress" | "done" | "info" | "error";
  title: string;
  step: string;
  pulseColor?: string;
  autoCloseMs?: number;
  stats?: {
    total: number;
    answered: number;
    timeSaved: number;
    unresolved: number;
  };
}

let autoCloseTimeout: number | null = null;

function showOrUpdateStatusModal(payload: ModalPayload) {
  if (autoCloseTimeout) {
    window.clearTimeout(autoCloseTimeout);
    autoCloseTimeout = null;
  }

  let modal = document.getElementById(STATUS_MODAL_ID) as HTMLElement | null;
  if (!modal) {
    modal = document.createElement("div");
    modal.id = STATUS_MODAL_ID;
    document.body.appendChild(modal);
  }

  // Base styling for ultra-premium glassmorphic popup modal
  modal.style.cssText = `
    position: fixed;
    bottom: 84px;
    right: 24px;
    width: 360px;
    background: rgba(15, 17, 26, 0.94);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 16px;
    padding: 20px;
    color: #f8fafc;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    z-index: 999998;
    box-shadow: 0 24px 50px -12px rgba(0, 0, 0, 0.75), 0 0 32px rgba(99, 102, 241, 0.18);
    backdrop-filter: blur(16px);
    animation: formPilotModalFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    gap: 14px;
  `;

  const statusIcon = payload.state === "progress" ? "⏳" : payload.state === "done" ? "🎉" : payload.state === "error" ? "⚠️" : "ℹ️";
  const statusBadgeColor = payload.pulseColor || "#6366f1";

  let htmlContent = `
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">${statusIcon}</span>
        <div>
          <h4 style="margin: 0; font-size: 15px; font-weight: 700; color: #f8fafc; letter-spacing: 0.01em;">${payload.title}</h4>
          <span style="font-size: 11px; color: ${statusBadgeColor}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            ${payload.state === "progress" ? "Real-Time Agent Feed" : payload.state === "done" ? "Execution Completed" : "System Notification"}
          </span>
        </div>
      </div>
      <button id="fp-modal-close" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 16px; padding: 4px;">✕</button>
    </div>

    <div style="font-size: 13px; color: #cbd5e1; line-height: 1.5; background: rgba(255,255,255,0.03); padding: 10px 12px; border-radius: 8px; border-left: 3px solid ${statusBadgeColor};">
      ${payload.step}
    </div>
  `;

  // Render statistical scoreboard if completed
  if (payload.state === "done" && payload.stats) {
    const { unresolved } = payload.stats;
    
    htmlContent += `
      ${unresolved > 0 ? `
        <div style="font-size: 11px; color: #fca5a5; background: rgba(239, 68, 68, 0.1); padding: 8px 10px; border-radius: 6px; display: flex; align-items: center; gap: 6px;">
          <span>⚠️</span> <span><b>${unresolved} input(s)</b> left blank after 3 retry attempts. Review below.</span>
        </div>
      ` : `
        <div style="font-size: 11px; color: #6ee7b7; background: rgba(16, 185, 129, 0.1); padding: 8px 10px; border-radius: 6px; display: flex; align-items: center; gap: 6px;">
          <span>✨</span> <span>100% of discovered inputs matched & filled perfectly!</span>
        </div>
      `}

      <div style="display: flex; gap: 8px; margin-top: 6px;">
        <button id="fp-open-assistant" style="flex: 1; padding: 10px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);">
          💬 Open AI Assistant
        </button>
        <button id="fp-dismiss-modal" style="padding: 10px 16px; background: rgba(255,255,255,0.07); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer;">
          Dismiss
        </button>
      </div>
    `;
  } else if (payload.state === "progress") {
    htmlContent += `
      <div style="height: 4px; width: 100%; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; position: relative;">
        <div style="height: 100%; width: 45%; background: linear-gradient(90deg, #6366f1, #a855f7); border-radius: 2px; position: absolute; left: 0; animation: fpProgressSlide 1.5s ease-in-out infinite alternate;"></div>
      </div>
      <style>
        @keyframes fpProgressSlide {
          0% { left: 0; width: 35%; }
          100% { left: 65%; width: 35%; }
        }
      </style>
      <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
        <button id="fp-stop-agent" style="padding: 6px 14px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 10px;">⏹</span> Stop Agent
        </button>
      </div>
    `;
  }

  modal.innerHTML = htmlContent;

  // Bind events
  document.getElementById("fp-modal-close")?.addEventListener("click", () => {
    modal?.remove();
  });

  document.getElementById("fp-dismiss-modal")?.addEventListener("click", () => {
    modal?.remove();
  });

  document.getElementById("fp-open-assistant")?.addEventListener("click", () => {
    modal?.remove();
    injectChatUI();
  });

  document.getElementById("fp-stop-agent")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "STOP_AUTOFILL" });
  });

  if (payload.autoCloseMs) {
    autoCloseTimeout = window.setTimeout(() => {
      document.getElementById(STATUS_MODAL_ID)?.remove();
    }, payload.autoCloseMs);
  }
}
