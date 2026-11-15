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

这个网站的初衷，是建立一个全是I人的小社区。不同于E人们喜欢拍照与视频，这里只用文字作为记录载体。你可以把这里当作一本小日记，记录生活，或是随时迸发的小灵感。很久之后，这里也会上线找I人搭子的功能，一起做些需要陪伴的小事。

小提示：为了获得最沉浸的体验，点击浏览器底部的分享，选择"添加到主屏幕"，它就会像一个真正的App一样陪伴你。
$welcome$,
    false
  );
  return new;
end;
$$;

create trigger on_profile_created_send_welcome_message
  after insert on public.profiles
  for each row
  execute function public.send_welcome_message_on_profile_create();
