// src/content/scraper.ts

export type FormField = {
  id: string;
  label: string;
  placeholder?: string;
  name?: string;
  tag: "input" | "textarea" | "select" | "div" | "text";
  inputType?: string;
  required: boolean;
  options?: string[];
  selector: string;
  formId?: string;
  role?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  helpText?: string;
  sectionHeading?: string;
  rawHtml?: string;
};

function getPlaceholder(element: HTMLElement): string {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return element.placeholder || "";
  }

  // For contenteditable and other div-based fields
  const ariaPlaceholder = element.getAttribute("aria-placeholder");
  if (ariaPlaceholder) return ariaPlaceholder;

  return "";
}

// 🏷️ Determine field tag/type based on element
function getFieldTag(
  element: HTMLElement
): "input" | "textarea" | "select" | "div" | "text" {
  const tag = element.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return tag as "input" | "textarea" | "select";
  }

  const role = element.getAttribute("role");
  if (
    role === "textbox" ||
    role === "combobox" ||
    role === "slider"
  ) {
    return "text";
  }

  if (role === "radiogroup" || role === "group") {
    return "select";
  }

  if (element.hasAttribute("contenteditable")) {
    return "text";
  }

  return "div";
}

// 🚀 MAIN FUNCTION
export function getFormFields(): FormField[] {
  const fields: FormField[] = [];
  let fieldIndex = 0;

  // Clear previous scrape markers to allow re-scanning without missing fields
  document.querySelectorAll('[data-formpilot-scraped="true"]').forEach((el) => {
    delete (el as HTMLElement).dataset.formpilotScraped;
  });

  // Helper to create a FormField from any element
  const createField = (element: HTMLElement, formId: string): void => {
    if (shouldSkip(element)) return;

    const tag = getFieldTag(element);
    const role = element.getAttribute("role");

    // Extract maxLength / minLength from input and textarea elements
    let maxLength: number | undefined;
    let minLength: number | undefined;
    let pattern: string | undefined;
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      if (element.maxLength > 0 && element.maxLength < 1000000) {
        maxLength = element.maxLength;
      }
      if (element.minLength > 0) {
        minLength = element.minLength;
      }
    }
    if (element instanceof HTMLInputElement && element.pattern) {
      pattern = element.pattern;
    }

    const field: FormField = {
      id: element.id || `field-${fieldIndex}`,
      label: extractLabel(element),
      placeholder: getPlaceholder(element),
      name: element.getAttribute("name") || "",
      tag: tag,
      inputType:
        element instanceof HTMLInputElement ? element.type : undefined,
      required:
        element.getAttribute("aria-required") === "true" ||
        (element instanceof HTMLInputElement &&
          element.required) ||
        (element instanceof HTMLTextAreaElement && element.required) ||
        (element instanceof HTMLSelectElement && element.required) ||
        false,
      options: getOptions(element),
      selector: getSelector(element),
      formId: formId,
      role: role || undefined,
      maxLength,
      minLength,
      pattern,
      helpText: extractHelpText(element),
      sectionHeading: extractSectionHeading(element),
    };

    const isWeak = !field.label && !field.name && !field.placeholder;
    if (isWeak || tag === "div" || field.options === undefined) {
      const container = element.parentElement || element;
      const html = container.outerHTML || "";
      field.rawHtml = html
        .replace(/<svg.*?>.*?<\/svg>/gs, "<svg>...</svg>")
        .replace(/<!--.*?-->/gs, "")
        .slice(0, 300);
    }

    fields.push(field);
    element.dataset.formpilotScraped = "true";
    fieldIndex++;
  };

  // Step 1: Pre-process radio and checkboxes into groups
  const radioCheckGroups = new Map<string, HTMLInputElement[]>();
  document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach((el) => {
    const input = el as HTMLInputElement;
    
    // Check basic skip criteria (visibility, etc) without considering input type
    const style = window.getComputedStyle(input);
    if (style.display === "none" || style.visibility === "hidden" || input.offsetParent === null) {
      return;
    }

    let groupKey = input.name;
    if (!groupKey) {
      const fieldset = input.closest("fieldset");
      if (fieldset && fieldset.id) groupKey = fieldset.id;
      else groupKey = input.id || input.value || "unnamed-group";
    }

    if (!radioCheckGroups.has(groupKey)) {
      radioCheckGroups.set(groupKey, []);
    }
    radioCheckGroups.get(groupKey)!.push(input);
  });

  for (const [groupKey, inputs] of radioCheckGroups.entries()) {
    const first = inputs[0];
    const type = first.type;

    const options = inputs.map(input => {
      let labelText = "";
      if (input.id) {
         const label = document.querySelector(`label[for="${input.id}"]`);
         if (label) labelText = cleanText(label.textContent || "");
      }
      if (!labelText && input.parentElement?.tagName.toLowerCase() === 'label') {
         labelText = cleanText(input.parentElement.textContent || "");
      }
      if (!labelText) {
         let next = input.nextSibling;
         while (next && next.nodeType === Node.TEXT_NODE && !cleanText(next.textContent || "")) {
             next = next.nextSibling;
         }
         if (next && next.nodeType === Node.TEXT_NODE) {
             labelText = cleanText(next.textContent || "");
         }
      }
      return labelText || input.value;
    }).filter(Boolean);

    let groupLabel = extractSectionHeading(first) || extractLabel(first);
    if (!groupLabel) {
      const fieldset = first.closest("fieldset");
      if (fieldset) {
         const legend = fieldset.querySelector("legend");
         if (legend) groupLabel = cleanText(legend.textContent || "");
      }
    }

    const field: FormField = {
      id: `group-${groupKey}`,
      label: groupLabel || groupKey,
      name: first.name || groupKey,
      tag: "select", 
      inputType: type,
      required: inputs.some(i => i.required),
      options: Array.from(new Set(options)), 
      selector: first.name ? `input[name="${first.name}"]` : getSelector(first),
      formId: first.closest("form")?.id || "default-form"
    };

    fields.push(field);
    fieldIndex++;

    inputs.forEach(i => {
      i.dataset.formpilotScraped = "true";
    });
  }

  // Step 2: Try to find form elements first
  const forms = document.querySelectorAll("form");

  if (forms.length > 0) {
    console.log(
      `📋 Found ${forms.length} form(s), analyzing fields within them...`
    );

    // Step 2: For each form, find: standard inputs + ARIA/contenteditable fields
    forms.forEach((form) => {
      const formId = form.id || "form-" + fieldIndex;

      // Find standard form inputs (input, textarea, select)
      const standardFields = form.querySelectorAll(
        "input, textarea, select"
      );
      standardFields.forEach((el) => {
        createField(el as HTMLElement, formId);
      });

      // Find ARIA-based and contenteditable form-like elements
      const ariaFields = form.querySelectorAll(
        '[role="textbox"], [role="combobox"], [role="slider"], [role="radiogroup"], [role="group"], [contenteditable="true"], div[tabindex]'
      );
      ariaFields.forEach((el) => {
        createField(el as HTMLElement, formId);
      });
    });
  } else {
    // Fallback: If no form tags found, search ENTIRE DOCUMENT for all form-like elements
    console.log(
      "⚠️  No form tags found, searching entire document for fields..."
    );

    // Find standard form inputs
    const standardElements = document.querySelectorAll(
      "input, textarea, select"
    );
    standardElements.forEach((el) => {
      createField(el as HTMLElement, "default-form");
    });

    // Find ARIA-based and contenteditable form-like elements
    const ariaElements = document.querySelectorAll(
      '[role="textbox"], [role="combobox"], [role="slider"], [role="radiogroup"], [role="group"], [contenteditable="true"], div[tabindex]'
    );
    ariaElements.forEach((el) => {
      createField(el as HTMLElement, "default-form");
    });
  }

  return fields;
}

