// Floating button injected into pages that support manual autofill.

const FLOATING_BUTTON_ID = "ai-form-floating-btn";

export function injectFloatingButton() {
  // Prevent duplicate injection on SPA navigations or repeated init calls.
  if (document.getElementById(FLOATING_BUTTON_ID)) return;

  const mountTarget = document.body ?? document.documentElement;

  if (!mountTarget) {
    console.warn("Floating button mount target is not ready yet");
    return;
  }

  const button = document.createElement("button");
  button.id = FLOATING_BUTTON_ID;
  button.textContent = "Auto Fill";
  button.setAttribute("aria-label", "Auto Fill");

  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #f59e0b 0%, #fde68a 100%);
    color: #0b0b0c;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    transition: all 0.3s ease;
  `;

  button.addEventListener("mouseover", () => {
    button.style.transform = "translateY(-2px)";
    button.style.boxShadow = "0 8px 20px rgba(245, 158, 11, 0.6)";
  });

  button.addEventListener("mouseout", () => {
    button.style.transform = "translateY(0)";
    button.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.4)";
  });

  button.addEventListener("click", () => {
    console.log("Auto Fill button clicked");

    try {
      if (!chrome?.runtime) {
        console.error("Extension context invalidated. Please reload the extension.");
        alert("Extension context lost. Please reload the page and try again.");
        return;
      }

      window.dispatchEvent(new CustomEvent("AUTOFILL_CLICKED"));
      console.log("Dispatched AUTOFILL_CLICKED event");
    } catch (error) {
      console.error("Exception in auto fill:", error);
      alert("An error occurred. Please reload the page and try again.");
    }
  });

  mountTarget.appendChild(button);
  console.log("Floating button injected successfully");
}

export function removeFloatingButton() {
  const button = document.getElementById(FLOATING_BUTTON_ID);

  if (button) {
    button.remove();
    console.log("Floating button removed");
  }
}
