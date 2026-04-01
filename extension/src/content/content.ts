// Content script injected into every page.
// It prepares form data, handles autofill events, and controls the floating button.

import { detectFormFields } from "./formDetector";
import { fillFormFields, highlightField } from "./formFiller";
import { injectChatUI } from "./chatInjector";
import { injectFloatingButton } from "./floatingButton";
import { getFormFields } from "./scraper";

// Initialize extension on page load.
async function init() {
  if (!document.body && !document.documentElement) {
    window.addEventListener(
      "load",
      () => {
        injectFloatingButton();
      },
      { once: true }
    );
    return;
  }

  injectFloatingButton();
  console.log("Extension initialized");
}

// Scan forms and prepare data when the user triggers autofill.
export function scanFormsOnDemand() {
  try {
    const formFields = getFormFields();
    console.log(`Form Scraper: Found ${formFields.length} form fields`);
    console.log("Detected Fields:", formFields);

    formFields.forEach((field, index) => {
      console.group(`Field ${index + 1}: ${field.label || field.name || "N/A"}`);
      console.log("ID:", field.id);
      console.log("Label:", field.label);
      console.log("Type:", field.inputType || field.tag);
      console.log("Placeholder:", field.placeholder);
      console.log("Required:", field.required);
      console.log("Selector:", field.selector);
      if (field.options?.length) {
        console.log("Options:", field.options);
      }
      console.groupEnd();
    });

    if (formFields.length > 0) {
      chrome.runtime.sendMessage(
        { type: "FORM_FIELDS_DETECTED", data: formFields },
        () => {
          if (chrome.runtime.lastError) {
            console.warn("Message delivery warning:", chrome.runtime.lastError);
          } else {
            console.log("Form fields sent to background");
          }
        }
      );
    }

    return formFields;
  } catch (error) {
    console.error("Error in form scraper:", error);
    return [];
  }
}

window.addEventListener("AUTOFILL_CLICKED", () => {
  console.log("Content script received AUTOFILL_CLICKED event");
  scanFormsOnDemand();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case "SCAN_AND_FILL":
      console.log("Received SCAN_AND_FILL message from popup");
      scanFormsOnDemand();
      sendResponse({ success: true });
      break;
    case "DETECT_FIELDS": {
      const fields = detectFormFields();
      sendResponse({ fields });
      break;
    }

    case "FILL_FIELDS":
      fillFormFields(message.data);
      injectChatUI();
      sendResponse({ success: true });
      break;

    case "UPDATE_FIELDS":
      Object.entries(message.data).forEach(([fieldName, value]) => {
        fillFormFields({ [fieldName]: value as string });
        highlightField(fieldName);
      });
      sendResponse({ success: true });
      break;
  }

  return true;
});
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void init();
  });
} else {
  void init();
}
