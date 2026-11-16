import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSocial } from '@/state/SocialContext';
import { supabase } from '@/supabase';
import { PostCard } from '@/components/PostCard';
import { PostComposer } from '@/components/PostComposer';
import type { FeedTab, Post } from '@/types';

const TABS: { id: FeedTab; label: string }[] = [
  { id: 'following', label: 'Following' },
  { id: 'discover', label: 'Discover' },
];

interface CommunityPageProps {
  onOpenProfile: (userId: string) => void;
  currentUserId: string;
  targetPost: { postId: string; replyId?: string } | null;
}

interface PostRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count?: number | null;
  is_hidden?: boolean | null;
  profiles:
    | { username: string | null; full_name: string | null; bio: string | null; avatar_url: string | null }
    | { username: string | null; full_name: string | null; bio: string | null; avatar_url: string | null }[]
    | null;
}

export function CommunityPage({ onOpenProfile, currentUserId, targetPost }: CommunityPageProps) {
  const { isFollowing, cacheUsers, loadPostLikes } = useSocial();
  const [tab, setTab] = useState<FeedTab>('following');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadPosts = useCallback(async () => {
    if (!supabase) {
      setLoadError('Supabase is not configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(username, full_name, bio, avatar_url)')
        .order('created_at', { ascending: false });
      console.log('拉到的动态:', data);
      if (error) console.error(error);
      if (error) throw error;

      const rows = (data ?? []) as unknown as PostRow[];
      const loadedPosts: Post[] = rows.map((row) => {
        const authorId = String(row.user_id);
        const joinedProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const author = joinedProfile
          ? {
              id: authorId,
              name: joinedProfile.full_name || joinedProfile.username || 'Member',
              username: joinedProfile.username || 'member',
              bio: joinedProfile.bio || '',
              avatarUrl: joinedProfile.avatar_url ?? undefined,
            }
          : {
              id: authorId,
              name: '匿名用户',
              username: `user_${authorId.slice(0, 8)}`,
              bio: '',
            };

        return {
          id: String(row.id),
          authorId,
          content: row.content,
          createdAt: row.created_at,
          likesCount: row.likes_count ?? 0,
          isHidden: row.is_hidden ?? false,
          author,
        };
      });

      cacheUsers(loadedPosts.flatMap((post) => (post.author ? [post.author] : [])));
      await loadPostLikes(loadedPosts);
      setPosts(loadedPosts);
      setLoadError('');
    } catch (error: unknown) {
      console.error(error);
      console.error('[Community] failed to load posts', error);
      setLoadError(error instanceof Error ? error.message : 'Unable to load posts.');
    } finally {
      setLoading(false);
    }
  }, [cacheUsers, loadPostLikes]);

  useEffect(() => {
    console.log('正在请求 Supabase...');
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (targetPost) setTab('discover');
  }, [targetPost]);

  const visiblePosts = useMemo(() => {
    const availablePosts = posts.filter((post) => !post.isHidden || post.authorId === currentUserId);
    if (tab === 'discover') return availablePosts;
    return availablePosts.filter(
      (post) => post.authorId === currentUserId || isFollowing(post.authorId),
    );
  }, [currentUserId, isFollowing, posts, tab]);

  return (
    <section className="flex flex-col gap-10">
      <PostComposer onPublished={() => void loadPosts()} />

      <div className="flex flex-col gap-6">
        <div role="tablist" aria-label="Feed" className="flex gap-8 border-b border-fog-200">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={`relative pb-3 text-sm font-medium transition-colors ${
                  active ? 'text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-800'
                }`}
              >
                {item.label}
                <span
                  className={`absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-charcoal-900 transition-transform duration-300 ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-charcoal-500">Loading posts…</p>
        ) : loadError ? (
          <p role="alert" className="py-10 text-center text-sm text-charcoal-500">
            {loadError}
          </p>
        ) : visiblePosts.length > 0 ? (
          <div key={tab} className="glacier-flow-list">
            {visiblePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onOpenProfile={onOpenProfile}
                currentUserId={currentUserId}
                highlightReplyId={targetPost?.postId === post.id ? targetPost.replyId : undefined}
                isPersisted
                onPostUpdated={(postId, patch) =>
                  setPosts((prev) =>
                    prev.map((item) => (item.id === postId ? { ...item, ...patch } : item)),
                  )
                }
                onPostDeleted={(postId) =>
                  setPosts((prev) => prev.filter((item) => item.id !== postId))
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-fog-300 px-6 py-14 text-center">
            <p className="font-serif text-xl text-charcoal-800">Nothing here yet.</p>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-500">
              Follow people whose words feel like yours, and their posts will gather here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}