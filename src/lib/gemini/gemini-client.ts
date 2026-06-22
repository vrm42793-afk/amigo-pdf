import { GoogleGenerativeAI } from "@google/generative-ai";

export const GEMINI_MODELS = {
  FLASH: "gemini-2.5-flash",
  PRO: "gemini-2.5-pro",
  EMBEDDING: "text-embedding-004"
};

export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }
  return new GoogleGenerativeAI(apiKey);
}
