import { createContext, useContext } from 'react';
import type { DirectMessage, InboxItem, Post, PostNote, PrivateReply, User } from '@/types';

export interface SocialContextValue {
  users: User[];
  posts: Post[];
  inboxItems: InboxItem[];
  getDirectMessages: (participantId: string) => DirectMessage[];
  sendDirectMessage: (participantId: string, content: string) => void;
  hasUnreadInboxItems: boolean;
  getUser: (id: string) => User | undefined;
  isLiked: (postId: string) => boolean;
  likeCount: (postId: string) => number;
  toggleLike: (postId: string) => void;
  isFollowing: (userId: string) => boolean;
  toggleFollow: (userId: string) => void;
  followingCount: (userId: string) => number;
  followerCount: (userId: string) => number;
  getPrivateReplies: (postId: string) => PrivateReply[];
  addPrivateReply: (postId: string, content: string, replyToId?: string) => void;
  getPostNotes: (postId: string) => PostNote[];
  addPostNote: (postId: string, content: string) => void;
  createPost: (content: string) => void;
  updateProfile: (patch: Pick<User, 'name' | 'username' | 'bio' | 'avatarUrl'>) => void;
  markAllInboxItemsRead: () => void;
}

export const SocialContext = createContext<SocialContextValue | null>(null);

export function useSocial(): SocialContextValue {
  const value = useContext(SocialContext);
  if (!value) {
    throw new Error('useSocial must be used within SocialProvider');
  }
  return value;
}
