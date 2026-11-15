import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { supabase } from '@/supabase';

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

interface PostLikeState {
  isLiked: boolean;
  count: number;
}

interface MessageRow {
  id: string | number;
  sender_id: string | null;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface PrivateReplyRow {
  id: string | number;
  post_id: string;
  author_id: string;
  reply_to_id: string | null;
  content: string;
  created_at: string;
  is_read: boolean;
  posts: { user_id: string; content: string } | { user_id: string; content: string }[];
}

interface FollowRow {
  follower_id: string;
  following_id: string;
}

interface ProfileRow {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

const newestInboxFirst = (left: InboxItem, right: InboxItem) =>
  Date.parse(right.createdAt) - Date.parse(left.createdAt);

export function SocialProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
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

  const setCurrentUserId = useCallback(
    (userId: string | null) => {
      if (currentUserId === userId) return;
      setCurrentUserIdState(userId);
      setInboxItems(userId ? [] : INITIAL_INBOX_ITEMS);
      setDirectMessages(userId ? [] : INITIAL_DIRECT_MESSAGES);
      setReplies(userId ? [] : INITIAL_REPLIES);
      setFollows(userId ? {} : INITIAL_FOLLOWS);
    },
    [currentUserId],
  );

  useEffect(() => {
    if (!currentUserId || !supabase) return;
    const client = supabase;
    let active = true;

    const loadMessages = async () => {
      try {
        const { data, error } = await client
          .from('messages')
          .select('id, sender_id, receiver_id, content, is_read, created_at')
          .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
          .order('created_at', { ascending: true });
        if (error) throw error;
        if (!active) return;

        const rows = (data ?? []) as unknown as MessageRow[];
        setDirectMessages(
          rows.map((row) => ({
            id: String(row.id),
            participantId:
              row.sender_id === currentUserId ? row.receiver_id : row.sender_id ?? 'system',
            senderId: row.sender_id ?? 'system',
            content: row.content,
            createdAt: row.created_at,
          })),
        );
        const messageItems = rows
          .filter((row) => row.receiver_id === currentUserId)
          .map<InboxItem>((row) => ({
            id: `message-${row.id}`,
            category: 'messages',
            content: row.content,
            senderId: row.sender_id ?? undefined,
            createdAt: row.created_at,
            isRead: row.is_read,
          }));
        setInboxItems((previous) =>
          [...previous.filter((item) => item.category !== 'messages'), ...messageItems].sort(
            newestInboxFirst,
          ),
        );
      } catch (error) {
        console.error('[Inbox] failed to load messages', error);
      }
    };

    const loadReplies = async () => {
      try {
        const { data, error } = await client
          .from('private_replies')
          .select('id, post_id, author_id, reply_to_id, content, created_at, is_read, posts!inner(user_id, content)')
          .eq('posts.user_id', currentUserId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        if (!active) return;

        const rows = (data ?? []) as unknown as PrivateReplyRow[];
        setReplies(
          rows.map((row) => ({
            id: String(row.id),
            postId: String(row.post_id),
            authorId: row.author_id,
            replyToId: row.reply_to_id ?? undefined,
            content: row.content,
            createdAt: row.created_at,
          })),
        );
        const commentItems = rows
          .filter((row) => row.author_id !== currentUserId)
          .map<InboxItem>((row) => ({
            id: `reply-${row.id}`,
            category: 'comments',
            content: row.content,
            senderId: row.author_id,
            postId: String(row.post_id),
            replyId: String(row.id),
            createdAt: row.created_at,
            isRead: row.is_read,
          }));
        setInboxItems((previous) =>
          [...previous.filter((item) => item.category !== 'comments'), ...commentItems].sort(
            newestInboxFirst,
          ),
        );
      } catch (error) {
        console.error('[Inbox] failed to load private replies', error);
      }
    };

    void loadMessages();
    void loadReplies();
    return () => {
      active = false;
    };
  }, [currentUserId]);

  const getUser = useCallback((id: string) => users.find((user) => user.id === id), [users]);

  const cacheUsers = useCallback((incomingUsers: User[]) => {
    setUsers((prev) => {
      const usersById = new Map(prev.map((user) => [user.id, user]));
      incomingUsers.forEach((user) => usersById.set(user.id, { ...usersById.get(user.id), ...user }));
      return [...usersById.values()];
    });
  }, []);

  useEffect(() => {
    if (!currentUserId || !supabase) return;
    const client = supabase;
    let active = true;

    const loadFollows = async () => {
      try {
        const { data, error } = await client
          .from('follows')
          .select('follower_id, following_id');
        if (error) throw error;
        if (!active) return;

        const rows = (data ?? []) as unknown as FollowRow[];
        const followMap: Record<string, string[]> = {};
        for (const row of rows) {
          (followMap[row.follower_id] ??= []).push(row.following_id);
        }
        setFollows(followMap);

        const profileIds = [...new Set(rows.flatMap((row) => [row.follower_id, row.following_id]))];
        if (profileIds.length === 0) return;

        const { data: profiles, error: profilesError } = await client
          .from('profiles')
          .select('id, username, full_name, bio, avatar_url')
          .in('id', profileIds);
        if (profilesError) throw profilesError;
        if (!active) return;

        cacheUsers(
          ((profiles ?? []) as unknown as ProfileRow[]).map((profile) => ({
            id: profile.id,
            username: profile.username,
            name: profile.full_name || profile.username,
            bio: profile.bio ?? '',
            avatarUrl: profile.avatar_url ?? undefined,
          })),
        );
      } catch (error) {
        console.error('[Follows] failed to load relationships', error);
      }
    };

    void loadFollows();
    return () => {
      active = false;
    };
  }, [cacheUsers, currentUserId]);

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
    (userId: string) => (follows[currentUserId ?? ME_ID] ?? []).includes(userId),
    [currentUserId, follows],
  );

