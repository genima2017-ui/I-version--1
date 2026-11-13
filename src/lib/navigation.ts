import { CircleUserRound, MessageCircle, Users, type LucideIcon } from 'lucide-react';
import type { Page } from '@/types';

export const NAV_ITEMS: { id: Page; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: 'Profile', icon: CircleUserRound },
  { id: 'community', label: 'Community', icon: MessageCircle },
  { id: 'together', label: 'Together', icon: Users },
];
