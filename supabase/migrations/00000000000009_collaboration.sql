-- ============================================================
-- Phase 10A — Shared Collections
-- ============================================================

-- friendships: Manage friend list connection states.
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  friend_id uuid references auth.users(id) on delete cascade not null,
  status text not null check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz default now()
);

create index if not exists idx_friendships_user on public.friendships(user_id);
create index if not exists idx_friendships_friend on public.friendships(friend_id);

-- collection_invites: Invites to share a collection via email or ID.
create table if not exists public.collection_invites (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references public.collections(id) on delete cascade not null,
  inviter_id uuid references auth.users(id) on delete cascade not null,
  invitee_email text not null,
  status text not null check (status in ('pending', 'accepted', 'declined')),
  permission text not null check (permission in ('view', 'edit', 'owner')),
  created_at timestamptz default now()
);

create index if not exists idx_coll_invites_email on public.collection_invites(invitee_email);
create index if not exists idx_coll_invites_collection on public.collection_invites(collection_id);

-- shared_collections: Actual access records for shared collections.
create table if not exists public.shared_collections (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references public.collections(id) on delete cascade not null,
  shared_with_user_id uuid references auth.users(id) on delete cascade not null,
  permission text not null check (permission in ('view', 'edit', 'owner')),
  created_at timestamptz default now()
);

create index if not exists idx_shared_coll_collection on public.shared_collections(collection_id);
create index if not exists idx_shared_coll_user on public.shared_collections(shared_with_user_id);

-- RLS
alter table public.friendships enable row level security;
alter table public.collection_invites enable row level security;
alter table public.shared_collections enable row level security;

-- Friendships Policies (can view if you are the user or the friend)
create policy "Users can view own friendships"
  on public.friendships for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can insert own friendships"
  on public.friendships for insert
  with check (auth.uid() = user_id);

create policy "Users can update own friendships"
  on public.friendships for update
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can delete own friendships"
  on public.friendships for delete
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Collection Invites Policies
create policy "Users can view invites they sent or received"
  on public.collection_invites for select
  using (
    auth.uid() = inviter_id or
    invitee_email = (select email from auth.users where id = auth.uid())
  );

create policy "Users can insert invites if they own the collection or have owner access"
  on public.collection_invites for insert
  with check (
    exists (
      select 1 from public.collections where id = collection_id and user_id = auth.uid()
    ) or
    exists (
      select 1 from public.shared_collections where collection_id = collection_invites.collection_id and shared_with_user_id = auth.uid() and permission = 'owner'
    )
  );

create policy "Users can update invites sent to them"
  on public.collection_invites for update
  using (invitee_email = (select email from auth.users where id = auth.uid()));

create policy "Users can delete invites they sent"
  on public.collection_invites for delete
  using (auth.uid() = inviter_id);

-- Shared Collections Policies
create policy "Users can view collections shared with them or owned by them"
  on public.shared_collections for select
  using (
    shared_with_user_id = auth.uid() or
    exists (
      select 1 from public.collections where id = collection_id and user_id = auth.uid()
    )
  );

create policy "Users can insert shared collections if they are owners"
  on public.shared_collections for insert
  with check (
    exists (
      select 1 from public.collections where id = collection_id and user_id = auth.uid()
    ) or
    exists (
      select 1 from public.shared_collections as sc where sc.collection_id = shared_collections.collection_id and sc.shared_with_user_id = auth.uid() and sc.permission = 'owner'
    )
  );

create policy "Users can update shared collections if they are owners"
  on public.shared_collections for update
  using (
    exists (
      select 1 from public.collections where id = collection_id and user_id = auth.uid()
    ) or
    exists (
      select 1 from public.shared_collections as sc where sc.collection_id = shared_collections.collection_id and sc.shared_with_user_id = auth.uid() and sc.permission = 'owner'
    )
  );

create policy "Users can delete shared collections if they are owners or themselves"
  on public.shared_collections for delete
  using (
    shared_with_user_id = auth.uid() or
    exists (
      select 1 from public.collections where id = collection_id and user_id = auth.uid()
    ) or
    exists (
      select 1 from public.shared_collections as sc where sc.collection_id = shared_collections.collection_id and sc.shared_with_user_id = auth.uid() and sc.permission = 'owner'
    )
  );
