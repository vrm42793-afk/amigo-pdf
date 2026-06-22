import { getGeminiClient, GEMINI_MODELS } from "./gemini-client";

/**
 * Generate embedding for a single text using text-embedding-004.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const ai = getGeminiClient();
  const model = ai.getGenerativeModel({ model: GEMINI_MODELS.EMBEDDING });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Generate embeddings in batch for multiple texts.
 */
export async function getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const ai = getGeminiClient();
  const model = ai.getGenerativeModel({ model: GEMINI_MODELS.EMBEDDING });
  
  const result = await model.batchEmbedContents({
    requests: texts.map((text) => ({
      content: { role: "user", parts: [{ text }] },
      model: `models/${GEMINI_MODELS.EMBEDDING}`
    }))
  });
  
  return result.embeddings.map((e) => e.values);
}