///////////////////////////////////////////////////////////
// 🧠 HELPERS
///////////////////////////////////////////////////////////

// 💡 Extract help text from aria-describedby or adjacent help elements
function extractHelpText(element: HTMLElement): string | undefined {
  // Strategy 1: aria-describedby
  const describedBy = element.getAttribute("aria-describedby");
  if (describedBy) {
    const ids = describedBy.split(/\s+/);
    const texts: string[] = [];
    for (const id of ids) {
      const helpEl = document.getElementById(id);
      if (helpEl) {
        const text = cleanText(helpEl.textContent || "");
        if (text && text.length > 2) texts.push(text);
      }
    }
    if (texts.length) return texts.join(" ");
  }

  // Strategy 2: Look for a sibling or nearby element with a help/hint class
  const parent = element.parentElement;
  if (parent) {
    const helpEl = parent.querySelector(
      ".help-text, .hint, .field-help, .form-text, [class*='help'], [class*='hint'], [class*='description']"
    );
    if (helpEl && helpEl !== element) {
      const text = cleanText(helpEl.textContent || "");
      if (text && text.length > 2 && text.length < 200) return text;
    }
  }

  return undefined;
}

// 📑 Extract the nearest section heading above the field
function extractSectionHeading(element: HTMLElement): string | undefined {
  // Strategy 1: Walk up to find a fieldset > legend
  const fieldset = element.closest("fieldset");
  if (fieldset) {
    const legend = fieldset.querySelector("legend");
    if (legend) {
      const text = cleanText(legend.textContent || "");
      if (text && text.length > 1 && text.length < 150) return text;
    }
  }

  // Strategy 2: Walk backwards through previous siblings and ancestors to find heading
  let current: HTMLElement | null = element;
  for (let depth = 0; depth < 10 && current; depth++) {
    // Check previous siblings for headings
    let sibling = current.previousElementSibling;
    while (sibling) {
      const tag = sibling.tagName.toLowerCase();
      if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
        const text = cleanText(sibling.textContent || "");
        if (text && text.length > 1 && text.length < 150) return text;
      }
      sibling = sibling.previousElementSibling;
    }
    current = current.parentElement;
  }

  return undefined;
}

