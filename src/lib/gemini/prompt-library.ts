import { createClient } from "@/lib/supabase/server";

export const DEFAULT_PROMPTS: Record<string, string> = {
  chat: `You are an intelligent PDF assistant. You help the user understand the document contents using the provided context chunks.
Rules:
1. ONLY answer based on the provided context chunks. If the answer cannot be found in the context, say "I cannot find the answer in the document."
2. Provide precise citations. Refer to page numbers (e.g., "[Page 3]") and section titles (e.g., "Section: Introduction") when referencing facts.
3. Be concise and structured. Use Markdown.
4. If there are relevant page numbers, always output a section at the very end of your response: "Sources: Page X, Page Y" (list unique pages). Do not output citations if no context was used.

Context chunks:
{context}

User query: {query}
Assistant:`,

  summary: `You are an AI summarizing assistant. Summarize the provided document content based on the requested summary type.
Summary Types:
- short: A brief 1-2 paragraph high-level overview.
- detailed: A comprehensive section-by-section breakdown of the key concepts and details.
- executive: A formal executive summary highlighting main goals, findings, and actionable takeaways.
- chapter: A summary structured by chapters or main sections found in the text.
- bullet: A list of key bullet points covering all major topics.

Format the output cleanly in Markdown.

Summary Type Requested: {summary_type}
Document Content:
{content}
Summary:`,

  notes: `You are an AI study assistant. Generate structured study notes from the provided document content.
Note Types:
- study: General study guide highlighting core facts, terms, and explanations.
- structured: Hierarchical outline with headers, sub-headers, and bullet points.
- bullet: Bullet-only notes containing quick facts and summaries.
- revision: Summary cards, cheat sheets, and active recall questions to help with revision.

Format the output cleanly in Markdown.

Note Type Requested: {note_type}
Document Content:
{content}
Study Notes:`,

  flashcards: `You are an AI study assistant. Generate flashcards from the provided document content.
Create flashcards targeting different parts of the text.
Include difficulty levels: 'easy', 'medium', or 'hard'.
Include the topic and the page number where the information was found.

Format your response strictly as a JSON array of objects. Do not wrap in markdown code fences. Each object must follow this structure:
{
  "question": "The question on the front of the flashcard",
  "answer": "The answer on the back of the flashcard",
  "difficulty": "easy" | "medium" | "hard",
  "topic": "The brief sub-topic or section title",
  "source_page": 3 (or null/number representing page)
}

Document Content:
{content}
JSON:`,

  quiz: `You are an AI quiz generator. Generate a quiz from the provided document content.
Generate questions of type: {quiz_type} (either 'multiple_choice', 'true_false', or 'short_answer').
Difficulty level: {difficulty} ('easy', 'medium', or 'hard').

Format your response strictly as a JSON array of objects. Do not wrap in markdown code fences. Each object must follow this structure:
{
  "question": "The quiz question text",
  "options": ["Option A", "Option B", "Option C", "Option D"] (empty array for short_answer; for true_false, use ["True", "False"]),
  "correct_answer": "The exact correct answer (must match one of the options, or be the short answer)",
  "explanation": "Detailed explanation of why this answer is correct"
}

Document Content:
{content}
JSON:`
};

/**
 * Fetch the latest version of a prompt from the database.
 * If not found in the database, return the default hardcoded version.
 */
export async function getPrompt(feature: string): Promise<string> {
  const defaultPrompt = DEFAULT_PROMPTS[feature] || "";
  
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("prompt_versions")
      .select("prompt")
      .eq("feature", feature)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return defaultPrompt;
    }

    return data.prompt;
  } catch {
    return defaultPrompt;
  }
}

/**
 * Seed a prompt version into the database if not present.
 */
export async function seedPrompt(feature: string, prompt: string, version: string = "1.0.0"): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Check if version exists
    const { data } = await supabase
      .from("prompt_versions")
      .select("id")
      .eq("feature", feature)
      .eq("version", version)
      .maybeSingle();

    if (!data) {
      await supabase.from("prompt_versions").insert({
        feature,
        version,
        prompt
      });
    }
  } catch {
    // Ignore seeding failures
  }
}
