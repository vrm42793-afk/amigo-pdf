-- Upgrade all users to max limits for 20-member team usage

-- Update the default storage limit for the table
ALTER TABLE public.users ALTER COLUMN storage_limit SET DEFAULT 53687091200; -- 50 GB
ALTER TABLE public.users ALTER COLUMN plan SET DEFAULT 'pro';

-- Retroactively apply max limits to all existing users
UPDATE public.users 
SET 
  storage_limit = 53687091200,
  plan = 'pro';
