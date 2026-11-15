alter table public.messages enable row level security;

drop policy if exists messages_account_select on public.messages;
drop policy if exists messages_account_select_limit on public.messages;
drop policy if exists messages_account_insert on public.messages;
drop policy if exists messages_account_insert_limit on public.messages;
drop policy if exists messages_account_update on public.messages;
drop policy if exists messages_account_update_limit on public.messages;
drop policy if exists messages_account_delete on public.messages;
drop policy if exists messages_account_delete_limit on public.messages;

create policy messages_account_select
  on public.messages as permissive for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy messages_account_select_limit
  on public.messages as restrictive for select to public
  using (auth.uid() is not null and (sender_id = auth.uid() or receiver_id = auth.uid()));

create policy messages_account_insert
  on public.messages as permissive for insert to authenticated
  with check (sender_id = auth.uid());
create policy messages_account_insert_limit
  on public.messages as restrictive for insert to public
  with check (auth.uid() is not null and sender_id = auth.uid());

create policy messages_account_update
  on public.messages as permissive for update to authenticated
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());
create policy messages_account_update_limit
  on public.messages as restrictive for update to public
  using (auth.uid() is not null and receiver_id = auth.uid())
  with check (auth.uid() is not null and receiver_id = auth.uid());

create policy messages_account_delete
  on public.messages as permissive for delete to authenticated
  using (sender_id = auth.uid());
create policy messages_account_delete_limit
  on public.messages as restrictive for delete to public
  using (auth.uid() is not null and sender_id = auth.uid());

create table if not exists public.private_replies (
  id uuid primary key default gen_random_uuid(),
  post_id bigint not null references public.posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  reply_to_id uuid references public.private_replies(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists private_replies_post_created_at_idx
  on public.private_replies(post_id, created_at);

alter table public.private_replies enable row level security;

create policy private_replies_select_participants
  on public.private_replies for select to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.posts
      where posts.id = private_replies.post_id
        and posts.user_id = auth.uid()
    )
  );

create policy private_replies_insert_author
  on public.private_replies for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1
      from public.posts
      where posts.id = private_replies.post_id
        and (
          (posts.user_id <> auth.uid() and private_replies.reply_to_id is null)
          or (posts.user_id = auth.uid() and private_replies.reply_to_id is not null)
        )
    )
    and (
      reply_to_id is null
      or exists (
        select 1 from public.private_replies parent
        where parent.id = private_replies.reply_to_id
          and parent.post_id = private_replies.post_id
      )
    )
  );

create policy private_replies_update_post_owner
  on public.private_replies for update to authenticated
  using (
    exists (
      select 1 from public.posts
      where posts.id = private_replies.post_id
        and posts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.posts
      where posts.id = private_replies.post_id
        and posts.user_id = auth.uid()
    )
  );

grant select, insert, update on public.messages to authenticated;
grant select, insert, update on public.private_replies to authenticated;
revoke update on public.messages from authenticated;
grant update (is_read) on public.messages to authenticated;
revoke update on public.private_replies from authenticated;
grant update (is_read) on public.private_replies to authenticated;