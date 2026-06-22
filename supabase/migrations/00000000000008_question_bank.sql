-- ============================================================
-- Phase 9.5 — Smart Question Bank
-- ============================================================

-- question_bank: Catalog of AI-generated questions from study materials
create table if not exists public.question_bank (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  source_file_id uuid references public.files(id) on delete cascade not null,
  subject text not null,
  unit text,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  marks integer not null check (marks > 0),
  question text not null,
  answer text not null,
  created_at timestamptz default now()
);

-- Index for filtering by user, subject, difficulty
create index if not exists idx_qbank_user on public.question_bank(user_id);
create index if not exists idx_qbank_subject on public.question_bank(user_id, subject);
create index if not exists idx_qbank_difficulty on public.question_bank(user_id, difficulty);
create index if not exists idx_qbank_file on public.question_bank(source_file_id);

-- Row Level Security
alter table public.question_bank enable row level security;

create policy "Users can view own questions"
  on public.question_bank for select
  using (auth.uid() = user_id);

create policy "Users can insert own questions"
  on public.question_bank for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own questions"
  on public.question_bank for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Architecture Adjustment: question_attempts
-- ============================================================

create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  question_id uuid references public.question_bank(id) on delete cascade not null,
  is_correct boolean not null,
  time_taken integer not null default 0,
  attempted_at timestamptz default now()
);

create index if not exists idx_qattempts_user on public.question_attempts(user_id);
create index if not exists idx_qattempts_question on public.question_attempts(question_id);

alter table public.question_attempts enable row level security;

create policy "Users can view own attempts"
  on public.question_attempts for select
  using (auth.uid() = user_id);

create policy "Users can insert own attempts"
  on public.question_attempts for insert
  with check (auth.uid() = user_id);
