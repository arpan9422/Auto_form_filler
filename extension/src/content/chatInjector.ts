// Chat UI Injector – Injects the floating chat panel and wires it to the LangGraph refine agent

export function injectChatUI() {
  // Prevent duplicate injection
  if (document.getElementById("ai-form-chat-panel")) return;

  const chatPanel = document.createElement("div");
  chatPanel.id = "ai-form-chat-panel";
  chatPanel.innerHTML = `
    <div class="ai-form-chat-container">
      <div class="ai-form-chat-header">
        <span>🤖 Form Pilot</span>
        <div class="ai-form-chat-header-actions">
          <button id="ai-form-chat-minimize" title="Minimize">—</button>
          <button id="ai-form-chat-close" title="Close">✕</button>
        </div>
      </div>
      <div class="ai-form-chat-messages" id="ai-form-chat-messages">
        <div class="ai-form-chat-msg ai">
          👋 Hello! I am your Career & Job Application Copilot.<br>
          You can ask me to draft a cover letter, answer an interview question, or compose an email using your profile memory.
        </div>
      </div>
      <div class="ai-form-chat-actions">
        <button class="ai-form-quick-action" data-action="cover_letter">Draft Cover Letter</button>
        <button class="ai-form-quick-action" data-action="interview_prep">Answer Interview Q</button>
        <button class="ai-form-quick-action" data-action="email_recruiter">Email Recruiter</button>
      </div>
      <div class="ai-form-chat-input-container">
        <input type="text" id="ai-form-chat-input" placeholder="e.g. Make motivation more concise..." />
        <button id="ai-form-chat-send" title="Send">→</button>
      </div>
      <div id="ai-form-chat-spinner" class="ai-form-chat-spinner" style="display:none;">
        <span class="ai-spinner-dot"></span><span class="ai-spinner-dot"></span><span class="ai-spinner-dot"></span>
      </div>
    </div>
  `;

  document.body.appendChild(chatPanel);

  // ── Close / Minimize ─────────────────────────────────────────────────────────
  document.getElementById("ai-form-chat-close")?.addEventListener("click", () => {
    chatPanel.remove();
  });

  document.getElementById("ai-form-chat-minimize")?.addEventListener("click", () => {
    const body = chatPanel.querySelector<HTMLElement>(".ai-form-chat-messages");
    const actions = chatPanel.querySelector<HTMLElement>(".ai-form-chat-actions");
    const inputBox = chatPanel.querySelector<HTMLElement>(".ai-form-chat-input-container");
    [body, actions, inputBox].forEach((el) => {
      if (el) el.style.display = el.style.display === "none" ? "" : "none";
    });
  });

  // ── Send button / Enter key ───────────────────────────────────────────────────
  document.getElementById("ai-form-chat-send")?.addEventListener("click", sendChatMessage);
  document.getElementById("ai-form-chat-input")?.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Enter") sendChatMessage();
  });

  // ── Quick action chips ────────────────────────────────────────────────────────
  document.querySelectorAll(".ai-form-quick-action").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const action = (e.target as HTMLElement).dataset.action;
      const messages: Record<string, string> = {
        cover_letter: "Draft a compelling cover letter based on my profile.",
        interview_prep: "Help me answer a common behavioral interview question.",
        email_recruiter: "Draft a polite email to follow up with a recruiter.",
      };
      if (action && messages[action]) {
        const input = document.getElementById("ai-form-chat-input") as HTMLInputElement;
        input.value = messages[action];
        sendChatMessage();
      }
    });
  });
}

// ─── Send user instruction to background ─────────────────────────────────────

function sendChatMessage() {
  const input = document.getElementById("ai-form-chat-input") as HTMLInputElement;
  const message = input.value.trim();
  if (!message) return;

  addMessage("user", message);
  input.value = "";
  setSpinner(true);
  setSendDisabled(true);

  chrome.runtime.sendMessage({ type: "CHAT_REFINE", data: { message } }, () => {
    if (chrome.runtime.lastError) {
      addMessage("ai", "⚠️ Could not reach the background service. Please reload the extension.");
      setSpinner(false);
      setSendDisabled(false);
    }
  });
}

