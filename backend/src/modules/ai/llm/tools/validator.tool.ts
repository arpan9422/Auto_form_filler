import { tool } from "@langchain/core/tools";
import { z } from "zod";

// ─── validate_answer_format ───────────────────────────────────────────────────

export const validateAnswerFormatTool = tool(
  async ({
    fieldKey,
    value,
    fieldType,
    options,
  }: {
    fieldKey: string;
    value: string;
    fieldType?: string;
    options?: string[];
  }): Promise<string> => {
    const issues: string[] = [];

    if (options?.length) {
      const normalized = value.toLowerCase().trim();
      const match = options.some(
        (o) => o.toLowerCase().trim() === normalized || o.toLowerCase().includes(normalized)
      );
      if (!match) {
        issues.push(
          `Value "${value}" is not one of the allowed options: ${options.join(", ")}`
        );
      }
    }

    if (fieldType === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) issues.push(`"${value}" is not a valid email address`);
    }

    if (fieldType === "url" && value) {
      try {
        new URL(value);
      } catch {
        issues.push(`"${value}" is not a valid URL`);
      }
    }

    if (fieldType === "tel" && value) {
      const phoneRegex = /^[\+\d\s\-\(\)]{7,20}$/;
      if (!phoneRegex.test(value)) issues.push(`"${value}" is not a valid phone number`);
    }

    return JSON.stringify({ fieldKey, valid: issues.length === 0, issues });
  },
  {
    name: "validate_answer_format",
    description:
      "Checks date/email/url/phone/enumeration constraints for a field value.",
    schema: z.object({
      fieldKey: z.string(),
      value: z.string(),
      fieldType: z.string().optional().describe("HTML input type: email, url, tel, date, etc."),
      options: z.array(z.string()).optional().describe("Allowed dropdown options"),
    }),
  }
);

// ─── match_dropdown_option ────────────────────────────────────────────────────

export const matchDropdownOptionTool = tool(
  async ({
    value,
    options,
  }: {
    value: string;
    options: string[];
  }): Promise<string> => {
    if (!options.length) return JSON.stringify({ matched: value, exact: false });

    const normalizedValue = value.toLowerCase().trim();

    // Exact match
    const exact = options.find((o) => o.toLowerCase().trim() === normalizedValue);
    if (exact) return JSON.stringify({ matched: exact, exact: true });

    // Partial match
    const partial = options.find((o) => {
      const no = o.toLowerCase().trim();
      return no.includes(normalizedValue) || normalizedValue.includes(no);
    });

    return JSON.stringify({
      matched: partial ?? value,
      exact: false,
      warning: partial
        ? `Matched "${partial}" as closest option for "${value}"`
        : `No matching option found for "${value}" in [${options.join(", ")}]`,
    });
  },
  {
    name: "match_dropdown_option",
    description:
      "Maps a generated semantic value to the closest allowed dropdown option.",
    schema: z.object({
      value: z.string().describe("The generated value to match"),
      options: z.array(z.string()).describe("List of allowed dropdown options"),
    }),
  }
);

// ─── check_required_fields ────────────────────────────────────────────────────

export const checkRequiredFieldsTool = tool(
  async ({
    requiredKeys,
    answers,
  }: {
    requiredKeys: string[];
    answers: Record<string, string>;
  }): Promise<string> => {
    const missing = requiredKeys.filter(
      (key) => !answers[key] || answers[key].trim() === ""
    );
    return JSON.stringify({ allFilled: missing.length === 0, missing });
  },
  {
    name: "check_required_fields",
    description: "Verifies all required fields have been populated in the answers.",
    schema: z.object({
      requiredKeys: z.array(z.string()).describe("Field keys marked as required"),
      answers: z.record(z.string(), z.string()).describe("The answers map to check"),
    }),
  }
);
