import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { ME_ID } from '@/data/mockData';
import { Avatar } from '@/components/Avatar';
import { Modal } from '@/components/Modal';
import { formatTimeAgo } from '@/lib/time';
import { useSocial } from '@/state/SocialContext';

const MAX_LENGTH = 800;

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
    <Modal title={participant?.name ?? '私信'} onClose={onClose} fullScreenMobile>
      <div className="flex h-full min-h-0 flex-col sm:-mx-6 sm:-my-6 sm:h-[min(65vh,32rem)] sm:min-h-72">
        {participant && (
          <div className="flex items-center gap-3 border-b border-fog-200 px-5 py-3 sm:px-6">
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
          {messages.length > 0 ? (
            messages.map((message) => {
              const isMine = message.senderId === ME_ID;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[75%] ${
                      isMine
                        ? 'rounded-br-md bg-charcoal-800 text-paper-50'
                        : 'rounded-bl-md bg-fog-200 text-charcoal-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {message.content}
                    </p>
                    <time
                      dateTime={message.createdAt}
                      className={`mt-1 block text-right text-[11px] ${
                        isMine ? 'text-paper-50/65' : 'text-charcoal-500'
                      }`}
                    >
                      {formatTimeAgo(message.createdAt)}
                    </time>
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
          className="border-t border-fog-200 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-4"
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
              className="max-h-28 min-h-11 flex-1 resize-y rounded-xl border border-fog-300 bg-paper-100 px-3 py-2.5 text-sm leading-relaxed text-charcoal-900 placeholder:text-charcoal-500/70 focus:border-charcoal-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!trimmedDraft}
              aria-label="发送私信"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-charcoal-800 text-paper-50 transition hover:bg-charcoal-700 disabled:cursor-not-allowed disabled:bg-fog-300 disabled:text-charcoal-500"
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