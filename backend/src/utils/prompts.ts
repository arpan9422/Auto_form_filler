// Prompt Templates
export const PROMPTS = {
  INITIAL_FILL: `You are an AI form assistant.

User Context:
{context}

Form Fields:
{fields}

Generate answers for each field in JSON format.
Return ONLY a JSON object where keys are field labels and values are the generated answers.`,

  CHAT_REFINE: `You are an AI form assistant.

Current Form Data:
{form_state}

User Instruction:
{user_message}

Update ONLY the necessary fields.

Return JSON:
{
  "fieldName": "updated value"
}`,
};
