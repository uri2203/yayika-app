import { CyclePhase } from './dailyActionService';

interface DesireContent {
  titleKey: string;
  message: string;
  icon: string;
}

interface SensualTip {
  tipKey: string;
  icon: string;
}

const DESIRE_MESSAGES: Record<CyclePhase, DesireContent> = {
  menstrual: {
    titleKey: 'desire_title',
    message: 'Tu cuerpo se está renovando. Honra su ritmo.',
    icon: 'heart',
  },
  follicular: {
    titleKey: 'desire_title',
    message: 'Tu energía sube — es tu momento de brillar.',
    icon: 'sunny',
  },
  ovulatory: {
    titleKey: 'desire_title',
    message: 'Hoy tu magnetismo está en su punto máximo.',
    icon: 'flash',
  },
  luteal: {
    titleKey: 'desire_title',
    message: 'Tu profundidad emocional es tu superpoder.',
    icon: 'moon',
  },
  unknown: {
    titleKey: 'desire_title',
    message: 'Eres única y tu cuerpo lo sabe. Confía en ti.',
    icon: 'star',
  },
};

const SENSUAL_TIPS: SensualTip[] = [
  { tipKey: 'desire_sensual_tip', icon: 'water' },
  { tipKey: 'desire_sensual_tip', icon: 'hand-left' },
  { tipKey: 'desire_sensual_tip', icon: 'shirt' },
];

const EMPOWERMENT_QUOTES = [
  { text: '"No me da miedo crecer. Lo que me da miedo es quedarme estancada."', author: 'Mujer empoderada' },
  { text: '"Mi valor no depende de lo que otros piensen de mí."', author: 'Guerrera Yayika' },
  { text: '"Soy suficiente tal como soy, y merezco todo lo bueno."', author: 'Mujer consciente' },
  { text: '"Mi voz importa. Mis decisiones importan. Yo importo."', author: 'Líder femenina' },
  { text: '"Cada día me elijo a mí misma. Eso es revolucionario."', author: 'Mujer libre' },
  { text: '"Mi cuerpo es mi hogar, y lo trato con amor."', author: 'Guerrera Yayika' },
  { text: '"No necesito permiso para brillar."', author: 'Mujer empoderada' },
  { text: '"Mi ciclo es mi calendario. Mi intuición es mi brújula."', author: 'Mujer intuitiva' },
];

const BODY_LOVE_MESSAGES: Record<CyclePhase, string> = {
  menstrual: 'Tu cuerpo se está renovando. Cada célula te ama. Permítete descansar sin culpa — estás haciendo un trabajo increíble.',
  follicular: 'Tu energía crece como las flores en primavera. Tu cuerpo está listo para nuevas aventuras. Confía en su fuerza.',
  ovulatory: 'Brillas con luz propia. Tu cuerpo es poderoso, fuerte y magnético. Aprovéchalo hoy.',
  luteal: 'Tu cuerpo te está pidiendo cuidado. Honra sus señales — eso es amor propio en acción.',
  unknown: 'Eres una obra maestra en progreso. Tu cuerpo merece tu amor cada día, sin condiciones.',
};

const SENSUAL_TIP_DETAILS: Record<string, string> = {
  es: {
    'desire_sensual_tip_water': 'Date un baño con sales y aceites esenciales. Siente cómo el agua abraza tu piel.',
    'desire_sensual_tip_hand': 'Masaje en las manos con crema perfumada. Tus manos merecen ser cuidadas.',
    'desire_sensual_tip_shirt': 'Vístete bonita aunque no salgas — para ti. Porque te lo mereces.',
  },
  en: {
    'desire_sensual_tip_water': 'Take a bath with salts and essential oils. Feel how the water embraces your skin.',
    'desire_sensual_tip_hand': 'Massage your hands with scented cream. Your hands deserve to be cared for.',
    'desire_sensual_tip_shirt': 'Dress up even if you don\'t go out — for you. Because you deserve it.',
  },
  pt: {
    'desire_sensual_tip_water': 'Tome um banho com sais e óleos essenciais. Sinta como a água abraça sua pele.',
    'desire_sensual_tip_hand': 'Massagem nas mãos com creme perfumado. Suas mãos merecem ser cuidadas.',
    'desire_sensual_tip_shirt': 'Vista-se bonita mesmo sem sair — para você. Porque você merece.',
  },
  fr: {
    'desire_sensual_tip_water': 'Prends un bain avec des sels et des huiles essentielles. Sens comment l\'eau enveloppe ta peau.',
    'desire_sensual_tip_hand': 'Massage tes mains avec une crème parfumée. Tes mains méritent d\'être choyées.',
    'desire_sensual_tip_shirt': 'Habille-toi jolie même si tu ne sors pas — pour toi. Parce que tu le mérites.',
  },
  de: {
    'desire_sensual_tip_water': 'Nimm ein Bad mit Salz und ätherischen Ölen. Fühle, wie dir das Wasser die Haut umhüllt.',
    'desire_sensual_tip_hand': 'Massage deine Hände mit parfümierter Creme. Deine Hände verdienen es, gepflegt zu werden.',
    'desire_sensual_tip_shirt': 'Zieh dich schön an, auch wenn du nicht rausgehst — für dich. Weil du es verdienst.',
  },
};

function getPhaseKey(phase: CyclePhase): string {
  const map: Record<CyclePhase, string> = {
    menstrual: 'water',
    follicular: 'sunny',
    ovulatory: 'flash',
    luteal: 'moon',
    unknown: 'star',
  };
  return map[phase] || 'star';
}

function getTodayIndex(): number {
  const now = new Date();
  return (now.getFullYear() * 366 + now.getMonth() * 31 + now.getDate()) % EMPOWERMENT_QUOTES.length;
}

export function getDailyDesireContent(cyclePhase: CyclePhase): DesireContent {
  const content = DESIRE_MESSAGES[cyclePhase] || DESIRE_MESSAGES.unknown;
  return {
    ...content,
    message: content.message,
  };
}

export function getSensualTip(cyclePhase: CyclePhase): SensualTip & { detail: string } {
  const tipIndex = (getTodayIndex() + (cyclePhase === 'ovulatory' ? 1 : cyclePhase === 'luteal' ? 2 : 0)) % SENSUAL_TIPS.length;
  const tip = SENSUAL_TIPS[tipIndex];
  const iconKey = tip.icon;
  const detail = (SENSUAL_TIP_DETAILS as any)[`desire_sensual_tip_${iconKey}`] || tip.tipKey;
  return { ...tip, detail };
}

export function getEmpowermentQuote(): { text: string; author: string } {
  return EMPOWERMENT_QUOTES[getTodayIndex()];
}

export function getBodyLoveMessage(cyclePhase: CyclePhase): string {
  return BODY_LOVE_MESSAGES[cyclePhase] || BODY_LOVE_MESSAGES.unknown;
}
