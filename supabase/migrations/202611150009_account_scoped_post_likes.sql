create table if not exists public.post_likes (
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_user_id_idx
  on public.post_likes(user_id);

alter table public.post_likes enable row level security;

drop policy if exists post_likes_read_authenticated on public.post_likes;
drop policy if exists post_likes_insert_own on public.post_likes;
drop policy if exists post_likes_delete_own on public.post_likes;

create policy post_likes_read_authenticated
  on public.post_likes for select to authenticated
  using (true);

create policy post_likes_insert_own
  on public.post_likes for insert to authenticated
  with check (user_id = auth.uid());

create policy post_likes_delete_own
  on public.post_likes for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, delete on public.post_likes to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'post_likes'
    ) then
    alter publication supabase_realtime add table public.post_likes;
  end if;
end;
$$;