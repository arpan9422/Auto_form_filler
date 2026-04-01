import openai from "../../config/openai";
import { inferRelevantChunkTypes, queryContext } from "./rag.service";
import { saveFeedbackDb, incrementUsageDb } from "./ai.repository";

interface FormField {
  label: string;
  placeholder?: string;
  name?: string;
  type?: string;
}

// Generate initial form fill answers
export async function generateFormFillService(fields: FormField[], userId: string) {
  // Combine field labels for context retrieval
  const query = fields.map((f) => f.label).join(". ");
  const contextChunks = await queryContext(query, userId, {
    topK: 6,
    types: inferRelevantChunkTypes(query),
  });
  const context = contextChunks.join("\n\n");

  const prompt = `You are an AI form assistant.

User Context:
${context}

Form Fields:
${JSON.stringify(fields, null, 2)}

Generate answers for each field in JSON format.
Return ONLY a JSON object where keys are field labels and values are the generated answers.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

// Chat-based refinement
export async function chatRefineService(
  userId: string,
  message: string,
  formState: Record<string, string>
) {
  const retrievalSeed = `${message}\n${Object.keys(formState).join(". ")}`;
  const contextChunks = await queryContext(retrievalSeed, userId, {
    topK: 6,
    types: inferRelevantChunkTypes(retrievalSeed),
  });
  const context = contextChunks.join("\n\n");

  const prompt = `You are an AI form assistant.

Relevant User Context:
${context}

Current Form Data:
${JSON.stringify(formState, null, 2)}

User Instruction:
${message}

Update ONLY the necessary fields.

Return JSON:
{
  "fieldName": "updated value"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}


export async function submitFeedbackService(userId: string, data: any) {
    // return saveFeedbackDb(userId, data);
}