// ─── Incoming messages from background ───────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {

    // ── Chat refinement done ────────────────────────────────────────────────────
    case "CHAT_REFINE_RESULT":
      setSpinner(false);
      setSendDisabled(false);
      if (message.error) {
        addMessage("ai", `⚠️ ${message.error}`);
      } else if (message.response) {
        addMessage("ai", message.response);
      } else {
        const count = message.updatedCount ?? Object.keys(message.updatedFields ?? {}).length;
        addMessage("ai", `✅ Updated ${count} field${count !== 1 ? "s" : ""}.`);
      }
      sendResponse({ received: true });
      break;

    // ── Refine loading state ────────────────────────────────────────────────────
    case "CHAT_REFINE_STATUS":
      if (message.status === "loading") {
        setSpinner(true);
        setSendDisabled(true);
      }
      sendResponse({ received: true });
      break;

    // ── Warnings / unresolved fields from autofill graph ──────────────────────
    case "AGENT_FILL_META":
      showAgentMeta(
        message.warnings ?? [],
        message.unresolved ?? [],
        message.trace ?? {}
      );
      sendResponse({ received: true });
      break;

    // ── Autofill status during initial fill ────────────────────────────────────
    case "AUTOFILL_STATUS":
      handleAutofillStatus(message.status);
      sendResponse({ received: true });
      break;
  }

  return true;
});

// ─── Helper: show agent metadata (warnings + unresolved) ─────────────────────

function showAgentMeta(
  warnings: string[],
  unresolved: Array<{ fieldKey: string; reason: string }>,
  trace: { usedRag?: boolean; usedTools?: string[] }
) {
  if (warnings.length) {
    addMessage("ai", `⚠️ Warnings:\n${warnings.map((w) => `• ${w}`).join("\n")}`);
  }

  if (unresolved.length) {
    const list = unresolved.map((u) => `• ${u.fieldKey}: ${u.reason}`).join("\n");
    addMessage(
      "ai",
      `ℹ️ ${unresolved.length} field${unresolved.length > 1 ? "s" : ""} could not be filled:\n${list}\n\nYou can help me by typing a specific instruction below.`
    );
  }

  if (trace.usedRag) {
    addMessage("ai", `🔍 Used your knowledge base and profile to ground the answers.`);
  }
}

// ─── Status from autofill phase ───────────────────────────────────────────────

