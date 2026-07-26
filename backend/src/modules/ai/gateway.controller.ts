import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { AppError } from "../../utils/AppError";
import prisma from "../../config/database";
import { getBaseFastModel } from "./llm/models/chatModels";
import { llmContext, LLMGatewayConfig } from "./llm/models/llmContext";

const PROVIDERS_METADATA = [
  {
    id: "ollama",
    name: "Ollama (Local / Cloud)",
    description: "Run privacy-focused local models or private cloud clusters without external third-party telemetry.",
    color: "#f59e0b",
    requiresApiKey: false,
    defaultBaseURL: "http://localhost:11434",
    models: [
      { id: "gpt-oss:120b-cloud", name: "GPT-OSS 120B Cloud (Recommended)" },
      { id: "llama3.3", name: "Llama 3.3 70B" },
      { id: "qwen2.5:72b", name: "Qwen 2.5 72B Instruct" },
      { id: "mistral", name: "Mistral 7B" },
      { id: "gemma2:27b", name: "Google Gemma 2 27B" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "Industry standard foundation models with superior reasoning and structured output accuracy.",
    color: "#10b981",
    requiresApiKey: true,
    defaultBaseURL: "https://api.openai.com/v1",
    models: [
      { id: "gpt-4o", name: "GPT-4o (Flagship Multimodal)" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini (Fast & Cost-Effective)" },
      { id: "o3-mini", name: "o3-mini (Deep Reasoning Specialist)" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini (AI Studio)",
    description: "Next-generation multi-modal models from Google DeepMind with enormous context windows.",
    color: "#3b82f6",
    requiresApiKey: true,
    defaultBaseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    models: [
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Advanced Intelligence)" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Lightning Fast & Real-time)" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (2M Context)" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
    ],
  },
  {
    id: "groq",
    name: "Groq (LPU Inference Engine)",
    description: "Ultra-low latency inference producing hundreds of tokens per second for immediate form filling.",
    color: "#f97316",
    requiresApiKey: true,
    defaultBaseURL: "https://api.groq.com/openai/v1",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile" },
      { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill Llama 70B" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B (32k Context)" },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Unified AI model router giving single-key access to Anthropic Claude 3.7, DeepSeek R1, Cohere, and more.",
    color: "#a855f7",
    requiresApiKey: true,
    defaultBaseURL: "https://openrouter.ai/api/v1",
    models: [
      { id: "anthropic/claude-3.7-sonnet", name: "Claude 3.7 Sonnet (Hybrid Reasoning)" },
      { id: "deepseek/deepseek-r1", name: "DeepSeek R1 Full" },
      { id: "google/gemini-2.5-pro", name: "Google Gemini 2.5 Pro" },
      { id: "meta-llama/llama-3.3-70b-instruct", name: "Meta Llama 3.3 70B Instruct" },
    ],
  },
  {
    id: "custom",
    name: "Custom OpenAI Compatible",
    description: "Connect to any custom server, enterprise AI gateway, vLLM cluster, or self-hosted proxy.",
    color: "#ec4899",
    requiresApiKey: false,
    defaultBaseURL: "https://your-custom-gateway.com/v1",
    models: [
      { id: "custom-model", name: "Custom Specified Model" },
    ],
  },
];

// GET /ai/gateway/providers
export const listGatewayProviders = async (_req: AuthRequest, res: Response) => {
  res.status(200).json({ providers: PROVIDERS_METADATA });
};

// GET /ai/gateway/config
export const getGatewayConfig = async (req: AuthRequest, res: Response) => {
  if (!req.userId) throw new AppError("Unauthorized", 401);

  const config = await prisma.lLMGatewayConfig.findUnique({
    where: { userId: req.userId },
  });

  if (!config) {
    return res.status(200).json({
      provider: "ollama",
      model: "gpt-oss:120b-cloud",
      apiKey: "",
      hasKey: false,
      baseURL: "",
      temperature: 0.2,
    });
  }

  // Securely mask API key to protect against XSS exfiltration
  const maskedKey = config.apiKey
    ? (config.apiKey.length > 8
      ? `${config.apiKey.slice(0, 4)}...${config.apiKey.slice(-4)}`
      : "sk-...xxxx")
    : "";

  res.status(200).json({
    id: config.id,
    provider: config.provider,
    model: config.model || "",
    apiKey: maskedKey,
    hasKey: !!config.apiKey,
    baseURL: config.baseURL || "",
    temperature: config.temperature,
  });
};

// PUT /ai/gateway/config
export const updateGatewayConfig = async (req: AuthRequest, res: Response) => {
  if (!req.userId) throw new AppError("Unauthorized", 401);

  const { provider = "ollama", model, apiKey, baseURL, temperature = 0.2 } = req.body || {};

  // Find existing config to check if key needs preservation
  const existing = await prisma.lLMGatewayConfig.findUnique({
    where: { userId: req.userId },
  });

  let finalApiKey: string | null | undefined = apiKey;
  if (typeof apiKey === "string") {
    const trimmed = apiKey.trim();
    if (trimmed.includes("...") || (trimmed === "" && existing?.apiKey)) {
      finalApiKey = existing?.apiKey;
    } else if (trimmed === "") {
      finalApiKey = null;
    } else {
      finalApiKey = trimmed;
    }
  }

  const updated = await prisma.lLMGatewayConfig.upsert({
    where: { userId: req.userId },
    update: {
      provider,
      model: model || null,
      apiKey: finalApiKey,
      baseURL: baseURL || null,
      temperature: Number(temperature) || 0.2,
    },
    create: {
      userId: req.userId,
      provider,
      model: model || null,
      apiKey: finalApiKey,
      baseURL: baseURL || null,
      temperature: Number(temperature) || 0.2,
    },
  });

  const maskedKey = updated.apiKey
    ? (updated.apiKey.length > 8
      ? `${updated.apiKey.slice(0, 4)}...${updated.apiKey.slice(-4)}`
      : "sk-...xxxx")
    : "";

  res.status(200).json({
    message: "LLM Gateway configuration saved securely in database",
    config: {
      provider: updated.provider,
      model: updated.model || "",
      apiKey: maskedKey,
      hasKey: !!updated.apiKey,
      baseURL: updated.baseURL || "",
      temperature: updated.temperature,
    },
  });
};

// POST /ai/gateway/test
export const testGatewayConnection = async (req: AuthRequest, res: Response) => {
  if (!req.userId) throw new AppError("Unauthorized", 401);

  const { provider, model, apiKey, baseURL, temperature } = req.body || {};

  // If apiKey is masked or empty, fall back to what's in DB
  let testApiKey = apiKey;
  if (!testApiKey || (typeof testApiKey === "string" && testApiKey.includes("..."))) {
    const existing = await prisma.lLMGatewayConfig.findUnique({
      where: { userId: req.userId },
    });
    testApiKey = existing?.apiKey || testApiKey;
  }

  const testConfig: LLMGatewayConfig = {
    provider: provider || "ollama",
    model: model || undefined,
    apiKey: testApiKey || undefined,
    baseURL: baseURL || undefined,
    temperature: temperature !== undefined ? Number(temperature) : 0.2,
  };

  const startTime = Date.now();
  try {
    const result: unknown = await new Promise((resolve, reject) => {
      llmContext.run(testConfig, async () => {
        try {
          const llm = getBaseFastModel(0);
          const response = await llm.invoke([
            ["user", "Respond with ONLY the literal word 'GATEWAY_OK' and no other text."]
          ]);
          resolve(response.content.toString().trim());
        } catch (err) {
          reject(err);
        }
      });
    });

    const latencyMs = Date.now() - startTime;
    res.status(200).json({
      success: true,
      latencyMs,
      provider: testConfig.provider,
      model: testConfig.model || "default",
      message: "Successfully verified connection to LLM provider!",
      rawResponse: result,
    });
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    res.status(400).json({
      success: false,
      latencyMs,
      provider: testConfig.provider,
      model: testConfig.model || "default",
      error: error?.message || "Failed to connect to LLM Gateway",
    });
  }
};
