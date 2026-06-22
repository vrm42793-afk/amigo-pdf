import { createClient } from "@/lib/supabase/server";
import { getEmbedding } from "./embeddings";
import { AISource } from "@/types/ai/ai.types";

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class RetrievalService {
  /**
   * Retrieve the most relevant chunks for a user query.
   * Top N matches (default: 5) sorted by cosine similarity.
   */
  static async retrieveRelevantChunks(
    fileId: string,
    query: string,
    topN: number = 5,
    minSimilarity: number = 0.3
  ): Promise<AISource[]> {
    const supabase = await createClient();

    // 1. Fetch chunks from database for the file
    const { data: chunks, error } = await supabase
      .from("document_chunks")
      .select("content, page_number, section_title, embedding")
      .eq("file_id", fileId);

    if (error || !chunks || chunks.length === 0) {
      return [];
    }

    // 2. Generate embedding for query
    let queryEmbedding: number[];
    try {
      queryEmbedding = await getEmbedding(query);
    } catch (e) {
      console.error("Failed to generate query embedding:", e);
      return [];
    }

    // 3. Compute cosine similarity for each chunk
    const rankedChunks: AISource[] = chunks
      .map((chunk) => {
        // Parse embedding from JSONB
        const chunkEmbedding = Array.isArray(chunk.embedding)
          ? (chunk.embedding as number[])
          : typeof chunk.embedding === "string"
          ? (JSON.parse(chunk.embedding) as number[])
          : null;

        if (!chunkEmbedding || chunkEmbedding.length === 0) {
          return {
            chunkText: chunk.content,
            pageNumber: chunk.page_number,
            similarityScore: 0,
            sectionTitle: chunk.section_title
          };
        }

        const score = cosineSimilarity(queryEmbedding, chunkEmbedding);

        return {
          chunkText: chunk.content,
          pageNumber: chunk.page_number,
          similarityScore: score,
          sectionTitle: chunk.section_title
        };
      })
      .filter((chunk) => chunk.similarityScore >= minSimilarity)
      .sort((a, b) => b.similarityScore - a.similarityScore);

    // 4. Return top N chunks
    return rankedChunks.slice(0, topN);
  }
}
