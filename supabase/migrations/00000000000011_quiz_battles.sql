-- ============================================================
-- Phase 10C — Quiz Battles
-- ============================================================

-- quiz_battles: Dynamic quiz tournaments.
create table if not exists public.quiz_battles (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id) on delete cascade not null,
  collection_id uuid references public.collections(id) on delete set null,
  title text not null,
  status text not null check (status in ('lobby', 'active', 'finished')),
  question_count integer not null default 10,
  time_limit_minutes integer not null default 5,
  created_at timestamptz default now()
);

-- battle_participants: Users who joined a battle.
create table if not exists public.battle_participants (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid references public.quiz_battles(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  joined_at timestamptz default now(),
  status text not null check (status in ('joined', 'playing', 'finished')) default 'joined',
  unique(battle_id, user_id)
);

-- battle_answers: Answers selected by participants during the battle.
create table if not exists public.battle_answers (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid references public.quiz_battles(id) on delete cascade not null,
  participant_id uuid references public.battle_participants(id) on delete cascade not null,
  question_id uuid references public.question_bank(id) on delete cascade not null,
  selected_answer text not null,
  is_correct boolean not null,
  time_taken_seconds integer not null default 0,
  created_at timestamptz default now()
);

-- battle_scores: Final scores for participants.
create table if not exists public.battle_scores (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid references public.quiz_battles(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  score integer not null default 0,
  accuracy numeric default 0,
  time_taken_seconds integer not null default 0,
  rank integer,
  unique(battle_id, user_id)
);

-- RLS
alter table public.quiz_battles enable row level security;
alter table public.battle_participants enable row level security;
alter table public.battle_answers enable row level security;
alter table public.battle_scores enable row level security;

-- Policies for Quiz Battles
create policy "Authenticated users can select battles"
  on public.quiz_battles for select
  using (auth.uid() is not null);

create policy "Users can insert their own battles"
  on public.quiz_battles for insert
  with check (auth.uid() = creator_id);

create policy "Creators can update their battles"
  on public.quiz_battles for update
  using (auth.uid() = creator_id);

-- Policies for Participants
create policy "Authenticated users can view participants"
  on public.battle_participants for select
  using (auth.uid() is not null);

create policy "Users can join battles"
  on public.battle_participants for insert
  with check (auth.uid() = user_id);

create policy "Users can update their participation status"
  on public.battle_participants for update
  using (auth.uid() = user_id);

-- Policies for Answers
create policy "Users can insert their own answers"
  on public.battle_answers for insert
  with check (
    participant_id in (
      select id from public.battle_participants where user_id = auth.uid()
    )
  );

create policy "Authenticated users can view answers"
  on public.battle_answers for select
  using (auth.uid() is not null);

-- Policies for Scores
create policy "Authenticated users can view scores"
  on public.battle_scores for select
  using (auth.uid() is not null);

create policy "Users can insert their own score"
  on public.battle_scores for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own score"
  on public.battle_scores for update
  using (auth.uid() = user_id);

-- Enable realtime broadcasting for battle tables
begin;
  -- If we're on supabase, we would use:
  -- alter publication supabase_realtime add table public.quiz_battles, public.battle_participants, public.battle_scores;
commit;