  const toggleFollow = useCallback(
    async (userId: string) => {
      if (currentUserId && supabase) {
        if (currentUserId === userId) return false;
        const alreadyFollowing = (follows[currentUserId] ?? []).includes(userId);

        try {
          const result = alreadyFollowing
            ? await supabase
                .from('follows')
                .delete()
                .eq('follower_id', currentUserId)
                .eq('following_id', userId)
            : await supabase
                .from('follows')
                .insert({ follower_id: currentUserId, following_id: userId });
          if (result.error) throw result.error;

          setFollows((previous) => {
            const mine = previous[currentUserId] ?? [];
            const next = alreadyFollowing
              ? mine.filter((id) => id !== userId)
              : [...mine, userId];
            return { ...previous, [currentUserId]: next };
          });
          return true;
        } catch (error) {
          console.error('[Follows] failed to update relationship', error);
          return false;
        }
      }

      setFollows((previous) => {
        const mine = previous[ME_ID] ?? [];
        const next = mine.includes(userId)
          ? mine.filter((id) => id !== userId)
          : [...mine, userId];
        return { ...previous, [ME_ID]: next };
      });
      return true;
    },
    [currentUserId, follows],
  );

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
    (postId: string) => replies.filter((reply) => reply.postId === postId),
    [replies],
  );

  const addPrivateReply = useCallback(
    async (postId: string, receiverId: string, content: string, replyToId?: string) => {
      if (!postId || !receiverId || !content.trim()) return false;

      if (!currentUserId || !supabase) {
        setReplies((prev) => [
          ...prev,
          {
            id: createId(),
            postId,
            authorId: currentUserId ?? ME_ID,
            replyToId,
            content,
            createdAt: new Date().toISOString(),
          },
        ]);
        return true;
      }

      try {
        const { data, error } = await supabase
          .from('private_replies')
          .insert({
            post_id: postId,
            author_id: currentUserId,
            receiver_id: receiverId,
            reply_to_id: replyToId ?? null,
            content,
          })
          .select('id, post_id, author_id, receiver_id, reply_to_id, content, created_at')
          .single();
        if (error) throw error;
        if (!data) throw new Error('No reply was returned after sending.');

        setReplies((prev) => [
          ...prev,
          {
            id: String(data.id),
            postId: String(data.post_id),
            authorId: data.author_id,
            replyToId: data.reply_to_id ?? undefined,
            content: data.content,
            createdAt: data.created_at,
          },
        ]);
        return true;
      } catch (error) {
        console.error('[Replies] failed to send private reply', error);
        return false;
      }
    },
    [currentUserId],
  );

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

