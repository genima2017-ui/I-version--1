import { useMemo, useState } from 'react';
import { ME_ID } from '@/data/mockData';
import { useSocial } from '@/state/SocialContext';
import { PostCard } from '@/components/PostCard';
import { PostComposer } from '@/components/PostComposer';
import type { FeedTab } from '@/types';

const TABS: { id: FeedTab; label: string }[] = [
  { id: 'following', label: 'Following' },
  { id: 'discover', label: 'Discover' },
];

interface CommunityPageProps {
  onOpenProfile: (userId: string) => void;
}

export function CommunityPage({ onOpenProfile }: CommunityPageProps) {
  const { posts, isFollowing } = useSocial();
  const [tab, setTab] = useState<FeedTab>('following');

  const visiblePosts = useMemo(() => {
    if (tab === 'discover') {
      return posts.filter((post) => post.authorId !== ME_ID);
    }
    return posts.filter((post) => post.authorId === ME_ID || isFollowing(post.authorId));
  }, [posts, tab, isFollowing]);

  return (
    <section className="flex flex-col gap-10">
      <PostComposer />

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

        {visiblePosts.length > 0 ? (
          <div key={tab} className="glacier-flow-list">
            {visiblePosts.map((post) => (
              <PostCard key={post.id} post={post} onOpenProfile={onOpenProfile} />
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
