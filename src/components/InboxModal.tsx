import { useEffect, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { Modal } from '@/components/Modal';
import { formatTimeAgo } from '@/lib/time';
import { useSocial } from '@/state/SocialContext';
import { supabase } from '@/supabase';
import type { InboxCategory, InboxItem, User } from '@/types';

interface InboxModalProps {
  onClose: () => void;
  onOpenConversation: (participantId: string) => void;
  onOpenPost: (postId: string, replyId?: string) => void;
}

const TABS: { category: InboxCategory; label: string }[] = [
  { category: 'comments', label: '评论' },
  { category: 'messages', label: '私信' },
];

export function InboxModal({ onClose, onOpenConversation, onOpenPost }: InboxModalProps) {
  const {
    inboxItems,
    directMessages,
    getUser,
    cacheUsers,
    markInboxCommentsRead,
  } = useSocial();
  useEffect(() => {
    if (!supabase) return;
    const missingIds = [...new Set(directMessages.map((message) => message.participantId))]
      .filter((id) => id !== 'system' && !getUser(id));
    if (missingIds.length === 0) return;
    let active = true;
    void supabase.from('profiles')
      .select('id, username, full_name, bio, avatar_url')
      .in('id', missingIds)
      .then(({ data, error }) => {
        if (error) {
          console.error('[Inbox] failed to load conversation profiles', error);
          return;
        }
        if (!active || !data?.length) return;
        cacheUsers(data.map((profile) => ({
          id: profile.id,
          name: profile.full_name || profile.username || 'Member',
          username: profile.username || 'member',
          bio: profile.bio ?? '',
          avatarUrl: profile.avatar_url ?? undefined,
        })));
      });
    return () => { active = false; };
  }, [cacheUsers, directMessages, getUser]);
  const [activeCategory, setActiveCategory] = useState<InboxCategory>(() => {
    const newestUnread = inboxItems.reduce<InboxItem | null>((latest, item) => {
      if (item.isRead) return latest;
      if (!latest || Date.parse(item.createdAt) > Date.parse(latest.createdAt)) return item;
      return latest;
    }, null);
    return newestUnread?.category ?? 'comments';
  });
  const categoryItems = inboxItems.filter((item) => item.category === activeCategory);
  const visibleItems =
    activeCategory === 'messages'
      ? [...
          directMessages.reduce((latestBySender, message) => {
            const latest = latestBySender.get(message.participantId);
            if (!latest || Date.parse(message.createdAt) > Date.parse(latest.createdAt)) {
              latestBySender.set(message.participantId, {
                id: `message-${message.id}`,
                category: 'messages',
                content: message.content,
                senderId: message.participantId === 'system' ? undefined : message.participantId,
                createdAt: message.createdAt,
                isRead: true,
              });
            }
            return latestBySender;
          }, new Map<string, InboxItem>()).values(),
        ].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      : categoryItems;

  const handleClose = () => {
    if (activeCategory === 'comments') markInboxCommentsRead();
    onClose();
  };

  const handleTabClick = (category: InboxCategory) => {
    if (activeCategory === 'comments') markInboxCommentsRead();
    setActiveCategory(category);
  };

  const handleOpenConversation = (participantId: string) => {
    onOpenConversation(participantId);
  };

  const handleOpenPost = (postId: string, replyId?: string) => {
    if (import.meta.env.DEV) {
      console.log('[Inbox] comment clicked', { postId, replyId });
    }
    markInboxCommentsRead();
    onOpenPost(postId, replyId);
  };

  return (
    <Modal title="信箱" onClose={handleClose} fullScreen>
      <div className="flex h-full min-h-0 flex-col bg-white px-5 py-5 sm:px-8 sm:py-7">
        <div
        role="tablist"
        aria-label="Inbox categories"
        className="mb-5 grid grid-cols-2 border-b border-fog-200"
        >
        {TABS.map(({ category, label }) => (
          <button
            key={category}
            type="button"
            role="tab"
            id={`inbox-tab-${category}`}
            aria-selected={activeCategory === category}
            aria-controls="inbox-panel"
            onClick={() => handleTabClick(category)}
            className={`min-h-11 border-b-2 px-2 text-sm font-medium transition ${
              activeCategory === category
                ? 'border-charcoal-800 text-charcoal-900'
                : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

        <div
          id="inbox-panel"
          role="tabpanel"
          aria-labelledby={`inbox-tab-${activeCategory}`}
          className="min-h-0 flex-1 overflow-y-auto"
        >
        {visibleItems.length > 0 ? (
          <ul className="divide-y divide-fog-200">
            {visibleItems.map((item) => {
              const sender = item.senderId ? getUser(item.senderId) : undefined;
              const isMessage = item.category === 'messages';
              const isComment = item.category === 'comments' && Boolean(item.postId);
              const isActionable = isMessage || isComment;

              return (
                <li key={item.id} className="py-4 first:pt-1 last:pb-1">
                  {isActionable ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (isMessage) {
                          handleOpenConversation(item.senderId ?? 'system');
                        } else if (item.postId) {
                          handleOpenPost(item.postId, item.replyId);
                        }
                      }}
                      aria-label={
                        isMessage
                          ? `Open conversation with ${sender?.name ?? 'sender'}`
                          : 'Open post from comment'
                      }
                      className="flex w-full gap-3 rounded-xl text-left transition hover:bg-paper-200/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal-500"
                    >
                      <InboxItemContent item={item} sender={sender} />
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <InboxItemContent item={item} sender={sender} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-12 text-center text-sm text-charcoal-500">这里暂时安静。</p>
        )}
        </div>
      </div>
    </Modal>
  );
}

function InboxItemContent({
  item,
  sender,
}: {
  item: InboxItem;
  sender: User | undefined;
}) {
  return (
    <>
      {sender ? (
        <Avatar id={sender.id} name={sender.name} avatarUrl={sender.avatarUrl} size="sm" />
      ) : (
        <div className="h-9 w-9 shrink-0 rounded-full bg-fog-200" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1 py-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-medium text-charcoal-800">{sender?.name ?? '新消息'}</p>
          <time dateTime={item.createdAt} className="text-xs tabular-nums text-charcoal-500">
            {formatTimeAgo(item.createdAt)}
          </time>
        </div>
        {item.context && item.category !== 'comments' && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-charcoal-500">
            {item.context}
          </p>
        )}
        <p className="mt-1 break-words text-sm leading-relaxed text-charcoal-700">{item.content}</p>
      </div>
    </>
  );
}