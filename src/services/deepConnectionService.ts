import { supabase } from '../config/supabase';

export interface WisdomEntry {
  id: string;
  text: string;
  phase: string;
  category: string;
}

export interface MentorMatch {
  id: string;
  name: string;
  challenge_overcome: string;
  advice: string;
  phase: string;
}

export interface GrowthReflection {
  days_logged: number;
  mood_improved: boolean;
  actions_completed: number;
  women_connected: number;
  growth_pct: number;
  prev_month_comparison: string;
}

export interface CommunityImpact {
  posts_helped_count: number;
  circle_rank: string;
  impact_message: string;
  rank_percentile: number;
}

export interface LifeExpander {
  id: string;
  type: 'talk' | 'book' | 'podcast' | 'workshop';
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
}

const ANONYMOUS_WISDOMS_ES: WisdomEntry[] = [
  { id: 'w1', text: 'Aprender a decir no cambió mi vida', phase: 'follicular', category: 'boundaries' },
  { id: 'w2', text: 'Mi ciclo me enseñó a escuchar mi cuerpo', phase: 'menstrual', category: 'self-awareness' },
  { id: 'w3', text: 'Invertir en mí misma fue lo mejor que hice', phase: 'ovulatory', category: 'growth' },
  { id: 'w4', text: 'El dinero no tiene género, pero sí tiene historia', phase: 'luteal', category: 'finance' },
  { id: 'w5', text: 'Poder decir "no" es un acto de amor propio', phase: 'menstrual', category: 'boundaries' },
  { id: 'w6', text: 'Mi primer reto fue el más difícil, pero me transformó', phase: 'follicular', category: 'growth' },
  { id: 'w7', text: 'Conectar con otras mujeres me hizo más fuerte', phase: 'ovulatory', category: 'social' },
  { id: 'w8', text: 'Cada fase de mi ciclo trae un regalo diferente', phase: 'menstrual', category: 'self-awareness' },
  { id: 'w9', text: 'Dejé de compararme con otros y empecé a brillar', phase: 'luteal', category: 'growth' },
  { id: 'w10', text: 'Mi cuerpo habla, y ahora yo escucho', phase: 'follicular', category: 'self-awareness' },
];

const ANONYMOUS_WISDOMS_EN: WisdomEntry[] = [
  { id: 'w1', text: 'Learning to say no changed my life', phase: 'follicular', category: 'boundaries' },
  { id: 'w2', text: 'My cycle taught me to listen to my body', phase: 'menstrual', category: 'self-awareness' },
  { id: 'w3', text: 'Investing in myself was the best thing I ever did', phase: 'ovulatory', category: 'growth' },
  { id: 'w4', text: 'Money has no gender, but it has a story', phase: 'luteal', category: 'finance' },
  { id: 'w5', text: 'Being able to say "no" is an act of self-love', phase: 'menstrual', category: 'boundaries' },
  { id: 'w6', text: 'My first challenge was the hardest, but it transformed me', phase: 'follicular', category: 'growth' },
  { id: 'w7', text: 'Connecting with other women made me stronger', phase: 'ovulatory', category: 'social' },
  { id: 'w8', text: 'Every phase of my cycle brings a different gift', phase: 'menstrual', category: 'self-awareness' },
  { id: 'w9', text: 'I stopped comparing myself to others and started shining', phase: 'luteal', category: 'growth' },
  { id: 'w10', text: 'My body speaks, and now I listen', phase: 'follicular', category: 'self-awareness' },
];

const LIFE_EXPANDERS_EN: LifeExpander[] = [
  { id: 'e1', type: 'talk', title: 'The Power of Vulnerability', description: 'Brené Brown shares the gifts of vulnerability.', url: 'https://www.ted.com/talks/brene_brown_the_power_of_vulnerability' },
  { id: 'e2', type: 'book', title: 'Untamed', description: 'Glennon Doyle on living authentically.', url: 'https://glennondoyle.com/untamed' },
  { id: 'e3', type: 'podcast', title: 'How I Built This', description: 'Stories behind the world\'s best-known companies.', url: 'https://www.npr.org/podcasts/510313/how-i-built-this' },
  { id: 'e4', type: 'workshop', title: 'Ciclo & Productividad', description: 'Taller virtual: tu ciclo como herramienta de productividad.', url: '#' },
];

const LIFE_EXPANDERS_ES: LifeExpander[] = [
  { id: 'e1', type: 'talk', title: 'El poder de la vulnerabilidad', description: 'Brené Brown comparte los dones de la vulnerabilidad.', url: 'https://www.ted.com/talks/brene_brown_the_power_of_vulnerability' },
  { id: 'e2', type: 'book', title: 'Indomable', description: 'Glennon Doyle sobre vivir auténticamente.', url: 'https://glennondoyle.com/untamed' },
  { id: 'e3', type: 'podcast', title: 'Cómo lo Construí', description: 'Historias detrás de las empresas más conocidas del mundo.', url: 'https://www.npr.org/podcasts/510313/how-i-built-this' },
  { id: 'e4', type: 'workshop', title: 'Ciclo & Productividad', description: 'Taller virtual: tu ciclo como herramienta de productividad.', url: '#' },
];

export async function getWisdomExchange(userId: string): Promise<WisdomEntry[]> {
  try {
    const { data, error } = await supabase
      .from('yayika_community_posts')
      .select('id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) {
      return ANONYMOUS_WISDOMS_ES;
    }

    return data.map((row: any) => ({
      id: row.id,
      text: row.content,
      phase: 'any',
      category: 'general',
    }));
  } catch {
    return ANONYMOUS_WISDOMS_ES;
  }
}

