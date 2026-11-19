import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export type AllowedModel = 'gemini-4-hydrogen' | 'gemini-3.1-flash-lite';
export type AllowedThinkingEffort = 'low' | 'medium' | 'high' | 'xhigh';

export function resolveModel(model: unknown): AllowedModel {
  if (model === 'gemini-3.1-flash-lite') return 'gemini-3.1-flash-lite';
  return 'gemini-4-hydrogen';
}

export function resolveThinkingLevel(effort: unknown): ThinkingLevel {
  switch (effort) {
    case 'low':
      return ThinkingLevel.LOW;
    case 'medium':
      return ThinkingLevel.MEDIUM;
    case 'xhigh':
      return ThinkingLevel.XHIGH;
    default:
      return ThinkingLevel.HIGH;
  }
}

export function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}
