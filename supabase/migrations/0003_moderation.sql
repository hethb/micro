-- Moderation for comments: people can block someone or report a comment, and
-- anything they blocked or reported disappears from their feed straight away.

create table public.blocked_users (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  -- Copied so the blocked list can be shown without reading other profiles.
  blocked_name text not null,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocked_users_not_self check (blocker_id <> blocked_id)
);

alter table public.blocked_users enable row level security;

create policy "Users manage their own block list"
  on public.blocked_users for all to authenticated
  using ((select auth.uid()) = blocker_id)
  with check ((select auth.uid()) = blocker_id);

create table public.comment_reports (
  comment_id uuid not null references public.comments (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (reason in ('spam', 'abuse', 'other')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  primary key (comment_id, reporter_id)
);

alter table public.comment_reports enable row level security;

create policy "Users read their own reports"
  on public.comment_reports for select to authenticated
  using ((select auth.uid()) = reporter_id);

create policy "Users report comments"
  on public.comment_reports for insert to authenticated
  with check ((select auth.uid()) = reporter_id);

-- What a signed-in user is allowed to see: everything except comments from people
-- they blocked and comments they reported. security_invoker keeps each user's own view.
create view public.visible_comments with (security_invoker = true) as
  select c.id, c.card_id, c.user_id, c.author_name, c.body, c.created_at
  from public.comments c
  where not exists (
      select 1 from public.blocked_users b
      where b.blocker_id = (select auth.uid()) and b.blocked_id = c.user_id
    )
    and not exists (
      select 1 from public.comment_reports r
      where r.comment_id = c.id and r.reporter_id = (select auth.uid())
    );

grant select on public.visible_comments to authenticated;

-- Counts follow the same rules, so a hidden comment doesn't show on the feed's badge.
create or replace function public.comment_counts(card_ids text[])
returns table (card_id text, total bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select v.card_id, count(*) as total
  from public.visible_comments v
  where v.card_id = any(card_ids)
  group by v.card_id;
$$;
