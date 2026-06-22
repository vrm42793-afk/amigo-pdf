import { createClient } from "@/lib/supabase/server";
import { StudySession } from "@/types/study/study.types";

export class AnalyticsService {
  /**
   * Log a study session into the database.
   */
  static async logStudySession(params: {
    userId: string;
    fileId: string;
    durationMinutes: number;
    startedAt: string;
    endedAt: string;
  }): Promise<StudySession> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("study_sessions")
      .insert({
        user_id: params.userId,
        file_id: params.fileId,
        duration_minutes: params.durationMinutes,
        started_at: params.startedAt,
        ended_at: params.endedAt,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error("Failed to log study session: " + error?.message);
    }
    return data as StudySession;
  }

  /**
   * Fetch a summary of study sessions for dashboard statistics.
   */
  static async getStudySessionsSummary(userId: string): Promise<{ totalMinutes: number; sessionCount: number }> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("study_sessions")
      .select("duration_minutes")
      .eq("user_id", userId);

    if (error || !data) {
      return { totalMinutes: 0, sessionCount: 0 };
    }

    const totalMinutes = data.reduce((acc, row) => acc + (row.duration_minutes || 0), 0);
    return {
      totalMinutes,
      sessionCount: data.length,
    };
  }
}
