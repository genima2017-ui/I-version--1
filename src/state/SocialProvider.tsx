import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  INITIAL_FOLLOWS,
  INITIAL_DIRECT_MESSAGES,
  INITIAL_INBOX_ITEMS,
  INITIAL_LIKED_POST_IDS,
  INITIAL_POSTS,
  INITIAL_REPLIES,
  INITIAL_USERS,
  ME_ID,
} from '@/data/mockData';
import { SocialContext, type SocialContextValue } from '@/state/SocialContext';
import type { DirectMessage, InboxItem, Post, PostNote, PrivateReply, User } from '@/types';

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

interface PostLikeState {
  isLiked: boolean;
  count: number;
}

export function SocialProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>(INITIAL_INBOX_ITEMS);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(INITIAL_DIRECT_MESSAGES);
  const [replies, setReplies] = useState<PrivateReply[]>(INITIAL_REPLIES);
  const [postNotes, setPostNotes] = useState<PostNote[]>([]);
  const [postLikes, setPostLikes] = useState<Record<string, PostLikeState>>(
    () =>
      Object.fromEntries(
        INITIAL_POSTS.map((post) => {
          const isLiked = INITIAL_LIKED_POST_IDS.includes(post.id);
          return [post.id, { isLiked, count: isLiked ? 1 : 0 }];
        }),
      ),
  );
  const [follows, setFollows] = useState<Record<string, string[]>>(INITIAL_FOLLOWS);

  const getUser = useCallback((id: string) => users.find((user) => user.id === id), [users]);

  const isLiked = useCallback((postId: string) => postLikes[postId]?.isLiked ?? false, [postLikes]);

  const likeCount = useCallback((postId: string) => postLikes[postId]?.count ?? 0, [postLikes]);

  const toggleLike = useCallback((postId: string) => {
    setPostLikes((prev) => {
      const current = prev[postId] ?? { isLiked: false, count: 0 };
      const nextIsLiked = !current.isLiked;
      return {
        ...prev,
        [postId]: {
          isLiked: nextIsLiked,
          count: Math.max(0, current.count + (nextIsLiked ? 1 : -1)),
        },
      };
    });
  }, []);

  const isFollowing = useCallback(
    (userId: string) => (follows[ME_ID] ?? []).includes(userId),
    [follows],
  );

  const toggleFollow = useCallback((userId: string) => {
    setFollows((prev) => {
      const mine = prev[ME_ID] ?? [];
      const next = mine.includes(userId)
        ? mine.filter((id) => id !== userId)
        : [...mine, userId];
      return { ...prev, [ME_ID]: next };
    });
  }, []);

  const followingCount = useCallback((userId: string) => (follows[userId] ?? []).length, [follows]);

  const followerCount = useCallback(
    (userId: string) => Object.values(follows).filter((list) => list.includes(userId)).length,
    [follows],
  );

  const getFollowing = useCallback(
    (userId: string) =>
      (follows[userId] ?? [])
        .map((followingId) => users.find((user) => user.id === followingId))
        .filter((user): user is User => user !== undefined),
    [follows, users],
  );

  const getFollowers = useCallback(
    (userId: string) => users.filter((user) => (follows[user.id] ?? []).includes(userId)),
    [follows, users],
  );

  const getPrivateReplies = useCallback(
    (postId: string) => {
      const post = posts.find((item) => item.id === postId);
      if (!post || post.authorId !== ME_ID) {
        return [];
      }
      return replies.filter((reply) => reply.postId === postId);
    },
    [posts, replies],
  );

  const addPrivateReply = useCallback((postId: string, content: string, replyToId?: string) => {
    setReplies((prev) => [
      ...prev,
      {
        id: createId(),
        postId,
        authorId: ME_ID,
        replyToId,
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const getPostNotes = useCallback(
    (postId: string) => postNotes.filter((note) => note.postId === postId),
    [postNotes],
  );

  const addPostNote = useCallback((postId: string, content: string) => {
    setPostNotes((prev) => [
      ...prev,
      {
        id: createId(),
        postId,
        authorId: ME_ID,
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const createPost = useCallback((content: string) => {
    setPosts((prev) => [
      { id: createId(), authorId: ME_ID, content, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const updateProfile = useCallback((patch: Pick<User, 'name' | 'username' | 'bio' | 'avatarUrl'>) => {
    setUsers((prev) => prev.map((user) => (user.id === ME_ID ? { ...user, ...patch } : user)));
  }, []);

  const markAllInboxItemsRead = useCallback(() => {
    setInboxItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
  }, []);

  const getDirectMessages = useCallback(
    (participantId: string) => directMessages.filter((message) => message.participantId === participantId),
    [directMessages],
  );

  const sendDirectMessage = useCallback((participantId: string, content: string) => {
    setDirectMessages((prev) => [
      ...prev,
      {
        id: createId(),
        participantId,
        senderId: ME_ID,
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const value = useMemo<SocialContextValue>(
    () => ({
      users,
      posts,
      inboxItems,
      getDirectMessages,
      sendDirectMessage,
      hasUnreadInboxItems: inboxItems.some((item) => !item.isRead),
      getUser,
      isLiked,
      likeCount,
      toggleLike,
      isFollowing,
      toggleFollow,
      followingCount,
      followerCount,
      getFollowing,
      getFollowers,
      getPrivateReplies,
      addPrivateReply,
      getPostNotes,
      addPostNote,
      createPost,
      updateProfile,
      markAllInboxItemsRead,
    }),
    [
      users,
      posts,
      inboxItems,
      getDirectMessages,
      sendDirectMessage,
      getUser,
      isLiked,
      likeCount,
      toggleLike,
      isFollowing,
      toggleFollow,
      followingCount,
      followerCount,
      getFollowing,
      getFollowers,
      getPrivateReplies,
      addPrivateReply,
      getPostNotes,
      addPostNote,
      createPost,
      updateProfile,
      markAllInboxItemsRead,
    ],
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}
