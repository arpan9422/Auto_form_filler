// Form Filler – Fills form fields with AI-generated answers
// Features: typing simulation, sequential filling, proper event dispatch

// ─── Configuration ──────────────────────────────────────────────────────────

/** Delay between each character for typing simulation (ms) */
const CHAR_DELAY_MIN = 30;
const CHAR_DELAY_MAX = 75;

/** Delay between filling different fields (ms) */
const FIELD_DELAY_MIN = 100;
const FIELD_DELAY_MAX = 400;

/** Max chars before we skip typing simulation and batch-set */
const TYPING_SIM_CHAR_LIMIT = 120;

// ─── Public API ─────────────────────────────────────────────────────────────

export async function fillFormFields(data: Record<string, string>) {
  // Sort entries by DOM order (top to bottom) for natural fill sequence
  const entries = Object.entries(data);
  const sorted = sortByDomPosition(entries);

  for (const [fieldIdentifier, value] of sorted) {
    const element = findFieldElement(fieldIdentifier);
    if (element) {
      console.log(`📝 Filling: ${fieldIdentifier}`);
      await setFieldValue(element, value);
      highlightField(fieldIdentifier);

      // Random delay between fields for natural pacing
      await sleep(randomInt(FIELD_DELAY_MIN, FIELD_DELAY_MAX));
    } else {
      console.warn(`⚠️ Element not found: ${fieldIdentifier}`);
    }
  }
}

export function highlightField(fieldIdentifier: string) {
  const element = findFieldElement(fieldIdentifier);
  if (!element) return;

  element.style.transition = "box-shadow 0.3s ease";
  element.style.boxShadow = "0 0 0 3px #10b981";

  setTimeout(() => {
    element.style.boxShadow = "";
  }, 2000);
}

// ─── DOM Element Finder ─────────────────────────────────────────────────────

function findFieldElement(identifier: string): HTMLElement | null {
  // Strategy 1: Try as-is (works for CSS selectors)
  try {
    const el = document.querySelector(identifier);
    if (el) return el as HTMLElement;
  } catch {
    // Invalid selector, try next strategy
  }

  // Strategy 2: If starts with #, strip it and use getElementById
  if (identifier.startsWith("#")) {
    const id = identifier.slice(1);
    try {
      const el = document.getElementById(id);
      if (el) return el as HTMLElement;
    } catch {
      // Continue
    }
  }

  // Strategy 3: Try bare getElementById
  try {
    const el = document.getElementById(identifier);
    if (el) return el as HTMLElement;
  } catch {
    // Continue
  }

  // Strategy 4: Try name attribute
  try {
    const el = document.querySelector(`[name="${CSS.escape(identifier)}"]`);
    if (el) return el as HTMLElement;
  } catch {
    // Continue
  }

  // Strategy 5: Try value attribute (useful for radio/checkbox groups without a name)
  try {
    const el = document.querySelector(`[value="${CSS.escape(identifier)}"]`);
    if (el) return el as HTMLElement;
  } catch {
    // Continue
  }

  // Strategy 6: Try aria-label
  try {
    const el = document.querySelector(`[aria-label="${CSS.escape(identifier)}"]`);
    if (el) return el as HTMLElement;
  } catch {
    // Continue
  }

  console.warn(`  ❌ Not found: ${identifier}`);
  return null;
}

// ─── Field Type Detection ───────────────────────────────────────────────────

function getFieldType(element: HTMLElement): "select" | "radio" | "checkbox" | "combobox" | "contenteditable" | "file" | "input" {
  const tag = element.tagName.toLowerCase();

  if (tag === "select") return "select";
  if (element.hasAttribute("contenteditable")) return "contenteditable";

  const role = element.getAttribute("role");
  if (role === "combobox") return "combobox";
  if (role === "radio" || role === "radiogroup" || (element instanceof HTMLInputElement && element.type === "radio")) return "radio";
  if (role === "checkbox" || role === "group" || (element instanceof HTMLInputElement && element.type === "checkbox")) return "checkbox";
  if (element instanceof HTMLInputElement && element.type === "file") return "file";

  return "input";
}

