// Re-export everything from OpenRouter integration for backward compatibility
export {
  processVoiceQuery,
  analyzeWaterUsage,
  clearConversationHistory,
  type OpenRouterResponse as CohereResponse
} from '@/integrations/openrouter';
