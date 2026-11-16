do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'private_replies' and column_name = 'sender_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'private_replies' and column_name = 'author_id'
  ) then
    alter table public.private_replies rename column sender_id to author_id;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'private_replies' and column_name = 'author_id'
  ) then
    alter table public.private_replies add column author_id uuid;
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'private_replies' and column_name = 'sender_id'
  ) then
    update public.private_replies
    set author_id = sender_id
    where author_id is null;
  end if;

  if exists (
    select 1 from public.private_replies where author_id is null
  ) then
    raise exception 'private_replies has rows without an author; assign each author_id before continuing';
  end if;
end;
$$;

alter table public.private_replies alter column author_id set not null;
alter table public.private_replies
  add column if not exists reply_to_id uuid references public.private_replies(id) on delete cascade;
alter table public.private_replies
  add column if not exists is_read boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.conrelid = 'public.private_replies'::regclass
      and c.contype = 'f'
      and a.attname = 'author_id'
      and c.confrelid = 'auth.users'::regclass
  ) then
    alter table public.private_replies
      add constraint private_replies_author_id_fkey
      foreign key (author_id) references auth.users(id) on delete cascade;
  end if;
end;
$$;

create index if not exists private_replies_post_created_at_idx
  on public.private_replies(post_id, created_at);

alter table public.private_replies enable row level security;
drop policy if exists private_replies_select_participants on public.private_replies;
drop policy if exists private_replies_insert_author on public.private_replies;
drop policy if exists private_replies_update_post_owner on public.private_replies;
drop policy if exists private_replies_account_select_limit on public.private_replies;
drop policy if exists private_replies_account_insert_limit on public.private_replies;
drop policy if exists private_replies_account_update_limit on public.private_replies;

create policy private_replies_select_participants
  on public.private_replies as permissive for select to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.posts
      where posts.id = private_replies.post_id
        and posts.user_id = auth.uid()
    )
  );
create policy private_replies_account_select_limit
  on public.private_replies as restrictive for select to public
  using (
    auth.uid() is not null
    and (
      author_id = auth.uid()
      or receiver_id = auth.uid()
      or exists (
        select 1 from public.posts
        where posts.id = private_replies.post_id
          and posts.user_id = auth.uid()
      )
    )
  );

create policy private_replies_insert_author
  on public.private_replies as permissive for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.posts
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
create policy private_replies_account_insert_limit
  on public.private_replies as restrictive for insert to public
  with check (
    auth.uid() is not null
    and author_id = auth.uid()
    and exists (
      select 1 from public.posts
      where posts.id = private_replies.post_id
        and (
          (posts.user_id <> auth.uid() and private_replies.reply_to_id is null)
          or (posts.user_id = auth.uid() and private_replies.reply_to_id is not null)
        )
    )
  );

create policy private_replies_update_post_owner
  on public.private_replies as permissive for update to authenticated
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
create policy private_replies_account_update_limit
  on public.private_replies as restrictive for update to public
  using (
    auth.uid() is not null
    and exists (
      select 1 from public.posts
      where posts.id = private_replies.post_id
        and posts.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() is not null
    and exists (
      select 1 from public.posts
      where posts.id = private_replies.post_id
        and posts.user_id = auth.uid()
    )
  );

grant select, insert, update on public.private_replies to authenticated;
revoke update on public.private_replies from authenticated;
grant update (is_read) on public.private_replies to authenticated;

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
grant select, insert, update on public.messages to authenticated;
revoke update on public.messages from authenticated;
grant update (is_read) on public.messages to authenticated;

create or replace function public.send_welcome_message_on_profile_create()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.messages (sender_id, receiver_id, content, is_read)
  values (
    null,
    new.id,
    $welcome$
欢迎来到 I人 Habitat。

这个网站的初衷，是建立一个全是I人的小社区。不同于E人们喜欢拍照与视频，这里只用文字作为记录载体。你可以把这里当成一本小日记，记录生活，或是随时迸发的小灵感。很久之后，这里也会上线找I人搭子的功能，一起做些需要陪伴的小事。

小提示：为了获得最沉浸的体验，点击浏览器底部的分享，选择"添加到主屏幕"，它就会像一个真正的App一样陪伴你。
$welcome$,
    false
  );
  return new;
end;
$$;

drop trigger if exists on_profile_created_send_welcome_message on public.profiles;
create trigger on_profile_created_send_welcome_message
  after insert on public.profiles
  for each row
  execute function public.send_welcome_message_on_profile_create();

insert into public.messages (sender_id, receiver_id, content, is_read)
select
  null,
  profile.id,
  $welcome$
欢迎来到 I人 Habitat。

这个网站的初衷，是建立一个全是I人的小社区。不同于E人们喜欢拍照与视频，这里只用文字作为记录载体。你可以把这里当成一本小日记，记录生活，或是随时迸发的小灵感。很久之后，这里也会上线找I人搭子的功能，一起做些需要陪伴的小事。

小提示：为了获得最沉浸的体验，点击浏览器底部的分享，选择"添加到主屏幕"，它就会像一个真正的App一样陪伴你。
$welcome$,
  false
from public.profiles as profile
where not exists (
  select 1 from public.messages as message
  where message.receiver_id = profile.id
    and message.sender_id is null
    and left(message.content, length('欢迎来到 I人 Habitat。')) = '欢迎来到 I人 Habitat。'
);