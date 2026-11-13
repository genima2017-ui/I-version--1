import { useCallback, useEffect, useState } from 'react';
import { ME_ID } from '@/data/mockData';
import { BottomNav } from '@/components/BottomNav';
import { SideNav } from '@/components/SideNav';
import { CommunityPage } from '@/pages/CommunityPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { TogetherPage } from '@/pages/TogetherPage';
import type { Page } from '@/types';

export default function App() {
  const [page, setPage] = useState<Page>('community');
  const [profileId, setProfileId] = useState(ME_ID);
  const [targetPostId, setTargetPostId] = useState<string | null>(null);

  const navigate = useCallback((next: Page) => {
    if (next === 'profile') setProfileId(ME_ID);
    setPage(next);
    window.scrollTo({ top: 0 });
  }, []);

  const openProfile = useCallback((userId: string) => {
    setProfileId(userId);
    setPage('profile');
    window.scrollTo({ top: 0 });
  }, []);

  const openPost = useCallback((postId: string) => {
    setProfileId(ME_ID);
    setTargetPostId(postId);
    setPage('profile');
  }, []);

  useEffect(() => {
    if (page !== 'profile' || profileId !== ME_ID || !targetPostId) return;
    let attempts = 0;
    let frame = 0;
    const scrollToPost = () => {
      const target = document.getElementById(`post-${targetPostId}`);
      if (target) {
        if (import.meta.env.DEV) {
          console.log('[App] post located; scrolling', { postId: targetPostId });
        }
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          target.animate(
            [
              { backgroundColor: 'transparent' },
              { backgroundColor: 'rgba(230, 232, 234, 0.9)', offset: 0.35 },
              { backgroundColor: 'transparent' },
            ],
            { duration: 1200, easing: 'ease-in-out' },
          );
        }
        setTargetPostId(null);
        return;
      }

      attempts += 1;
      if (attempts < 10) {
        frame = window.requestAnimationFrame(scrollToPost);
      } else {
        console.warn('[App] post could not be located', { postId: targetPostId });
        setTargetPostId(null);
      }
    };

    frame = window.requestAnimationFrame(scrollToPost);
    return () => window.cancelAnimationFrame(frame);
  }, [page, profileId, targetPostId]);

  return (
    <div className="min-h-screen bg-paper-100 text-charcoal-900">
      <SideNav page={page} onNavigate={navigate} />

      <main className="px-5 pb-28 pt-10 sm:px-8 sm:pt-14 lg:pb-20 lg:pl-72 lg:pr-12">
        <div className="mx-auto w-full max-w-xl">
          {page === 'community' && <CommunityPage onOpenProfile={openProfile} />}
          {page === 'profile' && (
            <ProfilePage
              key={profileId}
              userId={profileId}
              onOpenProfile={openProfile}
              onOpenPost={openPost}
            />
          )}
          {page === 'together' && <TogetherPage />}
        </div>
      </main>

      <BottomNav page={page} onNavigate={navigate} />
    </div>
  );
}
