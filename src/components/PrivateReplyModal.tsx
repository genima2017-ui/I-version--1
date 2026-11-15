import { useState, type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { useSocial } from '@/state/SocialContext';
import { Modal } from '@/components/Modal';
import { Avatar } from '@/components/Avatar';

const MAX_LENGTH = 800;

interface PrivateReplyModalProps {
  postId: string;
  authorId: string;
  onClose: () => void;
}

export function PrivateReplyModal({ postId, authorId, onClose }: PrivateReplyModalProps) {
  const { getUser, addPrivateReply } = useSocial();
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const author = getUser(authorId);
  const trimmed = draft.trim();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed || isSending) return;
    setIsSending(true);
    setSendError('');
    const sent = await addPrivateReply(postId, authorId, trimmed);
    setIsSending(false);
    if (sent) {
      onClose();
    } else {
      setSendError('Unable to send this private reply. Please try again or contact the administrator.');
    }
  };

  return (
    <Modal title="Private reply" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            {author && <Avatar id={author.id} name={author.name} avatarUrl={author.avatarUrl} size="sm" />}
            <div className="min-w-0">
              <p className="text-sm font-medium text-charcoal-900">{author?.name}</p>
              <p className="flex items-center gap-1.5 text-xs text-charcoal-500">
                <Lock className="h-3 w-3" />
                Visible only to {author?.name ?? 'the author'}
              </p>
            </div>
          </div>
          <div className="relative">
            <textarea
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value.slice(0, MAX_LENGTH));
                setSendError('');
              }}
              rows={5}
              aria-label="Private reply"
              autoFocus
              className="w-full resize-none rounded-xl border border-fog-300 bg-paper-100 p-4 text-[15px] leading-relaxed text-charcoal-900 transition focus:border-charcoal-500 focus:outline-none"
            />
            {!draft && (
              <svg
                viewBox="0 0 32 32"
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-4 h-6 w-6 text-charcoal-500/60"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.4"
              >
                <path d="M25.6 4.4c-6 .3-11.4 4.1-13.7 9.4-1.3 3-1.3 5.9-.2 8.2 2.3 1.1 5.2 1.1 8.2-.2 5.3-2.3 9.1-7.7 9.4-13.7l-3.7-3.7Z" />
                <path d="M6.4 27.6c4.4-7.4 10.4-13.4 17.8-17.8" />
                <path d="m12.2 21.3 5.7.2m-2.1-5.3 5.4.2m-2-5 4.5.2m-11.5 6.5-.3-4.6m4.7 1.3-.1-4.3m4.8 1.2.2-3.4" />
              </svg>
            )}
          </div>
          {sendError && (
            <p role="alert" className="text-sm text-red-700">
              {sendError}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs tabular-nums text-charcoal-500">
              {MAX_LENGTH - draft.length} left
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2 text-sm font-medium text-charcoal-600 transition hover:text-charcoal-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!trimmed || isSending}
                className="rounded-full bg-charcoal-900 px-5 py-2 text-sm font-medium text-paper-50 transition hover:bg-charcoal-700 disabled:cursor-not-allowed disabled:bg-fog-300 disabled:text-charcoal-500"
              >
                Send
              </button>
            </div>
          </div>
      </form>
    </Modal>
  );
}
