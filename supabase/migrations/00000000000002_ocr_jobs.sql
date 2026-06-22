-- Migration 00000000000002_ocr_jobs.sql

create table if not exists public.ocr_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  file_id uuid null references public.files(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  result jsonb null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Indexes for efficient querying by user and status
create index if not exists idx_ocr_jobs_user_id on public.ocr_jobs(user_id);
create index if not exists idx_ocr_jobs_status on public.ocr_jobs(status);
create index if not exists idx_ocr_jobs_file_id on public.ocr_jobs(file_id);

-- Trigger to auto-update updated_at
create trigger handle_ocr_jobs_updated_at
  before update on public.ocr_jobs
  for each row
  execute function public.handle_updated_at();

-- RLS Policies
alter table public.ocr_jobs enable row level security;

create policy "Users can view their own OCR jobs"
  on public.ocr_jobs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own OCR jobs"
  on public.ocr_jobs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own OCR jobs"
  on public.ocr_jobs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own OCR jobs"
  on public.ocr_jobs for delete
  using (auth.uid() = user_id);

-- Optional: Update files table trigger to mark ocr_status when file uploaded
-- We will handle this in application logic to keep SQL clean
