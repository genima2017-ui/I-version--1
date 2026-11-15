import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LoaderCircle, Reply as ReplyIcon } from 'lucide-react';
import { useSocial } from '@/state/SocialContext';
import { formatTimeAgo } from '@/lib/time';
import type { PrivateReply } from '@/types';

interface PrivateRepliesListProps {
  postId: string;
  receiverId: string;
  replies: PrivateReply[];
  highlightReplyId?: string;
}

const newestFirst = (left: PrivateReply, right: PrivateReply) =>
  Date.parse(right.createdAt) - Date.parse(left.createdAt);

export function PrivateRepliesList({
  postId,
  receiverId,
  replies,
  highlightReplyId,
}: PrivateRepliesListProps) {
  const { getUser, addPrivateReply } = useSocial();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const sendTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (sendTimer.current !== null) window.clearTimeout(sendTimer.current);
    },
    [],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>, replyId: string) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setSendError('');
    sendTimer.current = window.setTimeout(() => {
      void addPrivateReply(postId, receiverId, content, replyId).then((sent) => {
        if (sent) {
          setDraft('');
          setReplyingTo(null);
        } else {
          setSendError('Unable to send this reply. Please try again or contact the administrator.');
        }
        setIsSending(false);
        sendTimer.current = null;
      });
    }, 450);
  };

  if (replies.length === 0) {
    return (
      <p className="rounded-xl bg-paper-200 px-4 py-3 text-sm text-charcoal-500">
        No replies yet.
      </p>
    );
  }

  const rootReplies = replies.filter((reply) => !reply.replyToId);
  const latestActivityByReply = new Map(
    rootReplies.map((reply) => [reply.id, Date.parse(reply.createdAt)]),
  );

  replies.forEach((reply) => {
    if (!reply.replyToId) return;
    const replyTime = Date.parse(reply.createdAt);
    const latestActivity = latestActivityByReply.get(reply.replyToId);
    if (latestActivity !== undefined && replyTime > latestActivity) {
      latestActivityByReply.set(reply.replyToId, replyTime);
    }
  });

  rootReplies.sort(
    (left, right) =>
      (latestActivityByReply.get(right.id) ?? Date.parse(right.createdAt)) -
      (latestActivityByReply.get(left.id) ?? Date.parse(left.createdAt)),
  );

  return (
    <div className="flex flex-col gap-3">
      {rootReplies.length === 0 && (
        <p className="rounded-xl bg-paper-200 px-4 py-3 text-sm text-charcoal-500">
          No replies yet.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {rootReplies.map((reply) => {
          const childReplies = replies
            .filter((item) => item.replyToId === reply.id)
            .sort(newestFirst);
          const replying = replyingTo === reply.id;

          return (
            <li
              key={reply.id}
              id={`private-reply-${reply.id}`}
              className="rounded-xl border border-fog-200 bg-paper-50 px-4 py-3"
            >
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-charcoal-800">
                  {getUser(reply.authorId)?.name ?? 'Someone'}
                </span>
                <span className="shrink-0 text-xs text-charcoal-500">{formatTimeAgo(reply.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-charcoal-700">
                {reply.content}
              </p>

              {childReplies.length > 0 && (
                <ul className="mt-3 flex flex-col gap-3 border-l border-fog-300 pl-3">
                  {childReplies.map((child) => (
                    <li key={child.id} id={`private-reply-${child.id}`}>
                      <div className="mb-1 flex items-baseline justify-between gap-3">
                        <span className="text-xs font-medium text-charcoal-700">
                          {getUser(child.authorId)?.name ?? 'You'}
                        </span>
                        <span className="shrink-0 text-xs text-charcoal-500">
                          {formatTimeAgo(child.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-charcoal-700">
                        {child.content}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {replying ? (
                <form onSubmit={(event) => handleSubmit(event, reply.id)} className="mt-3">
                  <label htmlFor={`reply-${reply.id}`} className="sr-only">
                    Reply to {getUser(reply.authorId)?.name ?? 'comment'}
                  </label>
                  <textarea
                    id={`reply-${reply.id}`}
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value.slice(0, 800));
                      setSendError('');
                    }}
                    rows={2}
                    autoFocus
                    disabled={isSending}
                    className="w-full resize-none rounded-lg border border-fog-300 bg-paper-100 px-3 py-2 text-sm text-charcoal-900 focus:border-charcoal-500 focus:outline-none"
                  />
                  {sendError && (
                    <p role="alert" className="mt-2 text-xs text-red-700">
                      {sendError}
                    </p>
                  )}
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={isSending}
                      onClick={() => {
                        setReplyingTo(null);
                        setDraft('');
                      }}
                      className="rounded-full px-3 py-1.5 text-xs font-medium text-charcoal-600 transition hover:text-charcoal-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!draft.trim() || isSending}
                      className="inline-flex min-w-20 items-center justify-center gap-1.5 rounded-full bg-charcoal-900 px-4 py-1.5 text-xs font-medium text-paper-50 transition hover:bg-charcoal-700 disabled:cursor-not-allowed disabled:bg-fog-300 disabled:text-charcoal-500"
                    >
                      {isSending ? (
                        <>
                          <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                          <span role="status">Sending...</span>
                        </>
                      ) : (
                        'Send'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    id={`reply-action-${reply.id}`}
                    onClick={() => {
                      setReplyingTo(reply.id);
                      setDraft('');
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full border border-fog-300 bg-paper-50 px-3 py-1.5 text-sm font-medium text-charcoal-800 shadow-sm transition hover:border-charcoal-500 hover:bg-paper-100 hover:text-charcoal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal-500 ${
                      highlightReplyId === reply.id ? 'reply-target-flash' : ''
                    }`}
                  >
                    <ReplyIcon aria-hidden="true" className="h-4 w-4" />
                    Reply
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
