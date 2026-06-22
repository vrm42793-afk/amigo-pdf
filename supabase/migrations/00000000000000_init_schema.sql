-- Migration 00000000000000_init_schema.sql

-- Enable extensions
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE (PUBLIC PROFILE)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  avatar text,
  plan text default 'free' not null, -- 'free', 'pro', 'enterprise'
  storage_used bigint default 0 not null,
  storage_limit bigint default 104857600 not null, -- 100MB default limit
  ai_words_used integer default 0 not null,
  ai_words_limit integer default 50000 not null, -- 50k words default limit
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. FILES TABLE
create table public.files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  size bigint not null,
  type text not null,
  cloudinary_public_id text not null,
  cloudinary_secure_url text not null,
  ocr_status text default 'pending' not null,
  ocr_text text,
  metadata jsonb default '{}'::jsonb not null,
  is_deleted boolean default false not null,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CHAT HISTORY TABLE
create table public.chat_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  file_id uuid references public.files(id) on delete cascade,
  title text not null,
  messages jsonb default '[]'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. FLASHCARDS TABLE
create table public.flashcards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  file_id uuid references public.files(id) on delete cascade,
  deck_name text not null,
  cards jsonb default '[]'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. NOTES TABLE
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  file_id uuid references public.files(id) on delete cascade,
  title text not null,
  content text not null,
  notes_type text default 'structured' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. WATERMARK JOBS TABLE
create table public.watermark_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  file_id uuid references public.files(id) on delete cascade not null,
  status text default 'pending' not null,
  settings jsonb default '{}'::jsonb not null,
  result_file_url text,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.files enable row level security;
alter table public.chat_history enable row level security;
alter table public.flashcards enable row level security;
alter table public.notes enable row level security;
alter table public.watermark_jobs enable row level security;

-- Setup updated_at trigger helper
create or replace function public.set_current_timestamp_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger set_users_updated_at before update on public.users for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_files_updated_at before update on public.files for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_chat_history_updated_at before update on public.chat_history for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_flashcards_updated_at before update on public.flashcards for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_notes_updated_at before update on public.notes for each row execute procedure public.set_current_timestamp_updated_at();
create trigger set_watermark_jobs_updated_at before update on public.watermark_jobs for each row execute procedure public.set_current_timestamp_updated_at();

-- Trigger to automatically create a profile for new auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar, plan, storage_used)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'free',
    0
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Setup Row Level Security (RLS) Policies
-- Users
create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Files
create policy "Users can view own files" on public.files for select using (auth.uid() = user_id);
create policy "Users can insert own files" on public.files for insert with check (auth.uid() = user_id);
create policy "Users can update own files" on public.files for update using (auth.uid() = user_id);
create policy "Users can delete own files" on public.files for delete using (auth.uid() = user_id);

-- Chat History
create policy "Users can view own chats" on public.chat_history for select using (auth.uid() = user_id);
create policy "Users can insert own chats" on public.chat_history for insert with check (auth.uid() = user_id);
create policy "Users can update own chats" on public.chat_history for update using (auth.uid() = user_id);
create policy "Users can delete own chats" on public.chat_history for delete using (auth.uid() = user_id);

-- Flashcards
create policy "Users can view own flashcards" on public.flashcards for select using (auth.uid() = user_id);
create policy "Users can insert own flashcards" on public.flashcards for insert with check (auth.uid() = user_id);
create policy "Users can update own flashcards" on public.flashcards for update using (auth.uid() = user_id);
create policy "Users can delete own flashcards" on public.flashcards for delete using (auth.uid() = user_id);

-- Notes
create policy "Users can view own notes" on public.notes for select using (auth.uid() = user_id);
create policy "Users can insert own notes" on public.notes for insert with check (auth.uid() = user_id);
create policy "Users can update own notes" on public.notes for update using (auth.uid() = user_id);
create policy "Users can delete own notes" on public.notes for delete using (auth.uid() = user_id);

-- Watermark Jobs
create policy "Users can view own watermark jobs" on public.watermark_jobs for select using (auth.uid() = user_id);
create policy "Users can insert own watermark jobs" on public.watermark_jobs for insert with check (auth.uid() = user_id);
create policy "Users can update own watermark jobs" on public.watermark_jobs for update using (auth.uid() = user_id);
create policy "Users can delete own watermark jobs" on public.watermark_jobs for delete using (auth.uid() = user_id);

-- Indexes for performance
create index files_user_id_idx on public.files(user_id);
create index chat_history_user_id_idx on public.chat_history(user_id);
create index chat_history_file_id_idx on public.chat_history(file_id);
create index flashcards_user_id_idx on public.flashcards(user_id);
create index flashcards_file_id_idx on public.flashcards(file_id);
create index notes_user_id_idx on public.notes(user_id);
create index notes_file_id_idx on public.notes(file_id);
create index watermark_jobs_user_id_idx on public.watermark_jobs(user_id);
