-- Comments Micro users leave on a card. Card ids come from the app's seed content.

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  card_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Copied from the profile so a thread can be read without exposing every profile row.
  author_name text not null,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index comments_card_id_created_at_idx on public.comments (card_id, created_at);

alter table public.comments enable row level security;

create policy "Signed-in users read comments"
  on public.comments for select to authenticated
  using (true);

create policy "Users write their own comments"
  on public.comments for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own comments"
  on public.comments for delete to authenticated
  using ((select auth.uid()) = user_id);

-- One round trip for the counts shown on the feed's comment button.
create function public.comment_counts(card_ids text[])
returns table (card_id text, total bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.card_id, count(*) as total
  from public.comments c
  where c.card_id = any(card_ids)
  group by c.card_id;
$$;
