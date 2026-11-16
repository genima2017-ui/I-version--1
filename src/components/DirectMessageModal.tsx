import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { ME_ID } from '@/data/mockData';
import { Modal } from '@/components/Modal';
import { formatTimeAgo } from '@/lib/time';
import { useSocial } from '@/state/SocialContext';
import type { DirectMessage } from '@/types';

const MAX_LENGTH = 800;
const MESSAGE_TIME_GAP = 5 * 60 * 1000;

interface DirectMessageModalProps {
  participantId: string;
  onClose: () => void;
}

export function DirectMessageModal({ participantId, onClose }: DirectMessageModalProps) {
  const {
    currentUserId, getUser, inboxItems, getDirectMessages, loadConversation,
    markConversationRead, sendDirectMessage,
  } = useSocial();
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [loadError, setLoadError] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  const draftInputRef = useRef<HTMLTextAreaElement>(null);
  const participant = getUser(participantId);
  const messages = getDirectMessages(participantId);
  const trimmedDraft = draft.trim();
  const hasUnreadMessages = inboxItems.some(
    (item) => item.category === 'messages' && !item.isRead &&
      (item.senderId ?? 'system') === participantId,
  );
  const messageGroups = messages.reduce<DirectMessage[][]>((groups, message) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup[0].senderId === message.senderId) {
      lastGroup.push(message);
    } else {
      groups.push([message]);
    }
    return groups;
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoadingMessages(true);
    setLoadError('');
    void loadConversation(participantId)
      .catch((error: unknown) => {
        console.error('[Messages] failed to load conversation', error);
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load messages.');
      })
      .finally(() => {
        if (active) setIsLoadingMessages(false);
      });
    return () => {
      active = false;
    };
  }, [loadConversation, participantId]);
  const timestampMessageIds = new Set(
    messages
      .filter((message, index) => {
        if (index === 0) return true;
        return (
          Math.abs(Date.parse(message.createdAt) - Date.parse(messages[index - 1].createdAt)) >=
          MESSAGE_TIME_GAP
        );
      })
      .map((message) => message.id),
  );

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (hasUnreadMessages) void markConversationRead(participantId);
  }, [hasUnreadMessages, markConversationRead, participantId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedDraft || isSending) return;
    setIsSending(true);
    const sent = await sendDirectMessage(participantId, trimmedDraft);
    setIsSending(false);
    if (!sent) return;
    setDraft('');
    draftInputRef.current?.focus({ preventScroll: true });
  };

  return (
    <Modal title={participant?.name ?? '私信'} onClose={onClose} fullScreen smoothViewport>
      <div className="box-border flex h-full w-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden bg-white">
        <div
          aria-live="polite"
          aria-label="Conversation messages"
          className="box-border w-full min-h-0 min-w-0 max-w-full flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6"
        >
          {isLoadingMessages && messageGroups.length === 0 ? (
            <p className="py-10 text-center text-sm text-charcoal-500">正在加载聊天记录…</p>
          ) : loadError && messageGroups.length === 0 ? (
            <p role="alert" className="py-10 text-center text-sm text-charcoal-500">
              {loadError}
            </p>
          ) : messageGroups.length > 0 ? (
            messageGroups.map((group) => {
              const isMine = group[0].senderId === (currentUserId ?? ME_ID);
              return (
                <div
                  key={group[0].id}
                  role="group"
                  aria-label={isMine ? 'Your messages' : 'Incoming messages'}
                  className={`flex w-full min-w-0 max-w-full ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`box-border flex min-w-0 max-w-[85%] flex-col sm:max-w-[75%] ${isMine ? 'items-end text-right' : 'items-start text-left'}`}>
                    {group.map((message) => {
                      const showTimestamp = timestampMessageIds.has(message.id);
                      return (
                        <div key={message.id} className={`box-border w-full min-w-0 max-w-full ${showTimestamp ? 'py-1.5' : 'py-0'}`}>
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-charcoal-800">
                            {message.content}
                          </p>
                          {showTimestamp && (
                          <time
                            dateTime={message.createdAt}
                            className="mt-1 block text-[11px] text-charcoal-500"
                          >
                            {formatTimeAgo(message.createdAt)}
                          </time>
                          )}
                        </div>
                      );
                    })}
                    <span
                      aria-hidden="true"
                      className={`mt-1 h-3 w-5 border-fog-300/80 ${
                        isMine
                          ? 'self-start rounded-bl-xl border-b border-l'
                          : 'self-end rounded-br-xl border-b border-r'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="py-10 text-center text-sm text-charcoal-500">发送第一条消息，开始对话。</p>
          )}
          <div ref={messageEndRef} />
        </div>

        {participantId !== 'system' && <form
          onSubmit={handleSubmit}
          className="box-border flex w-full min-w-0 max-w-full shrink-0 items-center gap-2 border-t border-white/60 bg-white/80 px-4 pt-1 pb-[env(safe-area-inset-bottom)]"
        >
          <label htmlFor="direct-message-draft" className="sr-only">
            输入私信
          </label>
          <textarea
            ref={draftInputRef}
            id="direct-message-draft"
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="写一条私信…"
            rows={1}
            className="box-border h-12 w-full min-w-0 max-w-full flex-1 resize-none rounded-xl border border-white/80 bg-white/45 px-3 py-2.5 text-sm leading-relaxed text-charcoal-900 shadow-inner shadow-white/50 backdrop-blur-xl placeholder:text-charcoal-500/70 focus:border-charcoal-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!trimmedDraft || isSending}
            aria-label="发送私信"
            onMouseDown={(event) => event.preventDefault()}
            className="liquid-send-button box-border flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-charcoal-900 disabled:cursor-not-allowed disabled:saturate-50 disabled:opacity-55"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>}
      </div>
    </Modal>
  );
}