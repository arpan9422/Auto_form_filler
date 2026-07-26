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
          ✅ Form filled! I used your profile and verified every answer.<br>
          You can refine any field by typing below.
        </div>
      </div>
      <div class="ai-form-chat-actions">
        <button class="ai-form-quick-action" data-action="shorter">Make Shorter</button>
        <button class="ai-form-quick-action" data-action="formal">Make Formal</button>
        <button class="ai-form-quick-action" data-action="casual">Make Casual</button>
        <button class="ai-form-quick-action" data-action="regenerate">Regenerate All</button>
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
        shorter: "Make all long-form answers more concise",
        formal:  "Rewrite all answers in a formal and professional tone",
        casual:  "Rewrite all answers in a friendly, conversational tone",
        regenerate: "Regenerate all answers from scratch",
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
  // Render newlines as <br>
  msgDiv.innerHTML = content.replace(/\n/g, "<br>");
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