function handleAutofillStatus(status: string) {
  const statusMap: Record<string, string> = {
    loading:   "⏳ Filling form...",
    done:      "✅ Form filled successfully!",
    empty:     "ℹ️ No answers could be generated for this form.",
    no_fields: "ℹ️ No form fields detected on this page.",
    error:     "❌ An error occurred during autofill. Please try again.",
  };
  const msg = statusMap[status];
  if (msg) {
    // Only show in chat if the panel exists
    const panel = document.getElementById("ai-form-chat-panel");
    if (panel) addMessage("ai", msg);
  }
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export function addMessage(role: "user" | "ai", content: string) {
  const container = document.getElementById("ai-form-chat-messages");
  if (!container) return;

  const msgDiv = document.createElement("div");
  msgDiv.className = `ai-form-chat-msg ${role}`;

  // Interactive Email Confirmation Card UI
  if (role === "ai" && (content.includes("[EMAIL_CONFIRMATION_REQUIRED]") || (content.includes("TO:") && content.includes("SUBJECT:")))) {
    const fromMatch = content.match(/FROM: ([^\n\r]+)/);
    const toMatch = content.match(/TO: ([^\n\r]+)/);
    const subjectMatch = content.match(/SUBJECT: ([^\n\r]+)/);
    const bodyMatch = content.match(/BODY:\n([\s\S]+?)\n\n⚠️/);

    const fromEmail = fromMatch ? fromMatch[1].trim() : "user@formpilot.local";
    const toEmail = toMatch ? toMatch[1].trim() : "recipient@example.com";
    const subjectText = subjectMatch ? subjectMatch[1].trim() : "Job Application Inquiry";
    const bodyText = bodyMatch ? bodyMatch[1].trim() : content.replace(/\[EMAIL_CONFIRMATION_REQUIRED\]/g, "");

    const cardId = `email-card-${Date.now()}`;
    msgDiv.innerHTML = `
      <div id="${cardId}" style="background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(99, 102, 241, 0.35); border-radius: 12px; padding: 14px; box-shadow: 0 12px 28px rgba(0,0,0,0.5); backdrop-filter: blur(8px);">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; color: #818cf8;">
            <span>📧</span> <span>Email Confirmation Request</span>
          </div>
          <span style="font-size: 10px; background: rgba(99,102,241,0.25); color: #a5b4fc; padding: 2px 8px; border-radius: 6px; font-weight: 700; text-transform: uppercase;">Review Draft</span>
        </div>

        <div style="font-size: 12px; color: #cbd5e1; display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px;">
          <div><strong style="color: #94a3b8;">From:</strong> <span style="color: #f8fafc;">${fromEmail}</span></div>
          <div><strong style="color: #94a3b8;">To:</strong> <span style="color: #38bdf8; font-weight: 600;">${toEmail}</span></div>
          <div><strong style="color: #94a3b8;">Subject:</strong> <span style="color: #f8fafc;">${subjectText}</span></div>
        </div>

        <div style="font-size: 12px; color: #f1f5f9; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); max-height: 140px; overflow-y: auto; white-space: pre-wrap; font-family: system-ui, sans-serif; line-height: 1.45; margin-bottom: 12px;">${bodyText}</div>

        <div style="display: flex; gap: 8px;" id="${cardId}-actions">
          <button id="${cardId}-accept" style="flex: 1; padding: 9px 12px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; border: none; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);">
            🚀 Accept & Send Email
          </button>
          <button id="${cardId}-decline" style="padding: 9px 14px; background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; font-weight: 600; font-size: 12px; cursor: pointer;">
            ✕ Decline
          </button>
        </div>
      </div>
    `;

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;

    setTimeout(() => {
      document.getElementById(`${cardId}-accept`)?.addEventListener("click", () => {
        const input = document.getElementById("ai-form-chat-input") as HTMLInputElement;
        if (input) {
          input.value = "Yes, send the email";
          sendChatMessage();
        }
        const actionsDiv = document.getElementById(`${cardId}-actions`);
        if (actionsDiv) {
          actionsDiv.innerHTML = `<div style="font-size: 12px; color: #34d399; font-weight: 600;">✅ Email confirmed & sending...</div>`;
        }
      });

      document.getElementById(`${cardId}-decline`)?.addEventListener("click", () => {
        const actionsDiv = document.getElementById(`${cardId}-actions`);
        if (actionsDiv) {
          actionsDiv.innerHTML = `<div style="font-size: 12px; color: #f87171; font-weight: 600;">✕ Email dispatch cancelled by user.</div>`;
        }
      });
    }, 50);

    return;
  }

  // Standard message rendering
  msgDiv.innerHTML = content.replace(/\[EMAIL_CONFIRMATION_REQUIRED\]/g, "").replace(/\n/g, "<br>");
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function setSpinner(show: boolean) {
  const spinner = document.getElementById("ai-form-chat-spinner");
  if (spinner) spinner.style.display = show ? "flex" : "none";
}

function setSendDisabled(disabled: boolean) {
  const btn = document.getElementById("ai-form-chat-send") as HTMLButtonElement | null;
  const input = document.getElementById("ai-form-chat-input") as HTMLInputElement | null;
  if (btn) btn.disabled = disabled;
  if (input) input.disabled = disabled;
}
