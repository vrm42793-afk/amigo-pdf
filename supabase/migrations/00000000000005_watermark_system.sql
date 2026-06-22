-- Create watermark_jobs table
create table public.watermark_jobs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    file_id uuid references public.files(id) on delete cascade not null,
    status text not null check (status in ('pending', 'processing', 'completed', 'failed')),
    progress integer not null default 0 check (progress >= 0 and progress <= 100),
    error_message text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create watermark_regions table
create table public.watermark_regions (
    id uuid primary key default gen_random_uuid(),
    job_id uuid references public.watermark_jobs(id) on delete cascade not null,
    page_number integer not null check (page_number > 0),
    x_min numeric not null check (x_min >= 0.0 and x_min <= 1.0),
    y_min numeric not null check (y_min >= 0.0 and y_min <= 1.0),
    x_max numeric not null check (x_max >= 0.0 and x_max <= 1.0),
    y_max numeric not null check (y_max >= 0.0 and y_max <= 1.0),
    type text not null check (type in ('text', 'logo', 'diagonal')),
    confidence numeric not null check (confidence >= 0.0 and confidence <= 1.0),
    created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.watermark_jobs enable row level security;
alter table public.watermark_regions enable row level security;

-- Create policies for watermark_jobs
create policy "Users can view their own watermark jobs"
    on public.watermark_jobs for select
    using (auth.uid() = user_id);

create policy "Users can insert their own watermark jobs"
    on public.watermark_jobs for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own watermark jobs"
    on public.watermark_jobs for update
    using (auth.uid() = user_id);

-- Create policies for watermark_regions
create policy "Users can view their watermark regions"
    on public.watermark_regions for select
    using (
        exists (
            select 1 from public.watermark_jobs
            where public.watermark_jobs.id = watermark_regions.job_id
            and public.watermark_jobs.user_id = auth.uid()
        )
    );

create policy "Users can insert their watermark regions"
    on public.watermark_regions for insert
    with check (
        exists (
            select 1 from public.watermark_jobs
            where public.watermark_jobs.id = watermark_regions.job_id
            and public.watermark_jobs.user_id = auth.uid()
        )
    );

-- Create indices
create index idx_watermark_jobs_user_id on public.watermark_jobs(user_id);
create index idx_watermark_jobs_file_id on public.watermark_jobs(file_id);
create index idx_watermark_regions_job_id on public.watermark_regions(job_id);