// ❌ Skip hidden / irrelevant fields
function shouldSkip(element: HTMLElement): boolean {
  if (element.dataset.formpilotScraped === "true") return true;

  // Skip specific input types (hidden, etc.)
  if (element instanceof HTMLInputElement) {
    const skipTypes = [
      "hidden",
      "submit",
      "button",
      "file",
      "image",
      "reset",
    ];

    if (skipTypes.includes(element.type)) return true;
  }

  // Skip invisible elements
  const style = window.getComputedStyle(element);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    element.offsetParent === null
  ) {
    return true;
  }

  // For div[tabindex], only skip if tabindex is negative (not focusable)
  if (
    element.tagName.toLowerCase() === "div" &&
    element.hasAttribute("tabindex")
  ) {
    const tabindex = parseInt(element.getAttribute("tabindex") || "0");
    if (tabindex < 0) return true;
  }

  // Skip "Clear form" and "Submit" elements often picked up as div[tabindex] (like in Google Forms)
  const textContent = (element.textContent || (element as HTMLElement).innerText || "").toLowerCase().trim();
  const ariaLabel = (element.getAttribute("aria-label") || "").toLowerCase().trim();
  const value = element instanceof HTMLInputElement ? element.value.toLowerCase().trim() : "";
  
  const skipPhrases = ["submit", "clear form", "reset"];
  
  if (
    skipPhrases.includes(textContent) || 
    skipPhrases.includes(ariaLabel) || 
    skipPhrases.includes(value)
  ) {
    return true;
  }

  return false;
}

///////////////////////////////////////////////////////////

// 🧠 Extract label with fallback strategy - improved for Google Forms
function extractLabel(element: HTMLElement): string {
  // Google Forms specific: Find the question text which is usually in a preceding div
  // The structure is usually: div(question) -> div(answer area with input)

  let current: HTMLElement | null = element;
  
  // Walk up to find the container div (usually has role="listitem" or similar)
  let container: HTMLElement | null = null;
  for (let i = 0; i < 15; i++) {
    if (!current) break;
    const role = current.getAttribute("role");
    const className = current.className || "";
    
    // Google Forms question containers
    if (role === "listitem" || className.includes("item") || className.includes("question")) {
      container = current;
      break;
    }
    current = current.parentElement;
  }

  // If we found a container, search within it for question text
  if (container) {
    const allText = container.innerText || container.textContent || "";
    const lines = allText.split("\n").filter((l) => l.trim().length > 0);
    
    // The first line that's not "Your answer" and is reasonably short is the question
    for (const line of lines) {
      let cleaned = cleanText(line);
      
      // Remove "Your answer" and "*" from the text
      cleaned = cleaned
        .replace(/Your answer/gi, "")
        .replace(/\*\s*/g, "")
        .replace(/Required/gi, "")
        .trim();
      
      // Filter out common non-label text
      if (
        cleaned &&
        cleaned.length > 2 &&
        cleaned.length < 150
      ) {
        return cleaned;
      }
    }
  }

  // Fallback: Try aria-label
  const aria = element.getAttribute("aria-label");
  if (aria) {
    let cleaned = cleanText(aria)
      .replace(/Your answer/gi, "")
      .replace(/\*\s*/g, "")
      .trim();
    if (cleaned && cleaned.length > 2) return cleaned;
  }

  // Fallback: Try walking up parent and finding text above the input
  current = element.parentElement;
  for (let i = 0; i < 8; i++) {
    if (!current) break;
    
    // Get direct text nodes (not all descendants)
    const children = Array.from(current.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = (child.textContent || "").trim();
        if (text) {
          let cleaned = cleanText(text)
            .replace(/Your answer/gi, "")
            .replace(/\*\s*/g, "")
            .trim();
          if (cleaned && cleaned.length > 2) return cleaned;
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const elemText = (child as HTMLElement).innerText || (child as HTMLElement).textContent || "";
        let cleaned = cleanText(elemText).split("\n")[0]; // Just first line
        cleaned = cleaned
          .replace(/Your answer/gi, "")
          .replace(/\*\s*/g, "")
          .trim();
        
        if (
          cleaned &&
          cleaned.length > 2 &&
          cleaned.length < 150
        ) {
          return cleaned;
        }
      }
    }
    
    current = current.parentElement;
  }

  // Fallback: placeholder
  if ((element as HTMLInputElement).placeholder) {
    return cleanText((element as HTMLInputElement).placeholder);
  }

  return "";
}

