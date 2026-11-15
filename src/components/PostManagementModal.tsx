import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Trash2, X } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useSocial } from '@/state/SocialContext';
import { supabase } from '@/supabase';
import type { Post, PostNote } from '@/types';

type PostPatch = Partial<Pick<Post, 'content' | 'isHidden'>>;

interface PostManagementModalProps {
  post: Post;
  notes: PostNote[];
  currentUserId: string;
  persisted: boolean;
  onClose: () => void;
  onPostUpdated?: (postId: string, patch: PostPatch) => void;
  onPostDeleted?: (postId: string) => void;
}

export function PostManagementModal({
  post,
  notes,
  currentUserId,
  persisted,
  onClose,
  onPostUpdated,
  onPostDeleted,
}: PostManagementModalProps) {
  const { updatePost, updatePostNote, deletePostNote, deletePost } = useSocial();
  const [draft, setDraft] = useState(post.content);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>(
    () => Object.fromEntries(notes.map((note) => [note.id, note.content])),
  );
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const savePatch = async (patch: PostPatch) => {
    setBusy(true);
    setErrorMessage('');
    try {
      if (persisted) {
        if (!supabase) throw new Error('Supabase is not configured.');
        const databasePatch: { content?: string; is_hidden?: boolean } = {};
        if (patch.content !== undefined) databasePatch.content = patch.content;
        if (patch.isHidden !== undefined) databasePatch.is_hidden = patch.isHidden;

        const { data, error } = await supabase
          .from('posts')
          .update(databasePatch)
          .eq('id', post.id)
          .eq('user_id', currentUserId)
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('Post could not be updated. Check your permissions.');
      }

      updatePost(post.id, patch);
      onPostUpdated?.(post.id, patch);
      return true;
    } catch (error: unknown) {
      console.error('[PostManagement] failed to update post', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update post.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    if (content !== post.content && !(await savePatch({ content }))) return;

    notes.forEach((note) => {
      const updatedContent = noteDrafts[note.id]?.trim() ?? '';
      if (!updatedContent) {
        deletePostNote(note.id);
      } else if (updatedContent !== note.content) {
        updatePostNote(note.id, updatedContent);
      }
    });
    if (content === post.content) {
      updatePost(post.id, { content });
    }
    onClose();
  };

  const handleToggleHidden = async () => {
    await savePatch({ isHidden: !post.isHidden });
  };

  const handleDelete = async () => {
    setBusy(true);
    setErrorMessage('');
    try {
      if (persisted) {
        if (!supabase) throw new Error('Supabase is not configured.');
        const { data, error } = await supabase
          .from('posts')
          .delete()
          .eq('id', post.id)
          .eq('user_id', currentUserId)
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error('Post could not be deleted. Check your permissions.');
      }

      deletePost(post.id);
      onPostDeleted?.(post.id);
      onClose();
    } catch (error: unknown) {
      console.error('[PostManagement] failed to delete post', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete post.');
      setBusy(false);
    }
  };

  return (
    <Modal title="Manage post" onClose={onClose} fullScreenMobile>
      <div className="flex flex-col gap-5">
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <label htmlFor={`edit-post-${post.id}`} className="sr-only">
            Edit post content
          </label>
          <textarea
            id={`edit-post-${post.id}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 500))}
            rows={5}
            maxLength={500}
            className="w-full resize-none rounded-xl border border-fog-300 bg-paper-100 p-4 text-[15px] leading-relaxed text-charcoal-900 focus:border-charcoal-500 focus:outline-none"
          />
          {notes.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-fog-200 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-charcoal-500">Notes</p>
              {notes.map((note, index) => (
                <div key={note.id}>
                  <label htmlFor={`manage-note-${note.id}`} className="sr-only">
                    Edit note {index + 1}
                  </label>
                  <div className="relative">
                    <textarea
                      id={`manage-note-${note.id}`}
                      value={noteDrafts[note.id] ?? ''}
                      onChange={(event) =>
                        setNoteDrafts((prev) => ({
                          ...prev,
                          [note.id]: event.target.value.slice(0, 800),
                        }))
                      }
                      rows={2}
                      className="w-full resize-none rounded-lg border border-fog-300 bg-paper-100 px-3 py-2 pr-10 text-sm leading-relaxed text-charcoal-900 focus:border-charcoal-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setNoteDrafts((prev) => ({ ...prev, [note.id]: '' }))}
                      aria-label={`Clear note ${index + 1}`}
                      title="Clear note"
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-charcoal-500 transition hover:bg-fog-200 hover:text-charcoal-900 disabled:opacity-50"
                    >
                      <X aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="liquid-publish-button rounded-full px-5 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-55"
            >
              Save changes
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-2 border-t border-fog-200 pt-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleToggleHidden()}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-charcoal-700 transition hover:bg-fog-100 disabled:opacity-50"
          >
            {post.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {post.isHidden ? 'Restore post to feeds' : 'Hide post from others'}
          </button>

          {confirmDelete ? (
            <div className="rounded-xl bg-fog-100/70 p-3">
              <p className="text-sm text-charcoal-700">Delete this post and its notes and replies?</p>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-full px-3 py-1.5 text-sm text-charcoal-600 hover:bg-fog-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDelete()}
                  className="rounded-full bg-charcoal-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-charcoal-700 disabled:opacity-50"
                >
                  Delete post
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-charcoal-600 transition hover:bg-fog-100 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete post
            </button>
          )}
        </div>

        {errorMessage && <p role="alert" className="text-sm text-charcoal-700">{errorMessage}</p>}
      </div>
    </Modal>
  );
}