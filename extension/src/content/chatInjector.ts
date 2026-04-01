// Chat UI Injector – Injects the floating chat panel into the page

export function injectChatUI() {
  // Prevent duplicate injection
  if (document.getElementById("ai-form-chat-panel")) return;

  const chatPanel = document.createElement("div");
  chatPanel.id = "ai-form-chat-panel";
  chatPanel.innerHTML = `
    <div class="ai-form-chat-container">
      <div class="ai-form-chat-header">
        <span>🤖 Form Assistant</span>
        <button id="ai-form-chat-close">✕</button>
      </div>
      <div class="ai-form-chat-messages" id="ai-form-chat-messages">
        <div class="ai-form-chat-msg ai">
          I've filled the form for you. You can:
          <br>• Improve answers
          <br>• Change tone
          <br>• Add/remove details
        </div>
      </div>
      <div class="ai-form-chat-actions">
        <button class="ai-form-quick-action" data-action="shorter">Make Shorter</button>
        <button class="ai-form-quick-action" data-action="formal">Make Formal</button>
        <button class="ai-form-quick-action" data-action="regenerate">Regenerate All</button>
      </div>
      <div class="ai-form-chat-input-container">
        <input type="text" id="ai-form-chat-input" placeholder="Type your instruction..." />
        <button id="ai-form-chat-send">→</button>
      </div>
    </div>
  `;

  document.body.appendChild(chatPanel);

  // Attach event listeners
  document.getElementById("ai-form-chat-close")?.addEventListener("click", () => {
    chatPanel.style.display = "none";
  });

  document.getElementById("ai-form-chat-send")?.addEventListener("click", sendChatMessage);

  document.getElementById("ai-form-chat-input")?.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Enter") sendChatMessage();
  });

  // Quick action buttons
  document.querySelectorAll(".ai-form-quick-action").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const action = (e.target as HTMLElement).dataset.action;
      const messages: Record<string, string> = {
        shorter: "Make all answers shorter",
        formal: "Make all answers more formal and professional",
        regenerate: "Regenerate all answers",
      };
      if (action && messages[action]) {
        const input = document.getElementById("ai-form-chat-input") as HTMLInputElement;
        input.value = messages[action];
        sendChatMessage();
      }
    });
  });
}

function sendChatMessage() {
  const input = document.getElementById("ai-form-chat-input") as HTMLInputElement;
  const message = input.value.trim();
  if (!message) return;

  // Add user message to chat
  addMessage("user", message);
  input.value = "";

  // Send to background script
  chrome.runtime.sendMessage({
    type: "CHAT_REFINE",
    data: { message },
  });
}

function addMessage(role: "user" | "ai", content: string) {
  const container = document.getElementById("ai-form-chat-messages");
  if (!container) return;

  const msgDiv = document.createElement("div");
  msgDiv.className = `ai-form-chat-msg ${role}`;
  msgDiv.textContent = content;
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

// Export for use by content script
export { addMessage };