///////////////////////////////////////////////////////////

// 🧹 Clean text utility
function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

///////////////////////////////////////////////////////////

// 🎯 Get select options
function getOptions(element: HTMLElement): string[] | undefined {
  const tag = element.tagName.toLowerCase();

  // Standard <select> element
  if (tag === "select") {
    const select = element as HTMLSelectElement;
    return Array.from(select.options).map((opt) => cleanText(opt.text));
  }

  // For role="combobox", try to find option elements
  if (element.getAttribute("role") === "combobox") {
    const options = element.querySelectorAll('[role="option"]');
    if (options.length > 0) {
      return Array.from(options).map((opt) =>
        cleanText(opt.textContent || "")
      );
    }
  }

  // For ARIA groups (radiogroup, group)
  const role = element.getAttribute("role");
  if (role === "radiogroup" || role === "group") {
    const options = element.querySelectorAll('[role="radio"], [role="checkbox"]');
    if (options.length > 0) {
      return Array.from(options).map((opt) =>
        cleanText(opt.textContent || opt.getAttribute("aria-label") || "")
      );
    }
  }

  return undefined;
}

///////////////////////////////////////////////////////////

// 🔍 Generate reliable selector for filling forms later
function getSelector(element: Element): string {
  const isStableId = (id: string) => {
    if (!id) return false;
    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) return false;
    if (id.includes(':')) return false;
    return true;
  };

  // Priority 1: ID (most reliable if stable)
  if (isStableId(element.id)) {
    return `#${element.id}`;
  }

  // Priority 2: name attribute
  const name = element.getAttribute("name");
  if (name) {
    return `[name="${name}"]`;
  }

  // Priority 3: Build a specific path using nth-child/nth-of-type
  // This handles Google Forms and similar sites where inputs lack IDs/names
  const path: string[] = [];
  let current: Element | null = element;
  let depth = 0;
  const maxDepth = 15; // Limit how far we go up

  while (current && current.nodeType === Node.ELEMENT_NODE && depth < maxDepth) {
    const tag = current.nodeName.toLowerCase();
    let selector = tag;

    // If this element has an ID, anchor to it and stop
    if (isStableId(current.id)) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    // If this element has a name (useful for forms), anchor to it
    const elemName = current.getAttribute("name");
    if (elemName) {
      selector += `[name="${elemName}"]`;
      path.unshift(selector);
      break;
    }

    // Count position among siblings of same type
    let sibling = current;
    let nth = 1;
    while (sibling.previousElementSibling) {
      sibling = sibling.previousElementSibling;
      if (sibling.nodeName.toLowerCase() === tag) {
        nth++;
      }
    }

    // Add class if it has one (helps with specificity)
    const className = current.className;
    if (typeof className === "string" && className.trim()) {
      selector += "." + className.split(" ").join(".");
    }

    // Use nth-of-type for more reliable selection
    if (nth > 1) {
      selector += `:nth-of-type(${nth})`;
    }

    path.unshift(selector);
    current = current.parentElement;
    depth++;
  }

  return path.join(" > ");
}