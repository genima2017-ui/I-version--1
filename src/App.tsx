import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ME_ID } from '@/data/mockData';
import { supabase } from '@/supabase';
import { BottomNav } from '@/components/BottomNav';
import { AuthPage } from '@/components/AuthPage';
import { SideNav } from '@/components/SideNav';
import { CommunityPage } from '@/pages/CommunityPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { TogetherPage } from '@/pages/TogetherPage';
import type { Page } from '@/types';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState<Page>('community');
  const [profileId, setProfileId] = useState(ME_ID);
  const [targetPost, setTargetPost] = useState<{ postId: string; replyId?: string } | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    const client = supabase;

    let active = true;
    let receivedAuthEvent = false;

    const loadSession = async () => {
      const { data, error } = await client.auth.getSession();
      if (!active) return;
      if (error) console.error('[Auth] failed to load session', error);
      if (!receivedAuthEvent) setSession(data.session);
      setAuthLoading(false);
    };

    void loadSession();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      receivedAuthEvent = true;
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

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

  const openPost = useCallback((postId: string, replyId?: string) => {
    setProfileId(ME_ID);
    setTargetPost({ postId, replyId });
    setPage('profile');
  }, []);

  useEffect(() => {
    if (page !== 'profile' || profileId !== ME_ID || !targetPost) return;
    let attempts = 0;
    let frame = 0;
    const scrollToComment = () => {
      const targetId = targetPost.replyId
        ? `private-reply-${targetPost.replyId}`
        : `post-${targetPost.postId}`;
      const target = document.getElementById(targetId);
      if (target) {
        if (import.meta.env.DEV) {
          console.log('[App] comment located; scrolling', targetPost);
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
        setTargetPost(null);
        return;
      }

      attempts += 1;
      if (attempts < 10) {
        frame = window.requestAnimationFrame(scrollToComment);
      } else {
        console.warn('[App] comment could not be located', targetPost);
        setTargetPost(null);
      }
    };

    frame = window.requestAnimationFrame(scrollToComment);
    return () => window.cancelAnimationFrame(frame);
  }, [page, profileId, targetPost]);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper-100 text-charcoal-500">
        <span className="font-serif text-3xl" aria-label="Loading">
          I
        </span>
      </main>
    );
  }

  if (!session) return <AuthPage />;

  return (
    <div className="relative z-10 min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-paper-100/45 text-charcoal-900">
      <SideNav page={page} onNavigate={navigate} />
      <main className="min-w-0 w-full max-w-full overflow-x-hidden px-5 pb-28 pt-10 sm:px-8 sm:pt-14 lg:pb-20 lg:pl-72 lg:pr-12">
        <div key={`${page}-${profileId}`} className="glacier-page-flow mx-auto w-full min-w-0 max-w-xl">
          {page === 'community' && <CommunityPage onOpenProfile={openProfile} />}
          {page === 'profile' && (
            <ProfilePage
              key={profileId}
              userId={profileId}
              onOpenProfile={openProfile}
              onOpenPost={openPost}
              targetPost={targetPost}
            />
          )}
          {page === 'together' && <TogetherPage />}
        </div>
      </main>
      <BottomNav page={page} onNavigate={navigate} />
    </div>
  );
}