// ─── Value Setters (type-specific) ──────────────────────────────────────────

async function setFieldValue(element: HTMLElement, value: string) {
  const type = getFieldType(element);

  switch (type) {
    case "select":
      setSelectValue(element as HTMLSelectElement, value);
      break;
    case "radio":
      setRadioValue(element, value);
      break;
    case "checkbox":
      setCheckboxValue(element, value);
      break;
    case "combobox":
      await setComboboxValue(element, value);
      break;
    case "contenteditable":
      await setContenteditableValue(element, value);
      break;
    case "file":
      await setFileInputValue(element as HTMLInputElement, value);
      break;
    default:
      await setInputValue(element, value);
  }

  // Post-fill: trigger blur to activate form-level validation
  element.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
}

// 📋 Handle select elements
function setSelectValue(selectElement: HTMLSelectElement, value: string) {
  const options = Array.from(selectElement.options);

  let selectedOption = options.find(
    (opt) => opt.value === value || opt.text === value
  );

  if (!selectedOption) {
    selectedOption = options.find(
      (opt) =>
        opt.value.toLowerCase().includes(value.toLowerCase()) ||
        opt.text.toLowerCase().includes(value.toLowerCase())
    );
  }

  if (selectedOption) {
    selectElement.value = selectedOption.value;
    selectedOption.selected = true;
    console.log(`  ✅ Selected: ${selectedOption.text}`);
  } else {
    console.warn(`  ⚠️ No match for: ${value}`);
  }

  // Dispatch events that frameworks listen for
  selectElement.dispatchEvent(new Event("input", { bubbles: true }));
  selectElement.dispatchEvent(new Event("change", { bubbles: true }));
}

// 📻 Handle radio buttons
function setRadioValue(element: HTMLElement, value: string) {
  const booleanTrues = ["true", "yes", "on", "checked"];
  if (booleanTrues.includes(value.toLowerCase())) {
     if (element instanceof HTMLInputElement && !element.checked) {
        element.click();
     } else if (!(element instanceof HTMLInputElement) && element.getAttribute("aria-checked") !== "true") {
        element.click();
     }
     console.log(`  ✅ Selected exactly: ${element.id || (element as HTMLInputElement).name || 'radio'}`);
     return;
  }

  let radios: NodeListOf<Element> | HTMLElement[] = [];

  if (element instanceof HTMLInputElement && element.type === "radio") {
    // Standard HTML radio buttons
    const name = element.name;
    if (name) {
      radios = Array.from(document.querySelectorAll(`input[type="radio"][name="${name}"]`)) as HTMLElement[];
    } else {
      const container = element.closest('fieldset') || element.closest('.radio-group') || element.closest('div');
      if (container) {
          radios = Array.from(container.querySelectorAll(`input[type="radio"]`)) as HTMLElement[];
      } else {
          radios = [element];
      }
    }
  } else {
    // ARIA role="radio"
    const group = element.closest('[role="radiogroup"]') || element.parentElement;
    if (group) {
      radios = group.querySelectorAll('[role="radio"]');
    }
  }

  for (const radio of radios) {
    let text = radio.textContent || radio.getAttribute("aria-label") || "";
    if (radio instanceof HTMLInputElement && radio.id) {
       const label = document.querySelector(`label[for="${radio.id}"]`);
       if (label) text = label.textContent || text;
    }
    if (!text && radio.parentElement?.tagName.toLowerCase() === "label") {
       text = radio.parentElement.textContent || text;
    }

    const rval = radio.getAttribute("value") || text;

    if (
      rval.toLowerCase().includes(value.toLowerCase()) ||
      text.toLowerCase().includes(value.toLowerCase()) ||
      value.toLowerCase().includes(rval.toLowerCase()) ||
      value.toLowerCase().includes(text.toLowerCase())
    ) {
      if (radio instanceof HTMLInputElement) {
         if (!radio.checked) radio.click();
      } else {
         if (radio.getAttribute("aria-checked") !== "true") {
             (radio as HTMLElement).click();
         }
      }
      console.log(`  ✅ Selected: ${text}`);
      return;
    }
  }

  console.warn(`  ⚠️ No radio match for: ${value}`);
}

