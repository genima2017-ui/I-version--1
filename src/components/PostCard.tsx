import { useEffect, useState, type FormEvent } from 'react';
import { ChevronDown, ChevronUp, Heart, Lock, Pencil, Plus, Send } from 'lucide-react';
import { ME_ID } from '@/data/mockData';
import { useSocial } from '@/state/SocialContext';
import { formatTimeAgo } from '@/lib/time';
import { Avatar } from '@/components/Avatar';
import { PrivateReplyModal } from '@/components/PrivateReplyModal';
import { PostManagementModal } from '@/components/PostManagementModal';
import { PrivateRepliesList } from '@/components/PrivateRepliesList';
import type { Post } from '@/types';

interface PostCardProps {
  post: Post;
  onOpenProfile: (userId: string) => void;
  highlightReplyId?: string;
  currentUserId?: string;
  isPersisted?: boolean;
  onPostUpdated?: (postId: string, patch: Partial<Pick<Post, 'content' | 'isHidden'>>) => void;
  onPostDeleted?: (postId: string) => void;
}

export function PostCard({
  post,
  onOpenProfile,
  highlightReplyId,
  currentUserId,
  isPersisted = false,
  onPostUpdated,
  onPostDeleted,
}: PostCardProps) {
  const {
    getUser,
    isLiked,
    likeCount,
    toggleLike,
    getPrivateReplies,
    getPostNotes,
    addPostNote,
  } = useSocial();
  const [replyOpen, setReplyOpen] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [noteComposerOpen, setNoteComposerOpen] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [postManagerOpen, setPostManagerOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [likePulse, setLikePulse] = useState(0);

  useEffect(() => {
    if (highlightReplyId) setRepliesOpen(true);
  }, [highlightReplyId]);

  const isOwn = post.authorId === (currentUserId ?? ME_ID);
  const author = getUser(isOwn ? ME_ID : post.authorId) ?? post.author;
  const postAuthor = author ?? {
    id: post.authorId,
    name: '匿名用户',
    username: 'anonymous',
    bio: '',
  };

  const liked = isLiked(post.id);
  const privateReplies = getPrivateReplies(post.id);
  const hasPrivateConversation = privateReplies.some(
    (reply) => reply.authorId === currentUserId || reply.receiverId === currentUserId,
  );
  const postNotes = isOwn ? getPostNotes(post.id) : [];

  const [likePending, setLikePending] = useState(false);

  const handleLike = async () => {
    if (likePending) return;
    setLikePending(true);
    const changed = await toggleLike(post.id);
    setLikePending(false);
    if (!changed) return;
    setLikePulse((count) => count + 1);
  };

  const handleAddNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = noteDraft.trim();
    if (!content) return;
    addPostNote(post.id, content);
    setNoteDraft('');
    setNoteComposerOpen(false);
    setNotesExpanded(false);
  };

  return (
    <article id={`post-${post.id}`} className="liquid-card my-4 rounded-3xl px-5 py-7 first:mt-0">
      <div className="min-w-0">
          <header className="flex min-w-0 items-center gap-x-2">
            <button
              type="button"
              onClick={() => onOpenProfile(postAuthor.id)}
              className="shrink-0 rounded-full transition hover:opacity-80"
              aria-label={`View ${postAuthor.name}'s profile`}
            >
              <Avatar id={postAuthor.id} name={postAuthor.name} avatarUrl={postAuthor.avatarUrl} />
            </button>
            <button
              type="button"
              onClick={() => onOpenProfile(postAuthor.id)}
              className="max-w-[42%] shrink-0 truncate text-[15px] font-medium text-charcoal-900 hover:underline"
            >
              {postAuthor.name}
            </button>
            <span className="min-w-0 truncate text-sm text-charcoal-500">@{postAuthor.username}</span>
            <span aria-hidden="true" className="shrink-0 text-charcoal-500">
              ·
            </span>
            <time dateTime={post.createdAt} className="shrink-0 whitespace-nowrap text-sm text-charcoal-500">
              {formatTimeAgo(post.createdAt)}
            </time>
          </header>

          <div className="mt-2 flex items-start gap-2">
            <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-[15px] leading-[1.65] text-charcoal-800">
              {post.content}
            </p>
          </div>

          {isOwn && postNotes.length > 0 && notesExpanded && (
            <div
              id={`post-notes-${post.id}`}
              className="mt-4 flex flex-col gap-4 border-l-2 border-gray-200 pl-4"
            >
              {postNotes.map((note) => (
                <div key={note.id}>
                  <time dateTime={note.createdAt} className="mb-1 block text-xs text-gray-400">
                    {formatTimeAgo(note.createdAt)}
                  </time>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-charcoal-700">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {isOwn && noteComposerOpen && (
            <form onSubmit={handleAddNote} className="mt-4 border-l-2 border-gray-200 pl-4">
              <label htmlFor={`post-note-${post.id}`} className="sr-only">
                Add a note to your post
              </label>
              <textarea
                id={`post-note-${post.id}`}
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value.slice(0, 800))}
                rows={3}
                autoFocus
                className="w-full resize-none border-b border-gray-200 bg-transparent px-1 py-2 text-sm leading-relaxed text-charcoal-900 focus:border-gray-400 focus:outline-none"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNoteComposerOpen(false);
                    setNoteDraft('');
                  }}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-charcoal-600 transition hover:text-charcoal-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!noteDraft.trim()}
                  className="rounded-full bg-charcoal-900 px-4 py-1.5 text-xs font-medium text-paper-50 transition hover:bg-charcoal-700 disabled:cursor-not-allowed disabled:bg-fog-300 disabled:text-charcoal-500"
                >
                  Add note
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => void handleLike()}
              disabled={likePending}
              aria-pressed={liked}
              aria-label={liked ? 'Unlike post' : 'Like post'}
              className={`flex items-center gap-2 rounded-full px-2.5 py-1.5 text-sm transition duration-200 hover:bg-fog-200/70 ${
                liked ? 'text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-900'
              }`}
            >
              <Heart
                key={likePulse}
                className={`h-4 w-4 transition-colors duration-200 ${
                  liked ? 'animate-pop fill-charcoal-900 text-charcoal-900' : ''
                }`}
              />
              <span>{likeCount(post.id)}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isOwn || hasPrivateConversation) {
                  setRepliesOpen((open) => !open);
                } else {
                  setReplyOpen(true);
                }
              }}
              aria-expanded={isOwn || hasPrivateConversation ? repliesOpen : undefined}
              aria-label={
                isOwn || hasPrivateConversation
                  ? `Private replies${privateReplies.length > 0 ? ` ${privateReplies.length}` : ''}`
                  : 'Private reply'
              }
              title={isOwn || hasPrivateConversation ? 'Private replies' : 'Private reply'}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-charcoal-500 transition hover:bg-fog-200/70 hover:text-charcoal-900"
            >
              <Send className="h-4 w-4" />
              {(isOwn || hasPrivateConversation) && privateReplies.length > 0 && (
                <span className="text-xs tabular-nums">{privateReplies.length}</span>
              )}
            </button>

            {isOwn && (
              <button
                type="button"
                onClick={() => setNoteComposerOpen((open) => !open)}
                aria-expanded={noteComposerOpen}
                aria-label="Add a note"
                title="Add a note"
                className="rounded-full px-2.5 py-1.5 text-gray-400 transition hover:bg-fog-200/70 hover:text-gray-600"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
              </button>
            )}

            {isOwn && postNotes.length > 0 && (
              <button
                type="button"
                onClick={() => setNotesExpanded((expanded) => !expanded)}
                aria-expanded={notesExpanded}
                aria-controls={`post-notes-${post.id}`}
                aria-label={notesExpanded ? 'Collapse notes' : 'Expand notes'}
                title={notesExpanded ? 'Collapse notes' : 'Expand notes'}
                className="rounded-full px-2.5 py-1.5 text-gray-400 transition hover:bg-fog-200/70 hover:text-gray-600"
              >
                {notesExpanded ? (
                  <ChevronUp aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <ChevronDown aria-hidden="true" className="h-4 w-4" />
                )}
              </button>
            )}

              {isOwn && (
                <button
                  type="button"
                  onClick={() => setPostManagerOpen(true)}
                  aria-label="Edit, hide or delete post"
                  title="Edit post"
                  className="rounded-full px-2.5 py-1.5 text-charcoal-500 transition hover:bg-fog-200/70 hover:text-charcoal-900"
                >
                  <Pencil aria-hidden="true" className="h-4 w-4" />
                </button>
              )}

              {isOwn && post.isHidden && (
                <span
                  aria-label="Hidden from others"
                  title="Hidden from others"
                  className="flex h-8 w-8 items-center justify-center text-charcoal-600"
                >
                  <Lock aria-hidden="true" className="h-4 w-4" />
                </span>
              )}

          </div>

          {(isOwn || hasPrivateConversation) && repliesOpen && (
            <div className="mt-5 animate-fade-in rounded-2xl bg-paper-200/70 p-4">
              <PrivateRepliesList
                postId={post.id}
                replies={privateReplies}
                highlightReplyId={highlightReplyId}
                onOpenProfile={onOpenProfile}
              />
            </div>
          )}
      </div>

      {replyOpen && (
        <PrivateReplyModal
          postId={post.id}
          authorId={post.authorId}
          onClose={() => setReplyOpen(false)}
        />
      )}
      {postManagerOpen && (
        <PostManagementModal
          post={post}
          notes={postNotes}
          currentUserId={currentUserId ?? ME_ID}
          persisted={isPersisted}
          onClose={() => setPostManagerOpen(false)}
          onPostUpdated={onPostUpdated}
          onPostDeleted={onPostDeleted}
        />
      )}
    </article>
  );
}
