import { createContext, useContext } from 'react';
import type { DirectMessage, InboxItem, Post, PostNote, PrivateReply, User } from '@/types';

export interface SocialContextValue {
  currentUserId: string | null;
  setCurrentUserId: (userId: string | null) => void;
  users: User[];
  posts: Post[];
  inboxItems: InboxItem[];
  getDirectMessages: (participantId: string) => DirectMessage[];
  sendDirectMessage: (participantId: string, content: string) => Promise<boolean>;
  hasUnreadInboxItems: boolean;
  getUser: (id: string) => User | undefined;
  cacheUsers: (users: User[]) => void;
  isLiked: (postId: string) => boolean;
  likeCount: (postId: string) => number;
  toggleLike: (postId: string) => void;
  isFollowing: (userId: string) => boolean;
  toggleFollow: (userId: string) => Promise<boolean>;
  followingCount: (userId: string) => number;
  followerCount: (userId: string) => number;
  getFollowing: (userId: string) => User[];
  getFollowers: (userId: string) => User[];
  getPrivateReplies: (postId: string) => PrivateReply[];
  addPrivateReply: (
    postId: string,
    receiverId: string,
    content: string,
    replyToId?: string,
  ) => Promise<boolean>;
  getPostNotes: (postId: string) => PostNote[];
  addPostNote: (postId: string, content: string) => void;
  updatePostNote: (noteId: string, content: string) => void;
  deletePostNote: (noteId: string) => void;
  createPost: (content: string) => void;
  updatePost: (postId: string, patch: Partial<Pick<Post, 'content' | 'isHidden'>>) => void;
  deletePost: (postId: string) => void;
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
