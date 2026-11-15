alter table public.private_replies
  add column if not exists receiver_id uuid;

update public.private_replies as reply
set receiver_id = post.user_id
from public.posts as post
where post.id = reply.post_id
  and reply.receiver_id is distinct from post.user_id;

do $$
begin
  if exists (
    select 1 from public.private_replies where receiver_id is null
  ) then
    raise exception 'private_replies has rows without a matching post author';
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.conrelid = 'public.private_replies'::regclass
      and c.contype = 'f'
      and a.attname = 'receiver_id'
      and c.confrelid = 'auth.users'::regclass
  ) then
    alter table public.private_replies
      add constraint private_replies_receiver_id_fkey
      foreign key (receiver_id) references auth.users(id) on delete cascade;
  end if;
end;
$$;

alter table public.private_replies alter column receiver_id set not null;

drop policy if exists private_replies_insert_author on public.private_replies;
drop policy if exists private_replies_account_insert_limit on public.private_replies;

create policy private_replies_insert_author
  on public.private_replies as permissive for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.posts
      where posts.id = private_replies.post_id
        and posts.user_id = private_replies.receiver_id
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

create policy private_replies_account_insert_limit
  on public.private_replies as restrictive for insert to public
  with check (
    auth.uid() is not null
    and author_id = auth.uid()
    and exists (
      select 1 from public.posts
      where posts.id = private_replies.post_id
        and posts.user_id = private_replies.receiver_id
        and (
          (posts.user_id <> auth.uid() and private_replies.reply_to_id is null)
          or (posts.user_id = auth.uid() and private_replies.reply_to_id is not null)
        )
    )
  );