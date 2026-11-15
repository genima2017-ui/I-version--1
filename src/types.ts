export interface User {
  id: string;
  name: string;
  username: string;
  bio: string;
  avatarUrl?: string;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface PrivateReply {
  id: string;
  postId: string;
  authorId: string;
  replyToId?: string;
  content: string;
  createdAt: string;
}

export interface PostNote {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export type InboxCategory = 'comments' | 'messages';

export interface InboxItem {
  id: string;
  category: InboxCategory;
  content: string;
  context?: string;
  senderId?: string;
  postId?: string;
  replyId?: string;
  createdAt: string;
  isRead: boolean;
}

export interface DirectMessage {
  id: string;
  participantId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export type Page = 'profile' | 'community' | 'together';

export type FeedTab = 'following' | 'discover';
