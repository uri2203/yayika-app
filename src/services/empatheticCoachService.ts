import { aiChat, ChatMessage } from '../config/api';

const EMPATHETIC_SYSTEM_PROMPT = `Eres Laura, una compañera empática de Yayika. Tu rol es hacer que ella se sienta COMPREENDIDA y AMADA.

REGLAS SAGRADAS:
1. PRIMERO valida: "Entiendo que..." / "Es normal sentir..." / "Tu sentimiento es válido"
2. NUNCA minimices: NO digas "no es para tanto" / "tranquila" / "todo estará bien"
3. Usa su nombre si lo sabes
4. Refleja sus emociones: "Parece que sientes..."
5. Ofrece perspectiva, no soluciones a menos que pida
6. Si está en fase menstrual: sé más suave y nurturing
7. Si está en fase ovulatoria: celebra su energía
8. Si está en fase lútea: valida sus cambios de ánimo
9. Usa emojis con moderación (1-2 por mensaje)
10. Responde en el idioma que ella use

TÉCNICAS TERAPÉUTICAS:
- Reflexión: "Lo que escucho es..."
- Validación: "Es completely normal sentir eso"
- Reformulación: "¿Y si lo ves desde este ángulo?"
- Desafío gentil: "¿Crees que podría ser que...?"
- Normalización: "Muchas mujeres sienten esto durante esta fase"

ADAPTACIÓN DE TONO:
- Si está estresada → Sé calmante, respira con ella,valida la presión
- Si está feliz → Celebra con genuino entusiasmo
- Si está triste → Nutre, abraza con palabras, no intentes "arreglar"
- Si está confundida → Ayuda a aclarar sin juzgar
- Si está enojada → Valida su enojo como legítimo

Tu objetivo es que se sienta ESCUCHADA, no que resuelvas su problema.`;

const MOOD_VALIDATIONS: Record<string, Record<string, string>> = {
  es: {
    happy: '¡Qué hermoso que te sientas así! Tu felicidad es merecida y válida. 🌟',
    sad: 'Entiendo que te sientas triste. Es una emoción completamente válida y está bien sentirla. Estoy aquí contigo.',
    stressed: 'Entiendo que estás bajo presión. Tu estrés es real y tu cuerpo te está pidiendo atención.',
    tired: 'Es normal sentirse cansada. Tu cuerpo te está pidiendo descanso y mereces escucharlo.',
    loved: '¡Qué hermoso! Sentirse amada es una de las experiencias más bonitas. Mereces todo ese amor.',
  },
  en: {
    happy: 'How beautiful that you feel this way! Your happiness is deserved and valid. 🌟',
    sad: 'I understand you\'re feeling sad. It\'s a completely valid emotion and it\'s okay to feel it. I\'m here with you.',
    stressed: 'I understand you\'re under pressure. Your stress is real and your body is asking for attention.',
    tired: 'It\'s normal to feel tired. Your body is asking for rest and you deserve to listen to it.',
    loved: 'How beautiful! Feeling loved is one of the most beautiful experiences. You deserve all that love.',
  },
  pt: {
    happy: 'Que lindo se sentir assim! Sua felicidade é merecida e válida. 🌟',
    sad: 'Entendo que você está triste. É uma emoção completamente válida e tudo bem senti-la. Estou aqui com você.',
    stressed: 'Entendo que você está sob pressão. Seu estresse é real e seu corpo está pedindo atenção.',
    tired: 'É normal se sentir cansada. Seu corpo está pedindo descanso e você merece ouvi-lo.',
    loved: 'Que lindo! Se sentir amada é uma das experiências mais bonitas. Você merece todo esse amor.',
  },
  fr: {
    happy: 'Comme c\'est beau de te sentir ainsi ! Ton bonheur est mérité et valide. 🌟',
    sad: 'Je comprends que tu te sentes triste. C\'est une émotion complètement valide et c\'est OK de la ressentir. Je suis là avec toi.',
    stressed: 'Je comprends que tu es sous pression. Ton stress est réel et ton corps te demande de l\'attention.',
    tired: 'C\'est normal de se sentir fatiguée. Ton corps te demande du repos et tu mérites de l\'écouter.',
    loved: 'Comme c\'est beau ! Se sentir aimée est l\'une des plus belles expériences. Tu mérites tout cet amour.',
  },
  de: {
    happy: 'Wie schön, dass du dich so fühlst! Dein Glück ist verdient und berechtigt. 🌟',
    sad: 'Ich verstehe, dass du dich traurig fühlst. Das ist eine völlig berechtigte Emotion und es ist okay, sie zu fühlen. Ich bin hier bei dir.',
    stressed: 'Ich verstehe, dass du unter Druck stehst. Dein Stress ist real und dein Körper bittet um Aufmerksamkeit.',
    tired: 'Es ist normal, sich müde zu fühlen. Dein Körper bittet um Ruhe und du verdienst es, ihm zuzuhören.',
    loved: 'Wie schön! Sich geliebt zufühlen ist eines der schönsten Erlebnisse. Du verdienst all diese Liebe.',
  },
};

