-- Migration 00000000000013_storage_policies.sql
-- Setup Storage Bucket and RLS Policies for user_files

-- Insert the bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('user_files', 'user_files', true)
on conflict (id) do update set public = true;

-- Ensure RLS is enabled (Skipped as it fails on Supabase remote due to ownership: alter table storage.objects enable row level security;)

-- Policy: Users can upload their own files
create policy "Users can upload their own files"
on storage.objects for insert
with check ( bucket_id = 'user_files' and auth.uid()::text = (storage.foldername(name))[1] );

-- Policy: Users can view their own files
create policy "Users can view their own files"
on storage.objects for select
using ( bucket_id = 'user_files' and auth.uid()::text = (storage.foldername(name))[1] );

-- Policy: Public can view files (since it's a public bucket)
create policy "Public can view files"
on storage.objects for select
using ( bucket_id = 'user_files' );

-- Policy: Users can update their own files
create policy "Users can update their own files"
on storage.objects for update
using ( bucket_id = 'user_files' and auth.uid()::text = (storage.foldername(name))[1] );

-- Policy: Users can delete their own files
create policy "Users can delete their own files"
on storage.objects for delete
using ( bucket_id = 'user_files' and auth.uid()::text = (storage.foldername(name))[1] );