// ✅ Handle checkboxes
function setCheckboxValue(element: HTMLElement, value: string) {
  const booleanTrues = ["true", "yes", "on", "checked"];
  const booleanFalses = ["false", "no", "off", "unchecked"];

  const isTrue = booleanTrues.includes(value.toLowerCase());
  const isFalse = booleanFalses.includes(value.toLowerCase());

  if (isTrue || isFalse) {
     if (element instanceof HTMLInputElement) {
         const shouldBeChecked = isTrue;
         if (element.checked !== shouldBeChecked) {
             element.click();
         }
     } else {
         const currentlyChecked = element.getAttribute("aria-checked") === "true";
         if (currentlyChecked !== isTrue) {
             element.click();
         }
     }
     console.log(`  ✅ Checkbox set to ${isTrue}`);
     return;
  }

  let checkboxes: NodeListOf<Element> | HTMLElement[] = [];

  if (element instanceof HTMLInputElement && element.type === "checkbox") {
    const name = element.name;
    if (name) {
      checkboxes = Array.from(document.querySelectorAll(`input[type="checkbox"][name="${name}"]`)) as HTMLElement[];
    } else {
      const container = element.closest('fieldset') || element.closest('.checkbox-group') || element.closest('div');
      if (container) {
          checkboxes = Array.from(container.querySelectorAll(`input[type="checkbox"]`)) as HTMLElement[];
      } else {
          checkboxes = [element];
      }
    }
  } else {
    const group = element.closest('[role="group"]') || element.parentElement;
    if (group) {
      checkboxes = group.querySelectorAll('[role="checkbox"]');
    }
  }

  let foundMatch = false;

  for (const checkbox of checkboxes) {
    let text = checkbox.textContent || checkbox.getAttribute("aria-label") || "";
    if (checkbox instanceof HTMLInputElement && checkbox.id) {
       const label = document.querySelector(`label[for="${checkbox.id}"]`);
       if (label) text = label.textContent || text;
    }
    if (!text && checkbox.parentElement?.tagName.toLowerCase() === "label") {
       text = checkbox.parentElement.textContent || text;
    }

    const cval = checkbox.getAttribute("value") || text;

    if (
      cval.toLowerCase().includes(value.toLowerCase()) ||
      text.toLowerCase().includes(value.toLowerCase()) ||
      value.toLowerCase().includes(cval.toLowerCase()) ||
      value.toLowerCase().includes(text.toLowerCase())
    ) {
      if (checkbox instanceof HTMLInputElement) {
         if (!checkbox.checked) {
             checkbox.click();
         }
      } else {
         if (checkbox.getAttribute("aria-checked") !== "true") {
             (checkbox as HTMLElement).click();
         }
      }
      console.log(`  ✅ Selected: ${text}`);
      foundMatch = true;
    }
  }

  if (!foundMatch) {
     console.warn(`  ⚠️ No checkbox match for: ${value}`);
  }
}


// 🗂️ Handle combobox — click trigger, wait, click option
async function setComboboxValue(element: HTMLElement, value: string) {
  // First try clicking the element to open the dropdown
  element.click();
  element.focus();
  await sleep(200);

  const owned = element.getAttribute("aria-owns") || element.getAttribute("aria-controls");
  let container: HTMLElement | null = null;

  if (owned) {
    container = document.getElementById(owned);
  }

  if (!container) {
    container = element.closest("div")?.querySelector('[role="listbox"]') || null;
  }

  if (container) {
    const options = container.querySelectorAll('[role="option"]');
    for (const opt of options) {
      const text = opt.textContent || "";
      if (text === value || text.toLowerCase().includes(value.toLowerCase())) {
        (opt as HTMLElement).click();
        console.log(`  ✅ Selected: ${text}`);
        return;
      }
    }
  }

  // Fallback: try setting as input value
  console.warn(`  ⚠️ No combobox match, falling back to input`);
  await setInputValue(element, value);
}

