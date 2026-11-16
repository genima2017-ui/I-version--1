create or replace function public.ensure_welcome_message_for_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_user_id is null then
    raise exception 'target user is required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(target_user_id::text, 0)
  );

  if not exists (
    select 1 from public.profiles where id = target_user_id
  ) then
    raise exception 'profile must exist before sending the welcome message';
  end if;

  if not exists (
    select 1
    from public.messages
    where receiver_id = target_user_id
      and sender_id is null
      and left(content, length('欢迎来到 I人 Habitat。')) = '欢迎来到 I人 Habitat。'
  ) then
    insert into public.messages (sender_id, receiver_id, content, is_read)
    values (
      null,
      target_user_id,
      $welcome$
欢迎来到 I人 Habitat。

这个网站的初衷，是建立一个全是I人的小社区。不同于E人们喜欢拍照与视频，这里只用文字作为记录载体。你可以把这里当成一本小日记，记录生活，或是随时迸发的小灵感。很久之后，这里也会上线找I人搭子的功能，一起做些需要陪伴的小事。

小提示：为了获得最沉浸的体验，点击浏览器底部的分享，选择"添加到主屏幕"，它就会像一个真正的App一样陪伴你。
$welcome$,
      false
    );
  end if;
end;
$$;

revoke all on function public.ensure_welcome_message_for_user(uuid) from public, anon, authenticated;

create or replace function public.ensure_welcome_message()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'authentication is required';
  end if;

  perform public.ensure_welcome_message_for_user(current_user_id);
end;
$$;

revoke all on function public.ensure_welcome_message() from public, anon;
grant execute on function public.ensure_welcome_message() to authenticated;

create or replace function public.send_welcome_message_on_profile_create()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.ensure_welcome_message_for_user(new.id);
  return new;
end;
$$;

drop trigger if exists on_profile_created_send_welcome_message on public.profiles;
create trigger on_profile_created_send_welcome_message
  after insert on public.profiles
  for each row
  execute function public.send_welcome_message_on_profile_create();

select public.ensure_welcome_message_for_user(profile.id)
from public.profiles as profile;