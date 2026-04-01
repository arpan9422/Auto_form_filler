// Form Detector – Detects form fields on the page
export interface DetectedField {
  label: string;
  placeholder: string;
  name: string;
  type: string;
  selector: string;
}

export function detectFormFields(): DetectedField[] {
  const fields: DetectedField[] = [];
  const inputs = document.querySelectorAll("input, textarea, select");

  inputs.forEach((input) => {
    const el = input as HTMLInputElement;
    const label = findLabel(el);

    // Skip hidden, submit, and button inputs
    if (["hidden", "submit", "button", "reset"].includes(el.type)) return;

    fields.push({
      label: label || el.placeholder || el.name || "",
      placeholder: el.placeholder || "",
      name: el.name || el.id || "",
      type: el.type || "text",
      selector: generateSelector(el),
    });
  });

  return fields;
}

function findLabel(input: HTMLElement): string {
  // Check for associated label
  const id = input.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent?.trim() || "";
  }

  // Check parent label
  const parentLabel = input.closest("label");
  if (parentLabel) return parentLabel.textContent?.trim() || "";

  return "";
}

function generateSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`;
  if (el.getAttribute("name")) return `[name="${el.getAttribute("name")}"]`;
  return "";
}
