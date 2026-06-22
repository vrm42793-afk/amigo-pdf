-- Create study_notes table
create table public.study_notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    file_id uuid references public.files(id) on delete cascade not null,
    type text not null check (type in ('unit_notes', 'summary_sheet', 'formula_sheet', 'mindmap')),
    title text not null,
    content text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create exams table
create table public.exams (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    file_id uuid references public.files(id) on delete cascade not null,
    title text not null,
    duration_minutes integer not null default 180,
    created_at timestamptz not null default now()
);

-- Create exam_questions table
create table public.exam_questions (
    id uuid primary key default gen_random_uuid(),
    exam_id uuid references public.exams(id) on delete cascade not null,
    marks integer not null check (marks in (1, 2, 5, 7)),
    question_text text not null,
    marking_guide text not null,
    page_reference integer,
    created_at timestamptz not null default now()
);

-- Create flashcard_reviews table
create table public.flashcard_reviews (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    flashcard_id uuid references public.quiz_questions(id) on delete cascade not null,
    repetitions integer not null default 0 check (repetitions >= 0),
    interval_days integer not null default 0 check (interval_days >= 0),
    ease_factor numeric not null default 2.5 check (ease_factor >= 1.3),
    next_review_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

-- Create interview_sessions table
create table public.interview_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    file_id uuid references public.files(id) on delete cascade not null,
    status text not null check (status in ('active', 'completed')),
    current_question_index integer not null default 0,
    dialogue_history jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create study_sessions table
create table public.study_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    file_id uuid references public.files(id) on delete cascade not null,
    duration_minutes integer not null default 0,
    started_at timestamptz not null,
    ended_at timestamptz not null,
    created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.study_notes enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.flashcard_reviews enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.study_sessions enable row level security;

-- Policies for study_notes
create policy "Users can view their own study notes" on public.study_notes for select using (auth.uid() = user_id);
create policy "Users can insert their own study notes" on public.study_notes for insert with check (auth.uid() = user_id);
create policy "Users can update their own study notes" on public.study_notes for update using (auth.uid() = user_id);
create policy "Users can delete their own study notes" on public.study_notes for delete using (auth.uid() = user_id);

-- Policies for exams
create policy "Users can view their own exams" on public.exams for select using (auth.uid() = user_id);
create policy "Users can insert their own exams" on public.exams for insert with check (auth.uid() = user_id);
create policy "Users can update their own exams" on public.exams for update using (auth.uid() = user_id);
create policy "Users can delete their own exams" on public.exams for delete using (auth.uid() = user_id);

-- Policies for exam_questions
create policy "Users can view their own exam questions" on public.exam_questions for select
    using (exists (select 1 from public.exams where public.exams.id = exam_questions.exam_id and public.exams.user_id = auth.uid()));
create policy "Users can insert their own exam questions" on public.exam_questions for insert
    with check (exists (select 1 from public.exams where public.exams.id = exam_questions.exam_id and public.exams.user_id = auth.uid()));

-- Policies for flashcard_reviews
create policy "Users can view their own flashcard reviews" on public.flashcard_reviews for select using (auth.uid() = user_id);
create policy "Users can insert their own flashcard reviews" on public.flashcard_reviews for insert with check (auth.uid() = user_id);
create policy "Users can update their own flashcard reviews" on public.flashcard_reviews for update using (auth.uid() = user_id);

-- Policies for interview_sessions
create policy "Users can view their own interview sessions" on public.interview_sessions for select using (auth.uid() = user_id);
create policy "Users can insert their own interview sessions" on public.interview_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update their own interview sessions" on public.interview_sessions for update using (auth.uid() = user_id);

-- Policies for study_sessions
create policy "Users can view their own study sessions" on public.study_sessions for select using (auth.uid() = user_id);
create policy "Users can insert their own study sessions" on public.study_sessions for insert with check (auth.uid() = user_id);

-- Create indices
create index idx_study_notes_user_id on public.study_notes(user_id);
create index idx_study_notes_file_id on public.study_notes(file_id);
create index idx_exams_user_id on public.exams(user_id);
create index idx_exam_questions_exam_id on public.exam_questions(exam_id);
create index idx_flashcard_reviews_user_id on public.flashcard_reviews(user_id);
create index idx_interview_sessions_user_id on public.interview_sessions(user_id);
create index idx_study_sessions_user_id on public.study_sessions(user_id);
