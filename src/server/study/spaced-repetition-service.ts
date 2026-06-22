import { createClient } from "@/lib/supabase/server";
import { FlashcardReview } from "@/types/study/study.types";

export class SpacedRepetitionService {
  /**
   * Fetch the current review parameters for a flashcard, or return defaults.
   */
  static async getReviewState(userId: string, flashcardId: string): Promise<FlashcardReview | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("flashcard_reviews")
      .select("*")
      .eq("user_id", userId)
      .eq("flashcard_id", flashcardId)
      .maybeSingle();

    if (error) {
      console.error("Failed to query flashcard review state:", error);
      return null;
    }

    return data as FlashcardReview | null;
  }

  /**
   * Grade a flashcard recall quality (0 to 5) and recalculate spacing.
   */
  static async submitReview(
    userId: string,
    flashcardId: string,
    rating: number // 0 to 5 quality score
  ): Promise<FlashcardReview> {
    const supabase = await createClient();

    // 1. Fetch current spaced repetition record or assume defaults
    const current = await this.getReviewState(userId, flashcardId);
    
    let repetitions = current?.repetitions || 0;
    let intervalDays = current?.interval_days || 0;
    let easeFactor = Number(current?.ease_factor || 2.5);

    // Clamp rating to 0 - 5 range
    const q = Math.max(0, Math.min(5, Math.round(rating)));

    // 2. SM-2 Algorithm computation
    if (q < 3) {
      // Incorrect answer: reset consecutive repetitions, schedule review for tomorrow
      repetitions = 0;
      intervalDays = 1;
    } else {
      // Correct answer: increment repetitions and compute next interval
      if (repetitions === 0) {
        intervalDays = 1;
      } else if (repetitions === 1) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(intervalDays * easeFactor);
      }
      repetitions += 1;
    }

    // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const efDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
    easeFactor = Math.max(1.3, easeFactor + efDelta);

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

    let resultRecord: FlashcardReview;

    if (current) {
      // Update existing record
      const { data, error } = await supabase
        .from("flashcard_reviews")
        .update({
          repetitions,
          interval_days: intervalDays,
          ease_factor: parseFloat(easeFactor.toFixed(4)),
          next_review_at: nextReviewAt.toISOString(),
        })
        .eq("id", current.id)
        .select()
        .single();

      if (error) throw new Error("Failed to update flashcard review: " + error.message);
      resultRecord = data;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from("flashcard_reviews")
        .insert({
          user_id: userId,
          flashcard_id: flashcardId,
          repetitions,
          interval_days: intervalDays,
          ease_factor: parseFloat(easeFactor.toFixed(4)),
          next_review_at: nextReviewAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw new Error("Failed to insert flashcard review: " + error.message);
      resultRecord = data;
    }

    return resultRecord as FlashcardReview;
  }

  /**
   * Fetch all flashcards scheduled for review (next_review_at <= now).
   */
  static async getPendingReviews(userId: string): Promise<string[]> {
    const supabase = await createClient();
    const nowStr = new Date().toISOString();

    const { data, error } = await supabase
      .from("flashcard_reviews")
      .select("flashcard_id")
      .eq("user_id", userId)
      .lte("next_review_at", nowStr);

    if (error) {
      throw new Error("Failed to fetch pending reviews: " + error.message);
    }

    return (data || []).map((r) => r.flashcard_id);
  }
}
