-- Migration 00000000000001_storage_rpcs.sql
-- Add RPC functions for atomic storage usage tracking

create or replace function public.increment_storage_used(p_user_id uuid, p_bytes bigint)
returns void as $$
begin
  update public.users
  set storage_used = storage_used + p_bytes,
      updated_at = now()
  where id = p_user_id;
end;
$$ language plpgsql security definer;

create or replace function public.decrement_storage_used(p_user_id uuid, p_bytes bigint)
returns void as $$
begin
  update public.users
  set storage_used = greatest(0, storage_used - p_bytes),
      updated_at = now()
  where id = p_user_id;
end;
$$ language plpgsql security definer;
