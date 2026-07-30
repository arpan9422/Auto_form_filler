
import { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";

async function sendMessageToActiveTab(message: Record<string, unknown>) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTabId = tabs[0]?.id;

  if (!activeTabId) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(activeTabId, message);
  } catch (error) {
    console.warn("Unable to reach active tab content script", error);
  }
}

const PROGRESS_STEPS = [
  "⏳ Reading form...",
  "🧠 Classifying fields...",
  "📚 Gathering context...",
  "✍️ Generating answers...",
  "🔍 Validating...",
  "✨ Almost done..."
];

function Popup() {
  const [status, setStatus] = useState<string>("idle");
  const [progressText, setProgressText] = useState<string>("");

  useEffect(() => {
    const listener = (message: any) => {
      if (message.type === "AUTOFILL_STATUS") {
        setStatus(message.status);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  useEffect(() => {
    if (status === "loading") {
      let stepIndex = 0;
      setProgressText(PROGRESS_STEPS[0]);
      
      const interval = setInterval(() => {
        stepIndex++;
        if (stepIndex < PROGRESS_STEPS.length) {
          setProgressText(PROGRESS_STEPS[stepIndex]);
        }
      }, 1800);
      
      return () => clearInterval(interval);
    }
  }, [status]);

  const handleAutoFillThisPage = async () => {
    setStatus("loading");
    await sendMessageToActiveTab({ type: "SCAN_AND_FILL" });
  };

  let buttonText = "Auto Fill This Page";
  if (status === "loading") buttonText = progressText;
  else if (status === "done" || status === "empty") buttonText = "✅ Filled!";
  else if (status === "error") buttonText = "❌ Retry";
  else if (status === "no_fields") buttonText = "⚠ No fields found";

  return (
    <div className="popup-container">
      <h1 className="popup-title">AI Form Assistant</h1>
      <p className="popup-subtitle">Your Form Copilot</p>

      <button 
        className="popup-btn primary" 
        onClick={handleAutoFillThisPage}
        disabled={status === "loading"}
        style={{
          opacity: status === "loading" ? 0.8 : 1,
          cursor: status === "loading" ? "not-allowed" : "pointer",
          marginBottom: "8px"
        }}
      >
        {buttonText}
      </button>

      <button
        className="popup-btn secondary"
        onClick={async () => {
          await sendMessageToActiveTab({ type: "OPEN_CHAT" });
          window.close();
        }}
        style={{ marginBottom: "8px" }}
      >
        💬 Open Career Copilot
      </button>

      <button
        className="popup-btn secondary"
        onClick={() => {
          chrome.tabs.create({ url: "http://localhost:3000/dashboard" });
        }}
      >
        Open Dashboard
      </button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<Popup />);
