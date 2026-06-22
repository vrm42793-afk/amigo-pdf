-- Migration 00000000000003_ai_intelligence.sql

-- 1. DOCUMENT CHUNKS TABLE
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  token_count integer not null,
  embedding jsonb null,
  section_title text null,
  page_number integer null,
  created_at timestamp with time zone not null default now()
);

-- 2. CHAT SESSIONS TABLE
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  file_id uuid null references public.files(id) on delete cascade,
  title text not null,
  created_at timestamp with time zone not null default now()
);

-- 3. CHAT MESSAGES TABLE
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  message text not null,
  created_at timestamp with time zone not null default now()
);

-- 4. QUIZZES TABLE
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  file_id uuid null references public.files(id) on delete cascade,
  title text not null,
  created_at timestamp with time zone not null default now()
);

-- 5. QUIZ QUESTIONS TABLE
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_answer text not null,
  explanation text null
);

-- 6. AI USAGE TABLE
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  feature text not null,
  tokens_input integer not null,
  tokens_output integer not null,
  model text not null,
  cost_estimate numeric not null default 0,
  created_at timestamp with time zone not null default now()
);

-- 7. GENERATED SUMMARIES TABLE
create table if not exists public.generated_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  file_id uuid not null references public.files(id) on delete cascade,
  summary_type text not null,
  content text not null,
  created_at timestamp with time zone not null default now()
);

-- 8. PROMPT VERSIONS TABLE
create table if not exists public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  feature text not null,
  version text not null,
  prompt text not null,
  created_at timestamp with time zone not null default now()
);

-- 9. AI RATE LIMITS TABLE
create table if not exists public.ai_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  feature text not null,
  request_count integer not null default 0,
  window_start timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now()
);

-- 10. MODIFY NOTES TABLE
alter table public.notes add column if not exists note_type text default 'structured';
alter table public.notes add column if not exists ai_generated boolean default false;

-- Enable Row Level Security (RLS)
alter table public.document_chunks enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.ai_usage enable row level security;
alter table public.generated_summaries enable row level security;
alter table public.prompt_versions enable row level security;
alter table public.ai_rate_limits enable row level security;

-- Setup RLS Policies

-- Document Chunks Policies
create policy "Users can view own document chunks" on public.document_chunks for select using (auth.uid() = user_id);
create policy "Users can insert own document chunks" on public.document_chunks for insert with check (auth.uid() = user_id);
create policy "Users can delete own document chunks" on public.document_chunks for delete using (auth.uid() = user_id);

-- Chat Sessions Policies
create policy "Users can view own chat sessions" on public.chat_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own chat sessions" on public.chat_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own chat sessions" on public.chat_sessions for update using (auth.uid() = user_id);
create policy "Users can delete own chat sessions" on public.chat_sessions for delete using (auth.uid() = user_id);

-- Chat Messages Policies
create policy "Users can view own chat messages" on public.chat_messages for select 
  using (exists (select 1 from public.chat_sessions where chat_sessions.id = chat_messages.session_id and chat_sessions.user_id = auth.uid()));
create policy "Users can insert own chat messages" on public.chat_messages for insert 
  with check (exists (select 1 from public.chat_sessions where chat_sessions.id = chat_messages.session_id and chat_sessions.user_id = auth.uid()));
create policy "Users can delete own chat messages" on public.chat_messages for delete 
  using (exists (select 1 from public.chat_sessions where chat_sessions.id = chat_messages.session_id and chat_sessions.user_id = auth.uid()));

-- Quizzes Policies
create policy "Users can view own quizzes" on public.quizzes for select using (auth.uid() = user_id);
create policy "Users can insert own quizzes" on public.quizzes for insert with check (auth.uid() = user_id);
create policy "Users can delete own quizzes" on public.quizzes for delete using (auth.uid() = user_id);

-- Quiz Questions Policies
create policy "Users can view own quiz questions" on public.quiz_questions for select 
  using (exists (select 1 from public.quizzes where quizzes.id = quiz_questions.quiz_id and quizzes.user_id = auth.uid()));
create policy "Users can insert own quiz questions" on public.quiz_questions for insert 
  with check (exists (select 1 from public.quizzes where quizzes.id = quiz_questions.quiz_id and quizzes.user_id = auth.uid()));
create policy "Users can delete own quiz questions" on public.quiz_questions for delete 
  using (exists (select 1 from public.quizzes where quizzes.id = quiz_questions.quiz_id and quizzes.user_id = auth.uid()));

-- AI Usage Policies
create policy "Users can view own AI usage" on public.ai_usage for select using (auth.uid() = user_id);
create policy "Users can insert own AI usage" on public.ai_usage for insert with check (auth.uid() = user_id);

-- Generated Summaries Policies
create policy "Users can view own summaries" on public.generated_summaries for select using (auth.uid() = user_id);
create policy "Users can insert own summaries" on public.generated_summaries for insert with check (auth.uid() = user_id);
create policy "Users can delete own summaries" on public.generated_summaries for delete using (auth.uid() = user_id);

-- Prompt Versions Policies (Anyone can read, system/admin can manage. Since we are simulating local environment, allow read by all authenticated users)
create policy "Users can view prompt versions" on public.prompt_versions for select using (auth.role() = 'authenticated');
create policy "Users can manage prompt versions" on public.prompt_versions for all using (auth.role() = 'authenticated');

-- AI Rate Limits Policies
create policy "Users can view own AI rate limits" on public.ai_rate_limits for select using (auth.uid() = user_id);
create policy "Users can insert own AI rate limits" on public.ai_rate_limits for insert with check (auth.uid() = user_id);
create policy "Users can update own AI rate limits" on public.ai_rate_limits for update using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_document_chunks_user_id on public.document_chunks(user_id);
create index if not exists idx_document_chunks_file_id on public.document_chunks(file_id);
create index if not exists idx_chat_sessions_user_id on public.chat_sessions(user_id);
create index if not exists idx_chat_sessions_file_id on public.chat_sessions(file_id);
create index if not exists idx_chat_messages_session_id on public.chat_messages(session_id);
create index if not exists idx_quizzes_user_id on public.quizzes(user_id);
create index if not exists idx_quizzes_file_id on public.quizzes(file_id);
create index if not exists idx_quiz_questions_quiz_id on public.quiz_questions(quiz_id);
create index if not exists idx_ai_usage_user_id on public.ai_usage(user_id);
create index if not exists idx_generated_summaries_user_id on public.generated_summaries(user_id);
create index if not exists idx_generated_summaries_file_id on public.generated_summaries(file_id);
create index if not exists idx_ai_rate_limits_user_id on public.ai_rate_limits(user_id);
