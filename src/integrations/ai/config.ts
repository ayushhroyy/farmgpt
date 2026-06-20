export const TEXT_MODEL = "deepseek/deepseek-v4-flash";
export const VISION_MODEL = "google/gemini-2.5-flash-lite";

export const getOpenRouterApiKey = (): string => {
  if (typeof window !== "undefined") {
    const userKey = localStorage.getItem("openrouter_api_key");
    if (userKey) return userKey;
  }

  return import.meta.env.VITE_OPENROUTER_API_KEY || "";
};
