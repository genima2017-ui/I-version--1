import { useEffect, useState } from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import { ME_ID } from '@/data/mockData';
import { useSocial } from '@/state/SocialContext';
import { supabase } from '@/supabase';
import { Avatar } from '@/components/Avatar';
import { EditProfileModal } from '@/components/EditProfileModal';
import { InboxModal } from '@/components/InboxModal';
import { DirectMessageModal } from '@/components/DirectMessageModal';
import { FollowButton } from '@/components/FollowButton';
import { Modal } from '@/components/Modal';
import { PostCard } from '@/components/PostCard';
import type { Post, User } from '@/types';

interface ProfilePageProps {
  userId: string;
  currentUserId: string;
  onOpenProfile: (userId: string) => void;
  onOpenPost: (postId: string, replyId?: string) => void;
  targetPost: { postId: string; replyId?: string } | null;
}

interface ProfilePostRow {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes_count: number | null;
  is_hidden: boolean | null;
  profiles:
    | { username: string | null; full_name: string | null; bio: string | null; avatar_url: string | null }
    | { username: string | null; full_name: string | null; bio: string | null; avatar_url: string | null }[]
    | null;
}

export function ProfilePage({
  userId,
  currentUserId,
  onOpenProfile,
  onOpenPost,
  targetPost,
}: ProfilePageProps) {
  const {
    getUser,
    posts,
    cacheUsers,
    followingCount,
    followerCount,
    getFollowing,
    getFollowers,
    hasUnreadInboxItems,
    loadPostLikes,
  } = useSocial();
  const [editing, setEditing] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [chatParticipantId, setChatParticipantId] = useState<string | null>(null);
  const [followList, setFollowList] = useState<'following' | 'followers' | null>(null);
  const [remotePosts, setRemotePosts] = useState<Post[] | null>(null);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const isOwn = userId === ME_ID || userId === currentUserId;
  const profileUserId = isOwn ? currentUserId : userId;
  const socialUserId = isOwn ? currentUserId : userId;
  const user = getUser(userId) ?? (isOwn ? getUser(ME_ID) : undefined);

  useEffect(() => {
    if (!profileSaved) return;
    const timeout = window.setTimeout(() => setProfileSaved(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [profileSaved]);

  useEffect(() => {
    if (!supabase) {
      setRemotePosts(null);
      setPostsLoading(false);
      return;
    }

    const client = supabase;
    let active = true;
    setPostsLoading(true);

    const loadProfilePosts = async () => {
      try {
        const query = client
          .from('posts')
          .select('*, profiles(username, full_name, bio, avatar_url)')
          .eq('user_id', profileUserId);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        const rows = (data ?? []) as unknown as ProfilePostRow[];
        const profilePosts = rows.map((row) => {
          const joinedProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          const authorId = String(row.user_id);
          const author: User | undefined = joinedProfile
            ? {
                id: authorId,
                name: joinedProfile.full_name || joinedProfile.username || 'Member',
                username: joinedProfile.username || 'member',
                bio: joinedProfile.bio || '',
                avatarUrl: joinedProfile.avatar_url ?? undefined,
              }
            : undefined;

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

        await loadPostLikes(profilePosts);
        if (active) {
          cacheUsers(profilePosts.flatMap((post) => (post.author ? [post.author] : [])));
          setRemotePosts(profilePosts);
          setPostsError('');
        }
      } catch (error: unknown) {
        console.error('[Profile] failed to load posts', error);
        if (active) {
          setRemotePosts([]);
          setPostsError(error instanceof Error ? error.message : 'Unable to load posts.');
        }
      } finally {
        if (active) setPostsLoading(false);
      }
    };

    void loadProfilePosts();
    return () => {
      active = false;
    };
  }, [cacheUsers, isOwn, loadPostLikes, profileUserId]);

  if (!user) {
    return (
      <section className="rounded-2xl border border-dashed border-fog-300 px-6 py-14 text-center">
        <p className="font-serif text-xl text-charcoal-800">This profile could not be found.</p>
      </section>
    );
  }

  const userPosts = remotePosts
    ? remotePosts.filter((post) => !post.isHidden || isOwn)
    : posts.filter((post) => post.authorId === socialUserId && (!post.isHidden || isOwn));
  const followUsers =
    followList === 'following'
      ? getFollowing(socialUserId)
      : followList === 'followers'
        ? getFollowers(socialUserId)
        : [];

  return (
    <section className="flex flex-col gap-12">
      {profileSaved && (
        <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          Profile saved.
        </p>
      )}
      <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:gap-8 sm:text-left">
        <Avatar id={user.id} name={user.name} avatarUrl={user.avatarUrl} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col items-center gap-4 sm:items-start">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <div className="flex items-center justify-center gap-3 sm:justify-start">
              <h1 className="font-serif text-3xl leading-tight text-charcoal-900 sm:text-4xl">
                {user.name}
              </h1>
              {isOwn && (
                <button
                  type="button"
                  onClick={() => setInboxOpen(true)}
                  aria-label="Open inbox"
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-charcoal-600 transition hover:bg-fog-200 hover:text-charcoal-900"
                >
                  <Mail className="h-5 w-5" aria-hidden="true" />
                  {hasUnreadInboxItems && (
                    <span
                      aria-label="Unread messages"
                      className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-red-500 ring-2 ring-paper-50"
                    />
                  )}
                </button>
              )}
              {!isOwn && (
                <button
                  type="button"
                  onClick={() => setChatParticipantId(user.id)}
                  aria-label={`Message ${user.name}`}
                  title="Send a private message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-charcoal-600 transition hover:bg-fog-200 hover:text-charcoal-900"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
            <p className="text-sm text-charcoal-500">@{user.username}</p>
          </div>
          <p className="max-w-md text-[15px] leading-relaxed text-charcoal-700">{user.bio}</p>

          <dl className="flex items-center gap-8 pt-1">
            <div className="flex flex-col items-center sm:items-start">
              <dt className="sr-only">Following</dt>
              <dd>
                <button
                  type="button"
                  onClick={() => setFollowList('following')}
                  aria-label={`View ${followingCount(socialUserId)} following`}
                  className="group flex flex-col items-center sm:items-start"
                >
                  <span className="text-lg font-medium tabular-nums text-charcoal-900 transition group-hover:text-charcoal-600">
                    {followingCount(socialUserId)}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-charcoal-500">Following</span>
                </button>
              </dd>
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <dt className="sr-only">Followers</dt>
              <dd>
                <button
                  type="button"
                  onClick={() => setFollowList('followers')}
                  aria-label={`View ${followerCount(socialUserId)} followers`}
                  className="group flex flex-col items-center sm:items-start"
                >
                  <span className="text-lg font-medium tabular-nums text-charcoal-900 transition group-hover:text-charcoal-600">
                    {followerCount(socialUserId)}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-charcoal-500">Followers</span>
                </button>
              </dd>
            </div>
          </dl>

          <div className="pt-1">
            {isOwn ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-full border border-fog-400 px-5 py-2 text-sm font-medium text-charcoal-800 transition hover:border-charcoal-500 hover:text-charcoal-900"
              >
                Edit profile
              </button>
            ) : (
              <FollowButton userId={userId} />
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <h2 className="pb-4 text-xs font-medium uppercase tracking-wider text-charcoal-500">
          Posts · {userPosts.length}
        </h2>
        {postsLoading ? (
          <p className="py-10 text-center text-sm text-charcoal-500">Loading posts…</p>
        ) : postsError ? (
          <p role="alert" className="py-10 text-center text-sm text-charcoal-500">{postsError}</p>
        ) : userPosts.length > 0 ? (
          <div className="glacier-flow-list">
            {userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onOpenProfile={onOpenProfile}
                currentUserId={currentUserId}
                isPersisted={remotePosts !== null}
                highlightReplyId={targetPost?.postId === post.id ? targetPost.replyId : undefined}
                onPostUpdated={(postId, patch) =>
                  setRemotePosts((prev) =>
                    prev?.map((item) => (item.id === postId ? { ...item, ...patch } : item)) ?? prev,
                  )
                }
                onPostDeleted={(postId) =>
                  setRemotePosts((prev) => prev?.filter((item) => item.id !== postId) ?? prev)
                }
              />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-fog-300 px-6 py-10 text-center text-sm text-charcoal-500">
            No posts yet.
          </p>
        )}
      </div>

      {editing && (
        <EditProfileModal
          onClose={() => setEditing(false)}
          onSaved={() => setProfileSaved(true)}
        />
      )}
      {followList && (
        <Modal
          title={followList === 'following' ? 'Following' : 'Followers'}
          onClose={() => setFollowList(null)}
          fullScreenMobile
        >
          {followUsers.length > 0 ? (
            <ul className="divide-y divide-fog-200">
              {followUsers.map((followUser) => (
                <li key={followUser.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setFollowList(null);
                      onOpenProfile(followUser.id);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-fog-100/80"
                  >
                    <Avatar
                      id={followUser.id}
                      name={followUser.name}
                      avatarUrl={followUser.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-charcoal-900">{followUser.name}</p>
                      <p className="truncate text-xs text-charcoal-500">@{followUser.username}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-10 text-center text-sm text-charcoal-500">
              {followList === 'following' ? 'Not following anyone yet.' : 'No followers yet.'}
            </p>
          )}
        </Modal>
      )}
      {inboxOpen && (
        <InboxModal
          onClose={() => setInboxOpen(false)}
          onOpenPost={(postId, replyId) => {
            if (import.meta.env.DEV) {
              console.log('[Profile] closing inbox and opening comment', { postId, replyId });
            }
            setInboxOpen(false);
            onOpenPost(postId, replyId);
          }}
          onOpenConversation={(participantId) => {
            setInboxOpen(false);
            setChatParticipantId(participantId);
          }}
        />
      )}
      {chatParticipantId && (
        <DirectMessageModal
          participantId={chatParticipantId}
          onClose={() => setChatParticipantId(null)}
        />
      )}
    </section>
  );
}