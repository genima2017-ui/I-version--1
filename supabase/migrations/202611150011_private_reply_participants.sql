drop policy if exists private_replies_select_participants on public.private_replies;
drop policy if exists private_replies_account_select_limit on public.private_replies;
drop policy if exists private_replies_insert_author on public.private_replies;
drop policy if exists private_replies_account_insert_limit on public.private_replies;
drop policy if exists private_replies_update_post_owner on public.private_replies;
drop policy if exists private_replies_account_update_limit on public.private_replies;

create policy private_replies_select_participants
  on public.private_replies as permissive for select to authenticated
  using (
    author_id = auth.uid()
    or receiver_id = auth.uid()
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

create policy private_replies_insert_participant
  on public.private_replies as permissive for insert to authenticated
  with check (
    author_id = auth.uid()
    and receiver_id <> auth.uid()
    and (
      (
        reply_to_id is null
        and exists (
          select 1 from public.posts
          where posts.id = private_replies.post_id
            and posts.user_id = private_replies.receiver_id
            and posts.user_id <> auth.uid()
        )
      )
      or exists (
        select 1 from public.private_replies parent
        where parent.id = private_replies.reply_to_id
          and parent.post_id = private_replies.post_id
          and (
            (parent.author_id = auth.uid() and parent.receiver_id = private_replies.receiver_id)
            or (parent.receiver_id = auth.uid() and parent.author_id = private_replies.receiver_id)
          )
      )
    )
  );
create policy private_replies_account_insert_limit
  on public.private_replies as restrictive for insert to public
  with check (
    auth.uid() is not null
    and author_id = auth.uid()
    and receiver_id <> auth.uid()
    and (
      (
        reply_to_id is null
        and exists (
          select 1 from public.posts
          where posts.id = private_replies.post_id
            and posts.user_id = private_replies.receiver_id
            and posts.user_id <> auth.uid()
        )
      )
      or exists (
        select 1 from public.private_replies parent
        where parent.id = private_replies.reply_to_id
          and parent.post_id = private_replies.post_id
          and (
            (parent.author_id = auth.uid() and parent.receiver_id = private_replies.receiver_id)
            or (parent.receiver_id = auth.uid() and parent.author_id = private_replies.receiver_id)
          )
      )
    )
  );

create policy private_replies_update_recipient
  on public.private_replies as permissive for update to authenticated
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());
create policy private_replies_account_update_limit
  on public.private_replies as restrictive for update to public
  using (auth.uid() is not null and receiver_id = auth.uid())
  with check (auth.uid() is not null and receiver_id = auth.uid());