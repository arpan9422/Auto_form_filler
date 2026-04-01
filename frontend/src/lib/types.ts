// TypeScript type definitions

export interface User {
  id: string;
  email: string;
  plan: "FREE" | "PRO" | "PRO_PLUS";
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  techStack: string;
  createdAt: string;
}

export interface CustomAnswer {
  id: string;
  userId: string;
  question: string;
  answer: string;
  createdAt: string;
}

export interface FormField {
  label: string;
  placeholder?: string;
  name?: string;
  type?: string;
  value?: string;
}

export interface Usage {
  id: string;
  userId: string;
  count: number;
  weekStart: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIGenerateRequest {
  fields: FormField[];
}

export interface AIChatRequest {
  message: string;
  formState: Record<string, string>;
}

export interface AIResponse {
  [fieldName: string]: string;
}
