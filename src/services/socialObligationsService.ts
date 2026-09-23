import { supabase } from '../config/supabase';

export interface CircleActivityInfo {
  circle_id: string;
  circle_name: string;
  last_message_at: string | null;
  member_count: number;
  posts_since_last_activity: number;
  my_last_activity: string | null;
  is_active: boolean;
}

export interface SocialPressureItem {
  circleName: string;
  daysInactive: number;
  newPosts: number;
  missedMentions: number;
}

export interface FriendActivity {
  user_name: string;
  circle_name: string;
  activity_type: 'posted' | 'reacted' | 'joined' | 'commented';
  created_at: string;
  avatar_url: string | null;
}

export interface SocialProofStats {
  activeToday: number;
  activeInCircles: number;
  topPercentile: number;
  totalCircles: number;
  circleRankings: CircleRanking[];
}

export interface SocialNotification {
  id: string;
  type: 'missed_posts' | 'friend_post' | 'ranking_boost' | 'circle_inactive';
  title: string;
  body: string;
  circle_name: string;
  created_at: string;
}

export interface CircleRanking {
  circle_name: string;
  rank: number;
  total_circles: number;
  engagement_score: number;
  percentile: number;
}

async function getUserCircles(userId: string) {
  const { data, error } = await supabase
    .from('yayika_circle_members')
    .select('circle_id')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

export async function getCircleActivity(userId: string): Promise<CircleActivityInfo[]> {
  const memberships = await getUserCircles(userId);
  if (memberships.length === 0) return [];

  const circleIds = memberships.map((m) => m.circle_id);

  const [messagesData, membersData, postsData] = await Promise.all([
    supabase
      .from('yayika_circle_messages')
      .select('circle_id, created_at')
      .in('circle_id', circleIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('yayika_circle_members')
      .select('circle_id, user_id')
      .in('circle_id', circleIds),
    supabase
      .from('yayika_community_posts')
      .select('id, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const messages = messagesData.data || [];
  const members = membersData.data || [];
  const posts = postsData.data || [];

  const circleNames: Record<string, string> = {};
  for (const cid of circleIds) {
    const circleMembers = members.filter((m) => m.circle_id === cid);
    circleNames[cid] = `Círculo ${cid.slice(0, 6)}`;
  }

  return circleIds.map((cid) => {
    const circleMessages = messages.filter((m) => m.circle_id === cid);
    const lastMessage = circleMessages.length > 0 ? circleMessages[0].created_at : null;
    const memberCount = members.filter((m) => m.circle_id === cid).length;

    const userPostsInCircle = posts.filter(
      (p) => circleMembers.some((m) => m.circle_id === cid && m.user_id === p.user_id)
    );

    const myLastPost = userPostsInCircle.find((p) => p.user_id === userId);
    const myLastActivity = myLastPost?.created_at || null;

    const postsSinceMyActivity = myLastActivity
      ? userPostsInCircle.filter((p) => new Date(p.created_at) > new Date(myLastActivity)).length
      : userPostsInCircle.length;

    const now = new Date();
    const lastActivityDate = lastMessage ? new Date(lastMessage) : null;
    const isActive = lastActivityDate
      ? now.getTime() - lastActivityDate.getTime() < 24 * 60 * 60 * 1000
      : false;

    return {
      circle_id: cid,
      circle_name: circleNames[cid] || cid,
      last_message_at: lastMessage,
      member_count: memberCount,
      posts_since_last_activity: postsSinceMyActivity,
      my_last_activity: myLastActivity,
      is_active: isActive,
    };
  });
}

export async function getSocialPressure(userId: string): Promise<SocialPressureItem[]> {
  const activities = await getCircleActivity(userId);
  const now = new Date();

  return activities
    .filter((a) => a.posts_since_last_activity > 0)
    .map((a) => {
      const daysInactive = a.my_last_activity
        ? Math.floor((now.getTime() - new Date(a.my_last_activity).getTime()) / (1000 * 60 * 60 * 24))
        : 30;

      return {
        circleName: a.circle_name,
        daysInactive,
        newPosts: a.posts_since_last_activity,
        missedMentions: 0,
      };
    })
    .sort((a, b) => b.newPosts - a.newPosts);
}

export async function getFriendActivity(userId: string): Promise<FriendActivity[]> {
  const memberships = await getUserCircles(userId);
  if (memberships.length === 0) return [];

  const circleIds = memberships.map((m) => m.circle_id);

  const [membersData, messagesData] = await Promise.all([
    supabase
      .from('yayika_circle_members')
      .select('circle_id, user_id')
      .in('circle_id', circleIds),
    supabase
      .from('yayika_circle_messages')
      .select('circle_id, user_id, created_at')
      .in('circle_id', circleIds)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const members = membersData.data || [];
  const messages = messagesData.data || [];

  const userIds = [...new Set(members.map((m) => m.user_id))];
  const { data: profiles } = await supabase
    .from('yayika_profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const activities: FriendActivity[] = [];
  const seen = new Set<string>();

  for (const msg of messages) {
    if (msg.user_id === userId) continue;

    const key = `${msg.user_id}-${msg.circle_id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const profile = profileMap.get(msg.user_id);
    const memberEntry = members.find(
      (m) => m.user_id === msg.user_id && m.circle_id === msg.circle_id
    );

    if (!memberEntry) continue;

    activities.push({
      user_name: profile?.full_name || 'Guerrera',
      circle_name: `Círculo ${msg.circle_id.slice(0, 6)}`,
      activity_type: 'posted',
      created_at: msg.created_at,
      avatar_url: profile?.avatar_url || null,
    });

    if (activities.length >= 5) break;
  }

  return activities;
}

export async function getSocialProof(userId: string): Promise<SocialProofStats> {
  const memberships = await getUserCircles(userId);
  const circleIds = memberships.map((m) => m.circle_id);

  if (circleIds.length === 0) {
    return {
      activeToday: 0,
      activeInCircles: 0,
      topPercentile: 100,
      totalCircles: 0,
      circleRankings: [],
    };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [todayMembers, allMembers, circleRankings] = await Promise.all([
    supabase
      .from('yayika_circle_members')
      .select('user_id')
      .in('circle_id', circleIds),
    supabase
      .from('yayika_circle_members')
      .select('user_id, circle_id')
      .in('circle_id', circleIds),
    getCircularRankings(circleIds),
  ]);

  const uniqueToday = new Set((todayMembers.data || []).map((m) => m.user_id)).size;

  const totalMembers = new Set((allMembers.data || []).map((m) => m.user_id)).size;
  const engagementThreshold = 5;

  const topPercentile =
    circleRankings.length > 0
      ? Math.round(
          circleRankings.reduce((sum, r) => sum + r.percentile, 0) / circleRankings.length
        )
      : 50;

  return {
    activeToday: uniqueToday,
    activeInCircles: uniqueToday,
    topPercentile,
    totalCircles: circleIds.length,
    circleRankings,
  };
}

async function getCircularRankings(circleIds: string[]): Promise<CircleRanking[]> {
  if (circleIds.length === 0) return [];

  const [messagesData, membersData] = await Promise.all([
    supabase
      .from('yayika_circle_messages')
      .select('circle_id, created_at')
      .in('circle_id', circleIds)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('yayika_circle_members')
      .select('circle_id')
      .in('circle_id', circleIds),
  ]);

  const messages = messagesData.data || [];
  const members = membersData.data || [];

  const scores = circleIds.map((cid) => {
    const msgCount = messages.filter((m) => m.circle_id === cid).length;
    const memberCount = members.filter((m) => m.circle_id === cid).length;
    const engagement = memberCount > 0 ? msgCount / memberCount : 0;
    return { circle_id: cid, score: engagement, messages: msgCount, members: memberCount };
  });

  scores.sort((a, b) => b.score - a.score);

  return scores.map((s, idx) => ({
    circle_name: `Círculo ${s.circle_id.slice(0, 6)}`,
    rank: idx + 1,
    total_circles: scores.length,
    engagement_score: Math.round(s.score * 100),
    percentile: Math.round(((scores.length - idx) / scores.length) * 100),
  }));
}

export async function checkSocialNotifications(
  userId: string
): Promise<SocialNotification[]> {
  const [pressure, proof] = await Promise.all([
    getSocialPressure(userId),
    getSocialProof(userId),
  ]);

  const notifications: SocialNotification[] = [];

  for (const item of pressure.slice(0, 3)) {
    if (item.newPosts > 0) {
      notifications.push({
        id: `missed-${item.circleName}`,
        type: 'missed_posts',
        title: `${item.circleName} tiene ${item.newPosts} posts nuevos`,
        body: `No te han visto en ${item.daysInactive} días. ¡Únete a la conversación!`,
        circle_name: item.circleName,
        created_at: new Date().toISOString(),
      });
    }
  }

  if (proof.activeToday > 0) {
    notifications.push({
      id: 'active-today',
      type: 'ranking_boost',
      title: `${proof.activeToday} mujeres activas hoy`,
      body: `Tu círculo está en el top ${proof.topPercentile}%. ¡No te quedes atrás!`,
      circle_name: '',
      created_at: new Date().toISOString(),
    });
  }

  return notifications;
}

export async function getCircleRanking(userId: string): Promise<CircleRanking[]> {
  const memberships = await getUserCircles(userId);
  const circleIds = memberships.map((m) => m.circle_id);
  return getCircularRankings(circleIds);
}
