// Form Filler – Fills form fields with AI-generated answers

export function fillFormFields(data: Record<string, string>) {
  Object.entries(data).forEach(([fieldIdentifier, value]) => {
    const element = findFieldElement(fieldIdentifier);
    if (element) {
      console.log(`📝 Filling: ${fieldIdentifier}`);
      setFieldValue(element, value);
      highlightField(fieldIdentifier);
    } else {
      console.warn(`⚠️ Element not found: ${fieldIdentifier}`);
    }
  });
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

// 🔍 Find element - smart selector handling
function findFieldElement(identifier: string): HTMLElement | null {
  console.log(`🔍 Finding: ${identifier}`);

  // Strategy 1: Try as-is (works for CSS selectors)
  try {
    const el = document.querySelector(identifier);
    if (el) {
      console.log(`  ✅ Found by selector`);
      return el as HTMLElement;
    }
  } catch (e) {
    // Invalid selector, try next strategy
  }

  // Strategy 2: If starts with #, strip it and use getElementById
  if (identifier.startsWith("#")) {
    const id = identifier.slice(1);
    try {
      const el = document.getElementById(id);
      if (el) {
        console.log(`  ✅ Found by ID`);
        return el as HTMLElement;
      }
    } catch (e) {
      // Continue
    }
  }

  // Strategy 3: Try bare getElementById
  try {
    const el = document.getElementById(identifier);
    if (el) {
      console.log(`  ✅ Found direct ID`);
      return el as HTMLElement;
    }
  } catch (e) {
    // Continue
  }

  // Strategy 4: Try name attribute
  try {
    const el = document.querySelector(`[name="${CSS.escape(identifier)}"]`);
    if (el) {
      console.log(`  ✅ Found by name`);
      return el as HTMLElement;
    }
  } catch (e) {
    // Continue
  }

  console.warn(`  ❌ Not found: ${identifier}`);
  return null;
}

// 🎯 Detect field type
function getFieldType(element: HTMLElement): "select" | "radio" | "combobox" | "contenteditable" | "input" {
  const tag = element.tagName.toLowerCase();

  if (tag === "select") return "select";
  if (element.hasAttribute("contenteditable")) return "contenteditable";

  const role = element.getAttribute("role");
  if (role === "combobox") return "combobox";
  if (role === "radio") return "radio";

  return "input";
}

// 🔧 Set value based on type
function setFieldValue(element: HTMLElement, value: string) {
  const type = getFieldType(element);
  console.log(`  Type: ${type}`);

  switch (type) {
    case "select":
      setSelectValue(element as HTMLSelectElement, value);
      break;
    case "radio":
      setRadioValue(element, value);
      break;
    case "combobox":
      setComboboxValue(element, value);
      break;
    case "contenteditable":
      setContenteditableValue(element, value);
      break;
    default:
      setInputValue(element, value);
  }
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

  selectElement.dispatchEvent(new Event("input", { bubbles: true }));
  selectElement.dispatchEvent(new Event("change", { bubbles: true }));
}

// 📻 Handle radio buttons
function setRadioValue(element: HTMLElement, value: string) {
  const group = element.closest('[role="radiogroup"]') || element.parentElement;
  if (!group) return;

  const radios = group.querySelectorAll('[role="radio"]');

  for (const radio of radios) {
    const text = radio.textContent || radio.getAttribute("aria-label") || "";
    const rval = radio.getAttribute("value") || text;

    if (
      rval === value ||
      rval.toLowerCase().includes(value.toLowerCase()) ||
      text.toLowerCase().includes(value.toLowerCase())
    ) {
      radio.setAttribute("aria-checked", "true");
      (radio as HTMLElement).click();
      console.log(`  ✅ Selected: ${text}`);
      return;
    }
  }

  console.warn(`  ⚠️ No radio match`);
}

// 🗂️ Handle combobox
function setComboboxValue(element: HTMLElement, value: string) {
  const owned = element.getAttribute("aria-owns");
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

  console.warn(`  ⚠️ No combobox match`);
  setInputValue(element, value);
}

// ✏️ Handle contenteditable
function setContenteditableValue(element: HTMLElement, value: string) {
  element.textContent = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  console.log(`  ✅ Set text`);
}

// 📝 Handle input/textarea
function setInputValue(element: HTMLElement, value: string) {
  try {
    const el = element as HTMLInputElement | HTMLTextAreaElement;
    el.value = value;

    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));

    console.log(`  ✅ Value set`);
  } catch (error) {
    console.error(`  ❌ Error:`, error);
  }
}
