import { useState } from 'react';
import { Mail } from 'lucide-react';
import { ME_ID } from '@/data/mockData';
import { useSocial } from '@/state/SocialContext';
import { Avatar } from '@/components/Avatar';
import { EditProfileModal } from '@/components/EditProfileModal';
import { InboxModal } from '@/components/InboxModal';
import { DirectMessageModal } from '@/components/DirectMessageModal';
import { FollowButton } from '@/components/FollowButton';
import { PostCard } from '@/components/PostCard';

interface ProfilePageProps {
  userId: string;
  onOpenProfile: (userId: string) => void;
  onOpenPost: (postId: string) => void;
}

export function ProfilePage({ userId, onOpenProfile, onOpenPost }: ProfilePageProps) {
  const { getUser, posts, followingCount, followerCount, hasUnreadInboxItems } = useSocial();
  const [editing, setEditing] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [chatParticipantId, setChatParticipantId] = useState<string | null>(null);
  const user = getUser(userId);

  if (!user) {
    return (
      <section className="rounded-2xl border border-dashed border-fog-300 px-6 py-14 text-center">
        <p className="font-serif text-xl text-charcoal-800">This profile could not be found.</p>
      </section>
    );
  }

  const isOwn = userId === ME_ID;
  const userPosts = posts.filter((post) => post.authorId === userId);

  return (
    <section className="flex flex-col gap-12">
      <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:gap-8 sm:text-left">
        <Avatar id={user.id} name={user.name} avatarUrl={user.avatarUrl} size="lg" />

        <div className="flex min-w-0 flex-1 flex-col items-center gap-4 sm:items-start">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <div className="flex items-center justify-center gap-3 sm:justify-start">
              <h1 className="font-serif text-3xl leading-tight text-charcoal-900 sm:text-4xl">{user.name}</h1>
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
                      className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-paper-50 animate-pulse"
                    />
                  )}
                </button>
              )}
            </div>
            <p className="text-sm text-charcoal-500">@{user.username}</p>
          </div>
          <p className="max-w-md text-[15px] leading-relaxed text-charcoal-700">{user.bio}</p>

          <dl className="flex items-center gap-8 pt-1">
            <div className="flex flex-col items-center sm:items-start">
              <dd className="text-lg font-medium tabular-nums text-charcoal-900">{followingCount(userId)}</dd>
              <dt className="text-xs uppercase tracking-wider text-charcoal-500">Following</dt>
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <dd className="text-lg font-medium tabular-nums text-charcoal-900">{followerCount(userId)}</dd>
              <dt className="text-xs uppercase tracking-wider text-charcoal-500">Followers</dt>
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
        {userPosts.length > 0 ? (
          userPosts.map((post) => (
            <PostCard key={post.id} post={post} onOpenProfile={onOpenProfile} />
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-fog-300 px-6 py-10 text-center text-sm text-charcoal-500">
            No posts yet.
          </p>
        )}
      </div>

      {editing && <EditProfileModal onClose={() => setEditing(false)} />}
      {inboxOpen && (
        <InboxModal
          onClose={() => setInboxOpen(false)}
          onOpenPost={(postId) => {
            if (import.meta.env.DEV) {
              console.log('[Profile] closing inbox and opening post', { postId });
            }
            setInboxOpen(false);
            onOpenPost(postId);
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