export async function getWisdomExchangeLocalized(
  userId: string,
  lang: string
): Promise<WisdomEntry[]> {
  try {
    const { data, error } = await supabase
      .from('yayika_community_posts')
      .select('id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) {
      return lang === 'en' ? ANONYMOUS_WISDOMS_EN : ANONYMOUS_WISDOMS_ES;
    }

    return data.map((row: any) => ({
      id: row.id,
      text: row.content,
      phase: 'any',
      category: 'general',
    }));
  } catch {
    return lang === 'en' ? ANONYMOUS_WISDOMS_EN : ANONYMOUS_WISDOMS_ES;
  }
}

export async function getMentorMatch(userId: string): Promise<MentorMatch | null> {
  try {
    const { data: profile } = await supabase
      .from('yayika_profiles')
      .select('id, full_name')
      .eq('id', userId)
      .single();

    if (!profile) return null;

    const { data: challenges } = await supabase
      .from('yayika_community_posts')
      .select('id, content, title')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!challenges || challenges.length === 0) return null;

    const randomIdx = Math.floor(Math.random() * challenges.length);
    const match = challenges[randomIdx];

    return {
      id: match.id,
      name: 'Una guerrera',
      challenge_overcome: match.title || 'superó un reto',
      advice: match.content,
      phase: 'follicular',
    };
  } catch {
    return null;
  }
}

export async function getGrowthReflection(userId: string): Promise<GrowthReflection> {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [currentMonthData, prevMonthData] = await Promise.allSettled([
      supabase
        .from('yayika_community_posts')
        .select('id, created_at, reaction_count', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', monthStart),
      supabase
        .from('yayika_community_posts')
        .select('id, created_at, reaction_count', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', prevMonthStart)
        .lt('created_at', prevMonthEnd),
    ]);

    const currentPosts = currentMonthData.status === 'fulfilled' ? (currentMonthData.value.data || []) : [];
    const prevPosts = prevMonthData.status === 'fulfilled' ? (prevMonthData.value.data || []) : [];

    const daysLogged = currentPosts.length;
    const prevDaysLogged = prevPosts.length || 1;

    const growthPct = prevDaysLogged > 0
      ? Math.round(((daysLogged - prevDaysLogged) / prevDaysLogged) * 100)
      : daysLogged > 0 ? 100 : 0;

    return {
      days_logged: daysLogged,
      mood_improved: daysLogged > prevDaysLogged,
      actions_completed: daysLogged * 2,
      women_connected: Math.min(currentPosts.reduce((sum: number, p: any) => sum + (p.reaction_count || 0), 0), 50),
      growth_pct: Math.max(0, growthPct),
      prev_month_comparison: prevDaysLogged > 0
        ? `${daysLogged > prevDaysLogged ? '+' : ''}${Math.round(((daysLogged - prevDaysLogged) / prevDaysLogged) * 100)}%`
        : '+100%',
    };
  } catch {
    return {
      days_logged: 0,
      mood_improved: false,
      actions_completed: 0,
      women_connected: 0,
      growth_pct: 0,
      prev_month_comparison: '+0%',
    };
  }
}

export async function getCommunityImpact(userId: string): Promise<CommunityImpact> {
  try {
    const { data: posts } = await supabase
      .from('yayika_community_posts')
      .select('id, reaction_count, comment_count')
      .eq('user_id', userId);

    const totalHelped = (posts || []).reduce(
      (sum: number, p: any) => sum + (p.reaction_count || 0) + (p.comment_count || 0),
      0
    );

    const { count: totalWomen } = await supabase
      .from('yayika_community_posts')
      .select('id', { count: 'exact', head: true });

    const { count: activeCircles } = await supabase
      .from('yayika_circle_members')
      .select('id', { count: 'exact', head: true });

    const rankPercentile = totalWomen && totalWomen > 0
      ? Math.min(99, Math.round((totalHelped / Math.max(totalWomen, 1)) * 100 * 10))
      : 50;

    let impactMessage: string;
    if (totalHelped >= 10) {
      impactMessage = `Tu posts ayudaron a ${totalHelped} mujeres`;
    } else if (totalHelped >= 5) {
      impactMessage = `${totalHelped} mujeres se inspiraron en ti`;
    } else {
      impactMessage = 'Tu voz está empezando a resonar';
    }

    return {
      posts_helped_count: totalHelped,
      circle_rank: `Top ${rankPercentile}%`,
      impact_message: impactMessage,
      rank_percentile: rankPercentile,
    };
  } catch {
    return {
      posts_helped_count: 0,
      circle_rank: '',
      impact_message: 'Tu voz está empezando a resonar',
      rank_percentile: 50,
    };
  }
}

export function getLifeExpanders(lang: string = 'es'): LifeExpander[] {
  return lang === 'en' ? LIFE_EXPANDERS_EN : LIFE_EXPANDERS_ES;
}

export function getWisdomsByPhase(phase: string, lang: string = 'es'): WisdomEntry[] {
  const wisdoms = lang === 'en' ? ANONYMOUS_WISDOMS_EN : ANONYMOUS_WISDOMS_ES;
  const filtered = wisdoms.filter(w => w.phase === phase || w.phase === 'any');
  return filtered.length > 0 ? filtered : wisdoms;
}

export function getRandomWisdom(lang: string = 'es'): WisdomEntry {
  const wisdoms = lang === 'en' ? ANONYMOUS_WISDOMS_EN : ANONYMOUS_WISDOMS_ES;
  return wisdoms[Math.floor(Math.random() * wisdoms.length)];
}
