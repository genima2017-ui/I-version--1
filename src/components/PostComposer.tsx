import { useState, type FormEvent } from 'react';
import { ME_ID } from '@/data/mockData';
import { useSocial } from '@/state/SocialContext';
import { Avatar } from '@/components/Avatar';

const MAX_LENGTH = 500;

export function PostComposer() {
  const { getUser, createPost } = useSocial();
  const [draft, setDraft] = useState('');
  const me = getUser(ME_ID);
  const trimmed = draft.trim();
  const remaining = MAX_LENGTH - draft.length;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed) return;
    createPost(trimmed);
    setDraft('');
  };

  if (!me) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="liquid-surface rounded-3xl border border-white/80 p-5 transition focus-within:border-fog-400"
    >
      <div className="flex gap-4">
        <Avatar id={me.id} name={me.name} avatarUrl={me.avatarUrl} />
        <div className="flex min-w-0 flex-1 flex-col">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, MAX_LENGTH))}
            placeholder="What is on your mind, quietly?"
            rows={3}
            aria-label="Write a post"
            className="w-full resize-none bg-transparent pt-2 text-[15px] leading-relaxed text-charcoal-900 placeholder:text-charcoal-500/70 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between border-t border-fog-200 pt-3">
            <span
              className={`text-xs tabular-nums transition-colors ${
                remaining < 40 ? 'text-charcoal-700' : 'text-charcoal-500'
              }`}
            >
              {draft.length > 0 ? `${remaining} left` : 'Text only'}
            </span>
            <button
              type="submit"
              disabled={!trimmed}
              className="liquid-publish-button rounded-full px-5 py-2 text-sm font-medium disabled:cursor-not-allowed"
            >
              Publish
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