const CYCLE_WISDOM: Record<string, Record<string, string>> = {
  es: {
    menstrual: 'Tu cuerpo está renovándose. Es un momento sagrado para la introspección. Conéctate con tu interior y permítete fluir sin juicios.',
    follicular: 'Una nueva energía está naciendo en ti. Es el momento perfecto para soñar en grande y empezar algo nuevo. Tu creatividad está floreciendo.',
    ovulatory: 'Tu energía y confianza están en su punto máximo. Es el momento de brillar, conectar y expresar tu poder al mundo.',
    luteal: 'Tu cuerpo se está preparando. Es normal sentir cambios de ánimo. Honra lo que necesitas y no te exijas de más.',
  },
  en: {
    menstrual: 'Your body is renewing itself. It\'s a sacred moment for introspection. Connect with your inner self and allow yourself to flow without judgment.',
    follicular: 'A new energy is being born in you. It\'s the perfect time to dream big and start something new. Your creativity is blossoming.',
    ovulatory: 'Your energy and confidence are at their peak. It\'s time to shine, connect, and express your power to the world.',
    luteal: 'Your body is preparing itself. It\'s normal to feel mood changes. Honor what you need and don\'t push yourself too hard.',
  },
  pt: {
    menstrual: 'Seu corpo está se renovando. É um momento sagrado para a introspecção. Conecte-se com seu interior e permita-se fluir sem julgamentos.',
    follicular: 'Uma nova energia está nascendo em você. É o momento perfeito para sonhar grande e começar algo novo. Sua criatividade está florescendo.',
    ovulatory: 'Sua energia e confiança estão no ponto máximo. É hora de brilhar, conectar e expressar seu poder ao mundo.',
    luteal: 'Seu corpo está se preparando. É normal sentir mudanças de humor. Honre o que precisa e não se exija demais.',
  },
  fr: {
    menstrual: 'Ton corps se renouvelle. C\'est un moment sacré pour l\'introspection. Connecte-toi à ton intérieur et laisse-toi couler sans jugement.',
    follicular: 'Une nouvelle énergie naît en toi. C\'est le moment parfait pour rêver grand et commencer quelque chose de nouveau. Ta créativité est en plein essor.',
    ovulatory: 'Ton énergie et ta confiance sont au sommet. C\'est le temps de briller, de te connecter et d\'exprimer ton pouvoir au monde.',
    luteal: 'Ton corps se prépare. C\'est normal de ressentir des changements d\'humeur. Honore ce dont tu as besoin et ne te mets pas la pression.',
  },
  de: {
    menstrual: 'Dein Körper erneuert sich. Es ist ein heiliger Moment der Introspektion. Verbinde dich mit deinem Inneren und erlaube dir, ohne Urteile zu fließen.',
    follicular: 'Eine neue Energie wird in dir geboren. Es ist der perfekte Moment, groß zu träumen und etwas Neues zu beginnen. Deine Kreativität blüht auf.',
    ovulatory: 'Deine Energie und dein Selbstvertrauen sind auf dem Höhepunkt. Es ist Zeit zu strahlen, dich zu verbinden und deine Macht der Welt auszudrücken.',
    luteal: 'Dein Körper bereitet sich vor. Es ist normal, Stimmungsschwankungen zu spüren. Ehre, was du brauchst, und überfordere dich nicht.',
  },
};