  const updatePostNote = useCallback((noteId: string, content: string) => {
    setPostNotes((prev) =>
      prev.map((note) => (note.id === noteId ? { ...note, content } : note)),
    );
  }, []);

  const deletePostNote = useCallback((noteId: string) => {
    setPostNotes((prev) => prev.filter((note) => note.id !== noteId));
  }, []);

  const createPost = useCallback((content: string) => {
    setPosts((prev) => [
      { id: createId(), authorId: ME_ID, content, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, []);

  const updatePost = useCallback(
    (postId: string, patch: Partial<Pick<Post, 'content' | 'isHidden'>>) => {
      setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, ...patch } : post)));
    },
    [],
  );

  const deletePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    setPostNotes((prev) => prev.filter((note) => note.postId !== postId));
    setReplies((prev) => prev.filter((reply) => reply.postId !== postId));
    setPostLikes((prev) => {
      const next = { ...prev };
      delete next[postId];
      return next;
    });
  }, []);

  const updateProfile = useCallback((patch: Pick<User, 'name' | 'username' | 'bio' | 'avatarUrl'>) => {
    setUsers((prev) => prev.map((user) => (user.id === ME_ID ? { ...user, ...patch } : user)));
  }, []);

  const markAllInboxItemsRead = useCallback(() => {
    setInboxItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    if (!currentUserId || !supabase) return;

    const client = supabase;
    void client
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', currentUserId)
      .eq('is_read', false)
      .then(({ error }) => {
        if (error) console.error('[Inbox] failed to mark messages read', error);
      });

    const unreadReplyIds = inboxItems
      .filter((item) => item.category === 'comments' && !item.isRead && item.replyId)
      .map((item) => item.replyId as string);
    if (unreadReplyIds.length > 0) {
      void client
        .from('private_replies')
        .update({ is_read: true })
        .in('id', unreadReplyIds)
        .then(({ error }) => {
          if (error) console.error('[Inbox] failed to mark replies read', error);
        });
    }
  }, [currentUserId, inboxItems]);

  const getDirectMessages = useCallback(
    (participantId: string) => directMessages.filter((message) => message.participantId === participantId),
    [directMessages],
  );

  const sendDirectMessage = useCallback(
    async (participantId: string, content: string) => {
      if (!currentUserId || !supabase) {
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
        return true;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({ sender_id: currentUserId, receiver_id: participantId, content })
        .select('id, sender_id, receiver_id, content, is_read, created_at')
        .single();
      if (error || !data) {
        console.error('[Messages] failed to send message', error);
        return false;
      }

      setDirectMessages((prev) => [
        ...prev,
        {
          id: String(data.id),
          participantId,
          senderId: currentUserId,
          content: data.content,
          createdAt: data.created_at,
        },
      ]);
      return true;
    },
    [currentUserId],
  );

  const value = useMemo<SocialContextValue>(
    () => ({
      currentUserId,
      setCurrentUserId,
      users,
      posts,
      inboxItems,
      getDirectMessages,
      sendDirectMessage,
      hasUnreadInboxItems: inboxItems.some((item) => !item.isRead),
      getUser,
      cacheUsers,
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
      updatePostNote,
      deletePostNote,
      createPost,
      updatePost,
      deletePost,
      updateProfile,
      markAllInboxItemsRead,
    }),
    [
      currentUserId,
      setCurrentUserId,
      users,
      posts,
      inboxItems,
      getDirectMessages,
      sendDirectMessage,
      getUser,
      cacheUsers,
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
      updatePostNote,
      deletePostNote,
      createPost,
      updatePost,
      deletePost,
      updateProfile,
      markAllInboxItemsRead,
    ],
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}
