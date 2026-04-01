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

function Popup() {
  const handleAutoFillThisPage = async () => {
    await sendMessageToActiveTab({ type: "SCAN_AND_FILL" });
  };

  return (
    <div className="popup-container">
      <h1 className="popup-title">AI Form Assistant</h1>
      <p className="popup-subtitle">Your Form Copilot</p>

      <button className="popup-btn primary" onClick={handleAutoFillThisPage}>
        Auto Fill This Page
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
