const DEFAULT_AICREDITS_BASE_URL = "https://api.aicredits.in";

const normalizeBaseURL = (url: string) => {
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
};

const getEnvValue = (key: string) => {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : undefined;
};

export const getAIProviderConfig = () => {
  const openAIApiKey = getEnvValue("OPENAI_API_KEY");
  const openAIBaseURL = getEnvValue("OPENAI_BASE_URL");
  const aiCreditsApiKey = getEnvValue("AICREDITS_API_KEY");
  const aiCreditsBaseURL = getEnvValue("AICREDITS_BASE_URL") ?? DEFAULT_AICREDITS_BASE_URL;

  const apiKey = openAIApiKey ?? aiCreditsApiKey ?? "";
  const baseURL = openAIBaseURL
    ? normalizeBaseURL(openAIBaseURL)
    : openAIApiKey
      ? undefined
      : normalizeBaseURL(aiCreditsBaseURL);

  return {
    apiKey,
    baseURL,
  };
};
