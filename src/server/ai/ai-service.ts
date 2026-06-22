import { createClient } from "@/lib/supabase/server";

export const FEATURE_LIMITS: Record<string, number> = {
  chat: 50,
  summary: 20,
  flashcards: 20,
  quiz: 20
};

export class AIService {
  /**
   * Check and enforce rate limits for a user and feature.
   * Resets rate-limit windows automatically.
   */
  static async checkRateLimit(userId: string, feature: string): Promise<{ allowed: boolean; remaining: number }> {
    const limit = FEATURE_LIMITS[feature] || 20;
    const supabase = await createClient();

    // 1. Fetch current rate limit row
    const { data: limitRow, error } = await supabase
      .from("ai_rate_limits")
      .select("id, request_count, window_start")
      .eq("user_id", userId)
      .eq("feature", feature)
      .maybeSingle();

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    if (error) {
      // Default to allowed if query fails, to prevent locking out users
      return { allowed: true, remaining: limit };
    }

    if (!limitRow) {
      // Create new record
      const { error: insertError } = await supabase.from("ai_rate_limits").insert({
        user_id: userId,
        feature,
        request_count: 1,
        window_start: now.toISOString()
      });

      if (insertError) {
        return { allowed: true, remaining: limit - 1 };
      }

      return { allowed: true, remaining: limit - 1 };
    }

    const windowStart = new Date(limitRow.window_start);

    if (windowStart < oneHourAgo) {
      // Window expired, reset counter
      const { error: updateError } = await supabase
        .from("ai_rate_limits")
        .update({
          request_count: 1,
          window_start: now.toISOString()
        })
        .eq("id", limitRow.id);

      if (updateError) {
        return { allowed: true, remaining: limit - 1 };
      }

      return { allowed: true, remaining: limit - 1 };
    }

    if (limitRow.request_count >= limit) {
      // Exceeded limit
      return { allowed: false, remaining: 0 };
    }

    // Increment count
    const nextCount = limitRow.request_count + 1;
    await supabase
      .from("ai_rate_limits")
      .update({
        request_count: nextCount
      })
      .eq("id", limitRow.id);

    return { allowed: true, remaining: limit - nextCount };
  }

  /**
   * Log AI model token usage and cost estimate in the database.
   */
  static async logUsage(
    userId: string,
    feature: string,
    tokensInput: number,
    tokensOutput: number,
    model: string
  ): Promise<void> {
    const supabase = await createClient();

    // Cost estimation for Gemini 2.5 Flash:
    // Input: $0.075 per 1M tokens ($0.000000075 / token)
    // Output: $0.30 per 1M tokens ($0.0000003 / token)
    const costEstimate = tokensInput * 0.000000075 + tokensOutput * 0.0000003;

    await supabase.from("ai_usage").insert({
      user_id: userId,
      feature,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      model,
      cost_estimate: parseFloat(costEstimate.toFixed(8))
    });

    // Increment ai_words_used in the users table to update dashboard totals
    // Roughly 1 token = 0.75 words, so we can use (tokensInput + tokensOutput) * 0.75
    const wordsUsed = Math.ceil((tokensInput + tokensOutput) * 0.75);
    
    // Fetch current user and update
    const { data: user } = await supabase
      .from("users")
      .select("ai_words_used")
      .eq("id", userId)
      .maybeSingle();

    if (user) {
      const nextWordsUsed = user.ai_words_used + wordsUsed;
      await supabase
        .from("users")
        .update({ ai_words_used: nextWordsUsed })
        .eq("id", userId);
    }
  }
}