// 📁 Handle file inputs (resume uploads)
async function setFileInputValue(element: HTMLInputElement, value: string) {
  if (!value.startsWith("FILE_URL:")) {
    console.warn(`  ⚠️ Cannot set file input without FILE_URL: prefix. Got: ${value}`);
    return;
  }

  const url = value.replace("FILE_URL:", "").trim();
  console.log(`  ⏳ Fetching file from: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
    
    const blob = await response.blob();
    
    let filename = "resume.pdf";
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const lastSegment = pathname.substring(pathname.lastIndexOf('/') + 1);
      if (lastSegment && lastSegment.includes('.')) {
        filename = decodeURIComponent(lastSegment);
      }
    } catch {
      // Fallback filename
    }

    const file = new File([blob], filename, { type: blob.type || "application/pdf" });
    
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    element.files = dataTransfer.files;

    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));

    console.log(`  ✅ Uploaded file: ${filename}`);
  } catch (err) {
    console.error(`  ❌ Error setting file input:`, err);
  }
}

// ✏️ Handle contenteditable
async function setContenteditableValue(element: HTMLElement, value: string) {
  element.focus();

  if (value.length <= TYPING_SIM_CHAR_LIMIT) {
    // Type character by character for short content
    element.textContent = "";
    await simulateTyping(element, value, "contenteditable");
  } else {
    // Batch-set for long content
    element.textContent = value;
  }

  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  console.log(`  ✅ Set text`);
}

// 📝 Handle input/textarea — with typing simulation for short values
async function setInputValue(element: HTMLElement, value: string) {
  try {
    const el = element as HTMLInputElement | HTMLTextAreaElement;
    el.focus();

    if (value.length <= TYPING_SIM_CHAR_LIMIT) {
      // Simulate typing for short values — looks natural and triggers React/Vue/Angular
      el.value = "";
      await simulateTyping(el, value, "input");
    } else {
      // Batch-set for long values — use the React-compatible setter trick
      setNativeValue(el, value);
    }

    // Dispatch the full event chain that frameworks expect
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));

    console.log(`  ✅ Value set`);
  } catch (error) {
    console.error(`  ❌ Error:`, error);
  }
}

// ─── Typing Simulation ──────────────────────────────────────────────────────

/**
 * Simulates typing character by character with randomized delays.
 * This triggers per-keystroke event listeners and looks natural.
 */
async function simulateTyping(
  element: HTMLElement,
  text: string,
  mode: "input" | "contenteditable"
) {
  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Dispatch keydown
    element.dispatchEvent(
      new KeyboardEvent("keydown", { key: char, bubbles: true })
    );

    // Set the character
    if (mode === "input") {
      (element as HTMLInputElement).value += char;
    } else {
      element.textContent = (element.textContent || "") + char;
    }

    // Dispatch input event (this is what React and other frameworks listen for)
    element.dispatchEvent(
      new InputEvent("input", {
        data: char,
        inputType: "insertText",
        bubbles: true,
      })
    );

    // Dispatch keyup
    element.dispatchEvent(
      new KeyboardEvent("keyup", { key: char, bubbles: true })
    );

    // Random delay between characters
    await sleep(randomInt(CHAR_DELAY_MIN, CHAR_DELAY_MAX));
  }
}

/**
 * React-compatible value setter — bypasses React's internal value tracking
 * by using the native setter from the prototype chain.
 */
function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;

  const nativeSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  if (nativeSetter) {
    nativeSetter.call(element, value);
  } else {
    element.value = value;
  }

  // React needs this specific event to detect the change
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sort field entries by their vertical position in the DOM.
 * Falls back to original order if position can't be determined.
 */
function sortByDomPosition(
  entries: [string, string][]
): [string, string][] {
  const withPosition = entries.map(([key, value]) => {
    let top = Infinity;
    try {
      const el = findFieldElement(key);
      if (el) {
        const rect = el.getBoundingClientRect();
        top = rect.top + window.scrollY;
      }
    } catch {
      // Keep Infinity — will sort to the end
    }
    return { key, value, top };
  });

  withPosition.sort((a, b) => a.top - b.top);

  return withPosition.map(({ key, value }) => [key, value]);
}
