import type { DirectMessage, InboxItem, Post, PrivateReply, User } from '@/types';

export const ME_ID = 'me';

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const INITIAL_USERS: User[] = [
  {
    id: ME_ID,
    name: 'Ellis Hart',
    username: 'ellis.hart',
    bio: 'Slow mornings, half-finished notebooks, and a soft spot for rainy afternoons.',
  },
  {
    id: 'maren',
    name: 'Maren Olsen',
    username: 'maren.reads',
    bio: 'Secondhand bookshops and long train rides. Usually listening more than talking.',
  },
  {
    id: 'tobias',
    name: 'Tobias Wren',
    username: 'tobias.wren',
    bio: 'Draws maps of places I have never been. Quiet on weekdays, quieter on weekends.',
  },
  {
    id: 'iris',
    name: 'Iris Nakamura',
    username: 'iris.notes',
    bio: 'Keeping a small journal of ordinary days. Tea is a complete personality.',
  },
  {
    id: 'julian',
    name: 'Julian Park',
    username: 'julian.p',
    bio: 'Software by day, piano by night, and silence whenever I can find it.',
  },
  {
    id: 'clara',
    name: 'Clara Bennett',
    username: 'clara.b',
    bio: 'Gardening, slow cooking, and the occasional walk without a destination.',
  },
  {
    id: 'samir',
    name: 'Samir Haddad',
    username: 'samir.h',
    bio: 'Thinking about cities, weather, and why people leave the window open.',
  },
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'p1',
    authorId: 'maren',
    content: "Finished a book today. I don't think I understood everything, but one sentence stayed with me.",
    createdAt: hoursAgo(1),
  },
  {
    id: 'p2',
    authorId: ME_ID,
    content: 'Sometimes I enjoy a whole afternoon without having to explain myself.',
    createdAt: minutesAgo(50),
  },
  {
    id: 'p3',
    authorId: 'tobias',
    content: 'A quiet walk can be a surprisingly good conversation with yourself.',
    createdAt: hoursAgo(3),
  },
  {
    id: 'p4',
    authorId: 'iris',
    content: "Made too much soup again. Tomorrow's lunch is already decided, and I'm grateful for that.",
    createdAt: hoursAgo(5),
  },
  {
    id: 'p5',
    authorId: 'julian',
    content: 'Practiced the same four bars for an hour. Nobody heard it, and it still felt like progress.',
    createdAt: hoursAgo(8),
  },
  {
    id: 'p6',
    authorId: 'clara',
    content: 'The first cold morning of the year. I left the kettle on the stove just to hear it hum.',
    createdAt: hoursAgo(14),
  },
  {
    id: 'p7',
    authorId: ME_ID,
    content: 'Spent the evening sorting old photographs. Found a street I had completely forgotten.',
    createdAt: hoursAgo(26),
  },
  {
    id: 'p8',
    authorId: 'samir',
    content: "I don't need to be busy to feel useful. Some days the most useful thing is noticing things.",
    createdAt: hoursAgo(30),
  },
  {
    id: 'p9',
    authorId: 'maren',
    content: 'Some conversations are better when neither person is trying to win them.',
    createdAt: hoursAgo(48),
  },
  {
    id: 'p10',
    authorId: 'tobias',
    content: 'Rain on a tin roof is the only background noise I have ever really wanted.',
    createdAt: hoursAgo(55),
  },
  {
    id: 'p11',
    authorId: 'iris',
    content: 'Learned that answering a message slowly is not the same as not caring about it.',
    createdAt: hoursAgo(72),
  },
  {
    id: 'p12',
    authorId: 'clara',
    content: 'Repotted the fern. It looks smaller now, but I think it finally has room to breathe.',
    createdAt: hoursAgo(96),
  },
  {
    id: 'p13',
    authorId: 'julian',
    content: 'Left my phone in the other room for two hours. The world did not end, and neither did my focus.',
    createdAt: hoursAgo(120),
  },
];

export const INITIAL_REPLIES: PrivateReply[] = [
  {
    id: 'r1',
    postId: 'p2',
    authorId: 'maren',
    content: 'I know that feeling. Afternoons like that are rare enough to protect.',
    createdAt: minutesAgo(30),
  },
  {
    id: 'r2',
    postId: 'p2',
    authorId: 'iris',
    content: 'Do you want to tell me what filled it, or is it better kept just for you?',
    createdAt: minutesAgo(12),
  },
  {
    id: 'r3',
    postId: 'p7',
    authorId: 'julian',
    content: 'That street sounds like it has a story. I hope you went back to look at it.',
    createdAt: hoursAgo(20),
  },
];

export const INITIAL_INBOX_ITEMS: InboxItem[] = [
  {
    id: 'inbox-comment-1',
    category: 'comments',
    content: '这样的下午很难得，值得好好珍惜。',
    context: '有时我喜欢一个不必解释自己的整个下午。',
    postId: 'p2',
    replyId: 'r1',
    senderId: 'maren',
    createdAt: minutesAgo(30),
    isRead: false,
  },
  {
    id: 'inbox-message-1',
    category: 'messages',
    content: '最近经过一条旧街，想起你说过的那张照片。希望你后来又去看了看。',
    senderId: 'tobias',
    createdAt: hoursAgo(2),
    isRead: false,
  },
];

export const INITIAL_DIRECT_MESSAGES: DirectMessage[] = [
  {
    id: 'dm-tobias-1',
    participantId: 'tobias',
    senderId: 'tobias',
    content: '最近经过一条旧街，想起你说过的那张照片。希望你后来又去看了看。',
    createdAt: hoursAgo(2),
  },
];

export const INITIAL_LIKED_POST_IDS = ['p1', 'p3', 'p8'];

export const INITIAL_FOLLOWS: Record<string, string[]> = {
  [ME_ID]: ['maren', 'iris', 'clara'],
  maren: [ME_ID, 'tobias'],
  tobias: ['maren', 'samir'],
  iris: [ME_ID, 'clara', 'maren'],
  julian: ['tobias', 'samir'],
  clara: [ME_ID, 'iris'],
  samir: ['julian', 'clara'],
};
