import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { ME_ID } from '@/data/mockData';
import { Avatar } from '@/components/Avatar';
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
  const { getUser, getDirectMessages, sendDirectMessage } = useSocial();
  const [draft, setDraft] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  const participant = getUser(participantId);
  const messages = getDirectMessages(participantId);
  const trimmedDraft = draft.trim();
  const messageGroups = messages.reduce<DirectMessage[][]>((groups, message) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup[0].senderId === message.senderId) {
      lastGroup.push(message);
    } else {
      groups.push([message]);
    }
    return groups;
  }, []);
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedDraft) return;
    sendDirectMessage(participantId, trimmedDraft);
    setDraft('');
  };

  return (
    <Modal title={participant?.name ?? '私信'} onClose={onClose} fullScreen>
      <div className="flex h-full min-h-0 flex-col bg-white">
        {participant && (
          <div className="flex items-center gap-3 border-b border-white/60 bg-white/25 px-5 py-3 backdrop-blur-xl sm:px-6">
            <Avatar
              id={participant.id}
              name={participant.name}
              avatarUrl={participant.avatarUrl}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-charcoal-900">{participant.name}</p>
              <p className="truncate text-xs text-charcoal-500">@{participant.username}</p>
            </div>
          </div>
        )}

        <div
          aria-live="polite"
          aria-label="Conversation messages"
          className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6"
        >
          {messageGroups.length > 0 ? (
            messageGroups.map((group) => {
              const isMine = group[0].senderId === ME_ID;
              return (
                <div
                  key={group[0].id}
                  role="group"
                  aria-label={isMine ? 'Your messages' : 'Incoming messages'}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[85%] flex-col sm:max-w-[75%] ${isMine ? 'items-end text-right' : 'items-start text-left'}`}>
                    {group.map((message) => {
                      const showTimestamp = timestampMessageIds.has(message.id);
                      return (
                        <div key={message.id} className={showTimestamp ? 'py-1.5' : 'py-0'}>
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

        <form
          onSubmit={handleSubmit}
          className="border-t border-white/60 bg-white/20 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl sm:p-4"
        >
          <label htmlFor="direct-message-draft" className="sr-only">
            输入私信
          </label>
          <div className="flex items-end gap-2">
            <textarea
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
              className="max-h-28 min-h-11 flex-1 resize-y rounded-xl border border-white/80 bg-white/45 px-3 py-2.5 text-sm leading-relaxed text-charcoal-900 shadow-inner shadow-white/50 backdrop-blur-xl placeholder:text-charcoal-500/70 focus:border-charcoal-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!trimmedDraft}
              aria-label="发送私信"
              className="liquid-send-button flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-charcoal-900 disabled:cursor-not-allowed disabled:saturate-50 disabled:opacity-55"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 px-1 text-right text-[11px] tabular-nums text-charcoal-500">
            {MAX_LENGTH - draft.length}
          </p>
        </form>
      </div>
    </Modal>
  );
}