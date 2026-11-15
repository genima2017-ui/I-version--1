import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { useSocial } from '@/state/SocialContext';

interface FollowButtonProps {
  userId: string;
  size?: 'sm' | 'md';
}

export function FollowButton({ userId, size = 'md' }: FollowButtonProps) {
  const { isFollowing, toggleFollow } = useSocial();
  const [isUpdating, setIsUpdating] = useState(false);
  const following = isFollowing(userId);
  const sizing = size === 'sm' ? 'px-4 py-1.5 text-xs' : 'px-5 py-2 text-sm';

  const handleClick = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await toggleFollow(userId);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      aria-pressed={following}
      disabled={isUpdating}
      aria-busy={isUpdating}
      className={`group inline-flex items-center gap-1.5 rounded-full border font-medium transition duration-200 ${sizing} ${
        following
          ? 'border-fog-400 bg-transparent text-charcoal-700 hover:border-charcoal-500 hover:text-charcoal-900'
          : 'border-charcoal-900 bg-charcoal-900 text-paper-50 hover:bg-charcoal-700'
      }`}
    >
      {following ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
