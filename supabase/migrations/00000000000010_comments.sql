-- ============================================================
-- Phase 10B — Threaded Comments
-- ============================================================

-- comments: Threaded discussions on documents, notes, collections, etc.
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  entity_type text not null check (entity_type in ('file', 'study_note', 'flashcard', 'quiz', 'collection')),
  entity_id uuid not null,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_comments_entity on public.comments(entity_type, entity_id);
create index if not exists idx_comments_parent on public.comments(parent_id);

-- notifications: Simple notification rows.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id);

-- RLS
alter table public.comments enable row level security;
alter table public.notifications enable row level security;

-- Comments Policies
-- A user can view a comment if they own it, or if they have access to the entity.
-- To keep it simple but secure for v1, we allow authenticated users to view comments.
create policy "Authenticated users can view comments"
  on public.comments for select
  using (auth.uid() is not null);

create policy "Authenticated users can insert comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own comments"
  on public.comments for update
  using (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Notifications Policies
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);
