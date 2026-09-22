export type CelebrationType =
  | 'log_cycle'
  | 'streak_3'
  | 'streak_7'
  | 'first_chat'
  | 'daily_action'
  | 'badge_earned'
  | 'mood_check'
  | 'circle_join'
  | 'profile_complete';

interface Celebration {
  icon: string;
  messageKey: string;
  message: string;
  xp: number;
  color: string;
}

interface MicroJoy {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
}

const CELEBRATIONS: Record<CelebrationType, Celebration> = {
  log_cycle: {
    icon: 'confetti',
    messageKey: 'celebration_congrats',
    message: '¡Tu ciclo registrado!',
    xp: 15,
    color: '#10B981',
  },
  streak_3: {
    icon: 'flame',
    messageKey: 'celebration_great',
    message: '3 días seguidos',
    xp: 25,
    color: '#F59E0B',
  },
  streak_7: {
    icon: 'medal',
    messageKey: 'celebration_amazing',
    message: '¡Semana completa! Eres increíble',
    xp: 50,
    color: '#8B5CF6',
  },
  first_chat: {
    icon: 'heart',
    messageKey: 'celebration_keep',
    message: 'Tu primer chat con Laura',
    xp: 10,
    color: '#EC4899',
  },
  daily_action: {
    icon: 'star',
    messageKey: 'celebration_great',
    message: 'Acción del día completada',
    xp: 20,
    color: '#3B82F6',
  },
  badge_earned: {
    icon: 'trophy',
    messageKey: 'celebration_amazing',
    message: 'Nuevo badge desbloqueado',
    xp: 30,
    color: '#D4A843',
  },
  mood_check: {
    icon: 'rainbow',
    messageKey: 'celebration_keep',
    message: 'Gracias por compartir cómo te sientes',
    xp: 10,
    color: '#06B6D4',
  },
  circle_join: {
    icon: 'people',
    messageKey: 'celebration_congrats',
    message: '¡Bienvenida al círculo!',
    xp: 15,
    color: '#8B5CF6',
  },
  profile_complete: {
    icon: 'sparkles',
    messageKey: 'celebration_great',
    message: 'Tu perfil está completo',
    xp: 20,
    color: '#D4A843',
  },
};

const MICRO_JOYS: MicroJoy[] = [
  {
    title: 'Dato inspirador',
    subtitle: 'Las mujeres representan el 47% de la fuerza laboral mundial. ¡Sigues creciendo!',
    icon: 'globe',
    color: '#3B82F6',
  },
  {
    title: 'Compliment del día',
    subtitle: 'Hoy te ves increíble (según tu energía). Sigue así, guerrera.',
    icon: 'heart',
    color: '#EC4899',
  },
  {
    title: 'Dato de tu ciclo',
    subtitle: 'Las mujeres ovulan con un olor naturalmente más dulce. Tu cuerpo es sabio.',
    icon: 'flower',
    color: '#8B5CF6',
  },
  {
    title: 'Recordatorio',
    subtitle: 'No necesitas ser perfecta. Solo necesitas ser tú.',
    icon: 'sparkles',
    color: '#D4A843',
  },
  {
    title: 'Dato de la naturaleza',
    subtitle: 'Las flores no compiten con las de al lado. Florecen a su propio ritmo.',
    icon: 'leaf',
    color: '#10B981',
  },
  {
    title: 'Frase para ti',
    subtitle: 'Tu ciclo no es tu enemigo. Es tu calendario más honesto.',
    icon: 'moon',
    color: '#6366F1',
  },
  {
    title: 'Dato empoderante',
    subtitle: 'Las mujeres que practican gratitud reportan 25% más de felicidad.',
    icon: 'heart-circle',
    color: '#F59E0B',
  },
  {
    title: 'Dato del día',
    subtitle: 'Tu cerebro femenino es naturalmente más empático. Eso es un superpoder.',
    icon: 'bulb',
    color: '#06B6D4',
  },
];

function getTodayJoyIndex(): number {
  const now = new Date();
  return (now.getFullYear() * 366 + now.getMonth() * 31 + now.getDate()) % MICRO_JOYS.length;
}

export function getCelebration(type: CelebrationType): Celebration {
  return CELEBRATIONS[type];
}

export function getConfettiCount(type: CelebrationType): number {
  const counts: Record<CelebrationType, number> = {
    log_cycle: 15,
    streak_3: 20,
    streak_7: 30,
    first_chat: 15,
    daily_action: 15,
    badge_earned: 25,
    mood_check: 10,
    circle_join: 15,
    profile_complete: 20,
  };
  return counts[type];
}

export function getCELEBRATIONMessage(type: CelebrationType): string {
  return CELEBRATIONS[type].message;
}

export function getRandomJoy(): MicroJoy {
  const randomIndex = Math.floor(Math.random() * MICRO_JOYS.length);
  return MICRO_JOYS[randomIndex];
}

export function getDailyJoy(): MicroJoy {
  return MICRO_JOYS[getTodayJoyIndex()];
}