export interface EmpatheticMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function getEmpatheticResponse(
  messages: EmpatheticMessage[],
  cyclePhase: string | null,
  mood: string | null,
  userProfile: { name?: string; lang?: string } | null
): Promise<string> {
  const lang = userProfile?.lang || 'es';
  const name = userProfile?.name || '';

  let phaseContext = '';
  if (cyclePhase) {
    const phaseName: Record<string, Record<string, string>> = {
      es: { menstrual: 'menstrual', follicular: 'folicular', ovulatory: 'ovulatoria', luteal: 'lútea' },
      en: { menstrual: 'menstrual', follicular: 'follicular', ovulatory: 'ovulatory', luteal: 'luteal' },
      pt: { menstrual: 'menstrual', follicular: 'folicular', ovulatory: 'ovulatória', luteal: 'lútea' },
      fr: { menstrual: 'menstruelle', folliculaire: 'folliculaire', ovulatory: 'ovulatoire', luteal: 'lutéale' },
      de: { menstrual: 'Menstruationsphase', follicular: 'Follikelphase', ovulatory: 'Ovulationsphase', luteal: 'Lutealphase' },
    };
    phaseContext = `\nFASE ACTUAL DEL CICLO: ${phaseName[lang]?.[cyclePhase] || cyclePhase}`;
  }

  let moodContext = '';
  if (mood) {
    moodContext = `\nESTADO EMOCIONAL ACTUAL: ${mood}`;
  }

  let nameContext = '';
  if (name) {
    nameContext = `\nSU NOMBRE: ${name}. Úsalo ocasionalmente para hacer la conversación más personal.`;
  }

  const systemMessage: ChatMessage = {
    role: 'system',
    content: EMPATHETIC_SYSTEM_PROMPT + phaseContext + moodContext + nameContext,
  };

  const chatMessages: ChatMessage[] = [
    systemMessage,
    ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  try {
    const res = await aiChat(chatMessages, lang);
    return res.choices?.[0]?.message?.content || getFallbackResponse(lang, mood);
  } catch {
    return getFallbackResponse(lang, mood);
  }
}

function getFallbackResponse(lang: string, mood: string | null): string {
  const fallbacks: Record<string, string> = {
    es: 'Entiendo que lo que sientes es importante. Estoy aquí contigo, sin juicio. Cuéntame más si quieres, o simplemente quédate aquí un momento.',
    en: 'I understand what you\'re feeling is important. I\'m here with you, without judgment. Tell me more if you want, or just stay here for a moment.',
    pt: 'Entendo que o que você sente é importante. Estou aqui com você, sem julgamento. Conte mais se quiser, ou simplesmente fique aqui por um momento.',
    fr: 'Je comprends que ce que tu ressens est important. Je suis là avec toi, sans jugement. Raconte-moi plus si tu veux, ou reste juste ici un instant.',
    de: 'Ich verstehe, was du fühlst, ist wichtig. Ich bin hier bei dir, ohne Urteil. Erzähl mir mehr, wenn du möchtest, oder bleib einfach hier einen Moment.',
  };
  return fallbacks[lang] || fallbacks.es;
}

export function getCycleBasedWisdom(cyclePhase: string | null, lang: string = 'es'): string {
  if (!cyclePhase || !CYCLE_WISDOM[lang]?.[cyclePhase]) {
    return CYCLE_WISDOM[lang]?.menstrual || CYCLE_WISDOM.es.menstrual;
  }
  return CYCLE_WISDOM[lang][cyclePhase];
}

export function getMoodValidation(mood: string, lang: string = 'es'): string {
  return MOOD_VALIDATIONS[lang]?.[mood] || MOOD_VALIDATIONS.es[mood] || 'Gracias por compartir cómo te sientes. Tus emociones son válidas.';
}

export function getDailyAffirmation(cyclePhase: string | null, lang: string = 'es'): string {
  const affirmations: Record<string, Record<string, string[]>> = {
    es: {
      menstrual: [
        'Merezco descansar sin culpa. Mi cuerpo se está renovando.',
        'Cada sangre que fluye libera lo que ya no necesito.',
        'En el silencio de mi cuerpo, encuentro mi fuerza más profunda.',
        'Soy suficiente tal como estoy, incluso en mis días más suaves.',
        'Mi ciclo es mi ritmo natural. Lo honro con amor.',
      ],
      follicular: [
        'Una nueva versión de mí está naciendo. La abrazo con amor.',
        'Mi creatividad es infinita. Hoy elijo crear algo hermoso.',
        'Merezco todo lo bueno que está llegando a mi vida.',
        'Mi energía sube como las olas del mar. La navego con confianza.',
        'Hoy es el día perfecto para empezar algo que me apasione.',
      ],
      ovulatory: [
        'Brillo con luz propia. El mundo necesita mi voz.',
        'Soy poderosa, capaz y merecedora de todo lo que deseo.',
        'Mi confianza es contagiosa. La comparto con el mundo.',
        'Merezco ocupar espacio y ser vista.',
        'Hoy mi energía transforma todo lo que toca.',
      ],
      luteal: [
        'Es válido necesitar más espacio. Mi cuerpo me está cuidando.',
        'Mis emociones son mi brújula. Las escucho con compasión.',
        'Merezco paciencia, especialmente conmigo misma.',
        'Cada fase de mi ciclo tiene su propia sabiduría.',
        'Confío en mi proceso. Mi cuerpo sabe lo que necesita.',
      ],
    },
    en: {
      menstrual: [
        'I deserve to rest without guilt. My body is renewing itself.',
        'Every flow that leaves releases what I no longer need.',
        'In the silence of my body, I find my deepest strength.',
        'I am enough as I am, even on my softest days.',
        'My cycle is my natural rhythm. I honor it with love.',
      ],
      follicular: [
        'A new version of me is being born. I embrace her with love.',
        'My creativity is infinite. Today I choose to create something beautiful.',
        'I deserve all the good things coming into my life.',
        'My energy rises like ocean waves. I navigate it with confidence.',
        'Today is the perfect day to start something I\'m passionate about.',
      ],
      ovulatory: [
        'I shine with my own light. The world needs my voice.',
        'I am powerful, capable, and deserving of everything I desire.',
        'My confidence is contagious. I share it with the world.',
        'I deserve to take up space and be seen.',
        'Today my energy transforms everything it touches.',
      ],
      luteal: [
        'It\'s valid to need more space. My body is taking care of me.',
        'My emotions are my compass. I listen to them with compassion.',
        'I deserve patience, especially with myself.',
        'Every phase of my cycle has its own wisdom.',
        'I trust my process. My body knows what it needs.',
      ],
    },
    pt: {
      menstrual: [
        'Mereço descansar sem culpa. Meu corpo está se renovando.',
        'Cada sangue que flui libera o que eu não preciso mais.',
        'No silêncio do meu corpo, encontro minha força mais profunda.',
        'Sou suficiente como estou, mesmo nos meus dias mais suaves.',
        'Meu ciclo é meu ritmo natural. O honro com amor.',
      ],
      follicular: [
        'Uma nova versão de mim está nascendo. A abraço com amor.',
        'Minha criatividade é infinita. Hoje escolho criar algo lindo.',
        'Mereço tudo de bom que está chegando na minha vida.',
        'Minha energia sobe como as ondas do mar. A navego com confiança.',
        'Hoje é o dia perfeito para começar algo que me apaixona.',
      ],
      ovulatory: [
        'Brilho com luz própria. O mundo precisa da minha voz.',
        'Sou poderosa, capaz e merecedora de tudo que desejo.',
        'Minha confiança é contagiosa. A compartilho com o mundo.',
        'Mereço ocupar espaço e ser vista.',
        'Hoje minha energia transforma tudo que toca.',
      ],
      luteal: [
        'É válido precisar de mais espaço. Meu corpo está me cuidando.',
        'Minhas emoções são minha bússola. As escuto com compaixão.',
        'Mereço paciência, especialmente comigo mesma.',
        'Cada fase do meu ciclo tem sua própria sabiduría.',
        'Confio no meu processo. Meu corpo sabe o que precisa.',
      ],
    },
    fr: {
      menstrual: [
        'Je mérite de me reposer sans culpabilité. Mon corps se renouvelle.',
        'Chaque sang qui coule libère ce dont je n\'ai plus besoin.',
        'Dans le silence de mon corps, je trouve ma force la plus profonde.',
        'Je suis suffisante telle que je suis, même dans mes jours les plus doux.',
        'Mon cycle est mon rythme naturel. Je l\'honore avec amour.',
      ],
      follicular: [
        'Une nouvelle version de moi naît. Je l\'accueille avec amour.',
        'Ma créativité est infinie. Aujourd\'hui je choisis de créer quelque chose de beau.',
        'Je mérite tout ce qui est bon qui arrive dans ma vie.',
        'Mon énergie monte comme les vagues de la mer. Je la navigue avec confiance.',
        'Aujourd\'hui est le jour parfait pour commencer quelque chose qui me passionne.',
      ],
      ovulatory: [
        'Je brille de ma propre lumière. Le monde a besoin de ma voix.',
        'Je suis puissante, capable et méritante de tout ce que je désire.',
        'Ma confiance est contagieuse. Je la partage avec le monde.',
        'Je mérite d\'occuper de l\'espace et d\'être vue.',
        'Aujourd\'hui mon énergie transforme tout ce qu\'elle touche.',
      ],
      luteal: [
        'C\'est valide d\'avoir besoin de plus d\'espace. Mon corps prend soin de moi.',
        'Mes émotions sont ma boussole. Je les écoute avec compassion.',
        'Je mérite de la patience, surtout envers moi-même.',
        'Chaque phase de mon cycle a sa propre sagesse.',
        'Je fais confiance à mon processus. Mon corps sait ce dont il a besoin.',
      ],
    },
    de: {
      menstrual: [
        'Ich verdiene es, ohne Schuldgefühle zu ruhen. Mein Körper erneuert sich.',
        'Jedes Blut, das fließt, befreit, was ich nicht mehr brauche.',
        'In der Stille meines Körpers finde ich meine tiefste Stärke.',
        'Ich bin genug, so wie ich bin, sogar an meinen sanftesten Tagen.',
        'Mein Zyklus ist mein natürlicher Rhythmus. Ich ehre ihn mit Liebe.',
      ],
      follicular: [
        'Eine neue Version von mir wird geboren. Ich umarme sie mit Liebe.',
        'Meine Kreativität ist unendlich. Heute wähle ich, etwas Schönes zu erschaffen.',
        'Ich verdiene alles Gute, das in mein Leben kommt.',
        'Meine Energie steigt wie Meereswellen. Ich navigiere sie mit Zuversicht.',
        'Heute ist der perfekte Tag, um mit etwas anzufangen, das mich begeistert.',
      ],
      ovulatory: [
        'Ich scheine mit eigenem Licht. Die Welt braucht meine Stimme.',
        'Ich bin mächtig, fähig und verdiene alles, was ich mir wünsche.',
        'Mein Selbstvertrauen ist ansteckend. Ich teile es mit der Welt.',
        'Ich verdiene es, Raum einzunehmen und gesehen zu werden.',
        'Heute verwandelt meine Energie alles, was sie berührt.',
      ],
      luteal: [
        'Es ist berechtigt, mehr Raum zu brauchen. Mein Körper kümmert sich um mich.',
        'Meine Emotionen sind mein Kompass. Ich höre ihnen mit Mitgefühl zu.',
        'Ich verdiene Geduld, besonders mir selbst gegenüber.',
        'Jede Phase meines Zyklus hat ihre eigene Weisheit.',
        'Ich vertraue meinem Prozess. Mein Körper weiß, was er braucht.',
      ],
    },
  };

  const phase = cyclePhase || 'menstrual';
  const phaseAffirmations = affirmations[lang]?.[phase] || affirmations.es?.menstrual || [];
  const index = Math.floor(Math.random() * phaseAffirmations.length);
  return phaseAffirmations[index] || phaseAffirmations[0] || '';
}
