import { createClient } from "@/lib/supabase/server";
import { ChatService } from "@/server/ai/chat-service";
import { SummaryService } from "@/server/ai/summary-service";
import { FlashcardService } from "@/server/ai/flashcard-service";
import { QuizService } from "@/server/ai/quiz-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Sign In (This will set cookies because createClient uses cookieStore)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'yghybe0@gmail.com',
      password: 'Vema@1234'
    });
    
    if (authError || !authData.user) {
      return NextResponse.json({ success: false, error: "Login failed: " + authError?.message });
    }

    const userId = authData.user.id;
    const results: any = { userId };
    
    // 2. Fetch the specific file we know exists
    const { data: files } = await supabase.from('files').select('id, name').eq('user_id', userId).eq('name', 'test_doc.pdf').limit(1);
    
    if (!files || files.length === 0) {
      return NextResponse.json({ success: true, message: "Logged in, but no files found.", results });
    }

    const fileId = files[0].id;
    results.file = files[0].name;

    // 3. Test Chat Session
    try {
      const session = await ChatService.createSession(userId, fileId, "Test Session");
      let chatResponse = "";
      for await (const chunk of ChatService.streamChatResponse(userId, session.id, "Summarize this document briefly.")) {
        chatResponse += chunk.text || "";
      }
      results.chat = chatResponse;
    } catch (e: any) { results.chatError = e.message; }

    // 4. Test Summary
    try {
      const summary = await SummaryService.getSummary(userId, fileId, "short");
      results.summary = summary;
    } catch (e: any) { results.summaryError = e.message; }

    // 5. Test Flashcards
    try {
      const flashcards = await FlashcardService.generateDeck(userId, fileId, "Test Deck");
      results.flashcards = flashcards;
    } catch (e: any) { results.flashcardsError = e.message; }

    // 6. Test Quiz
    try {
      const quiz = await QuizService.generateQuiz(userId, fileId, "multiple_choice", "easy", "Test Quiz");
      results.quiz = quiz;
    } catch (e: any) { results.quizError = e.message; }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: String(error), stack: error.stack });
  }
}
