-- Migration 00000000000007_workspace.sql

-- 1. Create collections table
create table if not exists public.collections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    description text,
    icon text not null default 'Folder',
    color text not null default 'blue',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Create collection_items table
create table if not exists public.collection_items (
    id uuid primary key default gen_random_uuid(),
    collection_id uuid references public.collections(id) on delete cascade not null,
    item_type text not null check (item_type in ('file', 'note', 'flashcard', 'quiz')),
    item_id uuid not null,
    created_at timestamptz not null default now(),
    unique(collection_id, item_type, item_id)
);

-- 3. Enable RLS
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;

-- 4. Create Policies for collections
create policy "Users can view their own collections" on public.collections
    for select using (auth.uid() = user_id);

create policy "Users can insert their own collections" on public.collections
    for insert with check (auth.uid() = user_id);

create policy "Users can update their own collections" on public.collections
    for update using (auth.uid() = user_id);

create policy "Users can delete their own collections" on public.collections
    for delete using (auth.uid() = user_id);

-- 5. Create Policies for collection_items
create policy "Users can view their own collection items" on public.collection_items
    for select using (exists (
        select 1 from public.collections
        where public.collections.id = collection_items.collection_id
        and public.collections.user_id = auth.uid()
    ));

create policy "Users can insert their own collection items" on public.collection_items
    for insert with check (exists (
        select 1 from public.collections
        where public.collections.id = collection_items.collection_id
        and public.collections.user_id = auth.uid()
    ));

create policy "Users can delete their own collection items" on public.collection_items
    for delete using (exists (
        select 1 from public.collections
        where public.collections.id = collection_items.collection_id
        and public.collections.user_id = auth.uid()
    ));

-- 6. Triggers for updated_at
create trigger set_collections_updated_at before update on public.collections
    for each row execute procedure public.set_current_timestamp_updated_at();

-- 7. Create Search RPC Function
create or replace function public.search_workspace(p_user_id uuid, p_query text)
returns table (
    item_type text,
    item_id uuid,
    title text,
    content_snippet text,
    created_at timestamptz
) as $$
begin
    return query
    -- Files
    select 'file'::text as item_type, f.id as item_id, f.name as title, substring(coalesce(f.ocr_text, '') from 1 for 200) as content_snippet, f.created_at as created_at
    from public.files f
    where f.user_id = p_user_id and f.is_deleted = false and (f.name ilike '%' || p_query || '%' or f.ocr_text ilike '%' || p_query || '%')

    union all

    -- Notes (Original)
    select 'note'::text as item_type, n.id as item_id, n.title, substring(n.content from 1 for 200) as content_snippet, n.created_at as created_at
    from public.notes n
    where n.user_id = p_user_id and (n.title ilike '%' || p_query || '%' or n.content ilike '%' || p_query || '%')

    union all

    -- Study Notes
    select 'note'::text as item_type, sn.id as item_id, sn.title, substring(sn.content from 1 for 200) as content_snippet, sn.created_at as created_at
    from public.study_notes sn
    where sn.user_id = p_user_id and (sn.title ilike '%' || p_query || '%' or sn.content ilike '%' || p_query || '%')

    union all

    -- Flashcards
    select 'flashcard'::text as item_type, fc.id as item_id, fc.deck_name as title,
           coalesce(
               (
                   select string_agg(c->>'question' || ' - ' || c->>'answer', '; ')
                   from jsonb_array_elements(fc.cards) as c
                   where c->>'question' ilike '%' || p_query || '%' or c->>'answer' ilike '%' || p_query || '%'
               ),
               ''
           ) as content_snippet,
           fc.created_at as created_at
    from public.flashcards fc
    where fc.user_id = p_user_id and (
        fc.deck_name ilike '%' || p_query || '%' or
        exists (
            select 1 from jsonb_array_elements(fc.cards) as c
            where c->>'question' ilike '%' || p_query || '%' or c->>'answer' ilike '%' || p_query || '%'
        )
    )

    union all

    -- Quizzes
    select 'quiz'::text as item_type, q.id as item_id, q.title,
           coalesce(
               (
                   select string_agg(qq.question, '; ')
                   from public.quiz_questions qq
                   where qq.quiz_id = q.id and (qq.question ilike '%' || p_query || '%' or qq.explanation ilike '%' || p_query || '%')
               ),
               ''
           ) as content_snippet,
           q.created_at as created_at
    from public.quizzes q
    where q.user_id = p_user_id and (
        q.title ilike '%' || p_query || '%' or
        exists (
            select 1 from public.quiz_questions qq
            where qq.quiz_id = q.id and (qq.question ilike '%' || p_query || '%' or qq.explanation ilike '%' || p_query || '%')
        )
    )

    union all

    -- Chat History (Original)
    select 'chat'::text as item_type, ch.id as item_id, ch.title,
           coalesce(
               (
                   select string_agg(m->>'message', '; ')
                   from jsonb_array_elements(ch.messages) as m
                   where m->>'message' ilike '%' || p_query || '%'
               ),
               ''
           ) as content_snippet,
           ch.created_at as created_at
    from public.chat_history ch
    where ch.user_id = p_user_id and (
        ch.title ilike '%' || p_query || '%' or
        exists (
            select 1 from jsonb_array_elements(ch.messages) as m
            where m->>'message' ilike '%' || p_query || '%'
        )
    )

    union all

    -- Chat Sessions
    select 'chat'::text as item_type, cs.id as item_id, cs.title,
           coalesce(
               (
                   select string_agg(cm.message, '; ')
                   from public.chat_messages cm
                   where cm.session_id = cs.id and cm.message ilike '%' || p_query || '%'
               ),
               ''
           ) as content_snippet,
           cs.created_at as created_at
    from public.chat_sessions cs
    where cs.user_id = p_user_id and (
        cs.title ilike '%' || p_query || '%' or
        exists (
            select 1 from public.chat_messages cm
            where cm.session_id = cs.id and cm.message ilike '%' || p_query || '%'
        )
    );
end;
$$ language plpgsql security definer;

-- 8. Indexes for performance
create index if not exists idx_collections_user_id on public.collections(user_id);
create index if not exists idx_collection_items_collection_id on public.collection_items(collection_id);
