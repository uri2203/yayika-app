import { CyclePhase } from './dailyActionService';

interface DesireContent {
  titleKey: string;
  messageKey: string;
  icon: string;
}

interface SensualTip {
  tipKey: string;
  icon: string;
}

const DESIRE_MESSAGES: Record<CyclePhase, DesireContent> = {
  menstrual: {
    titleKey: 'desire_title',
    messageKey: 'desire_msg_menstrual',
    icon: 'heart',
  },
  follicular: {
    titleKey: 'desire_title',
    messageKey: 'desire_msg_follicular',
    icon: 'sunny',
  },
  ovulatory: {
    titleKey: 'desire_title',
    messageKey: 'desire_msg_ovulatory',
    icon: 'flash',
  },
  luteal: {
    titleKey: 'desire_title',
    messageKey: 'desire_msg_luteal',
    icon: 'moon',
  },
  unknown: {
    titleKey: 'desire_title',
    messageKey: 'desire_msg_unknown',
    icon: 'star',
  },
};

const SENSUAL_TIPS: SensualTip[] = [
  { tipKey: 'desire_sensual_tip', icon: 'water' },
  { tipKey: 'desire_sensual_tip', icon: 'hand-left' },
  { tipKey: 'desire_sensual_tip', icon: 'shirt' },
];

const TIP_DETAIL_KEY: Record<string, string> = {
  water: 'desire_sensual_tip_water',
  'hand-left': 'desire_sensual_tip_hand',
  shirt: 'desire_sensual_tip_shirt',
};

const EMPOWERMENT_QUOTES = [
  { textKey: 'desire_quote_1', authorKey: 'desire_author_empoderada' },
  { textKey: 'desire_quote_2', authorKey: 'desire_author_guerrera' },
  { textKey: 'desire_quote_3', authorKey: 'desire_author_consciente' },
  { textKey: 'desire_quote_4', authorKey: 'desire_author_lider' },
  { textKey: 'desire_quote_5', authorKey: 'desire_author_libre' },
  { textKey: 'desire_quote_6', authorKey: 'desire_author_guerrera' },
  { textKey: 'desire_quote_7', authorKey: 'desire_author_empoderada' },
  { textKey: 'desire_quote_8', authorKey: 'desire_author_intuitiva' },
];

const BODY_LOVE_KEYS: Record<CyclePhase, string> = {
  menstrual: 'desire_body_msg_menstrual',
  follicular: 'desire_body_msg_follicular',
  ovulatory: 'desire_body_msg_ovulatory',
  luteal: 'desire_body_msg_luteal',
  unknown: 'desire_body_msg_unknown',
};

const SENSUAL_TIP_DETAILS: Record<string, Record<string, string>> = {
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

function getTodayIndex(): number {
  const now = new Date();
  return (now.getFullYear() * 366 + now.getMonth() * 31 + now.getDate()) % EMPOWERMENT_QUOTES.length;
}

export function getDailyDesireContent(cyclePhase: CyclePhase): DesireContent {
  const content = DESIRE_MESSAGES[cyclePhase] || DESIRE_MESSAGES.unknown;
  return { ...content };
}

export function getSensualTip(
  cyclePhase: CyclePhase,
  lang: string
): SensualTip & { detail: string } {
  const tipIndex = (getTodayIndex() + (cyclePhase === 'ovulatory' ? 1 : cyclePhase === 'luteal' ? 2 : 0)) % SENSUAL_TIPS.length;
  const tip = SENSUAL_TIPS[tipIndex];
  const detailKey = TIP_DETAIL_KEY[tip.icon];
  const detail =
    (SENSUAL_TIP_DETAILS[lang] && SENSUAL_TIP_DETAILS[lang][detailKey]) ||
    SENSUAL_TIP_DETAILS.es[detailKey] ||
    tip.tipKey;
  return { ...tip, detail };
}

export function getEmpowermentQuote(): { textKey: string; authorKey: string } {
  return EMPOWERMENT_QUOTES[getTodayIndex()];
}

export function getBodyLoveMessage(cyclePhase: CyclePhase): string {
  return BODY_LOVE_KEYS[cyclePhase] || BODY_LOVE_KEYS.unknown;
}
