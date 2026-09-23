import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography, spacing, borderRadius } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Card from './Card';

const SURPRISE_KEY = '@yayika_daily_surprise';

interface SurpriseContent {
  type: 'insight' | 'affirmation' | 'fact' | 'challenge' | 'dato';
  text: string;
  icon: string;
}

const AFFIRMATIONS = [
  'Eres más fuerte de lo que crees. Tu ciclo lo demuestra cada día.',
  'Mereces espacio para descansar y brillar por igual.',
  'Cada fase de tu ciclo te enseña algo nuevo sobre tu poder.',
  'Tu cuerpo habla. Tú tienes el poder de escucharlo.',
  'Hoy es un buen día para ser amable contigo misma.',
  'Tu energía es un regalo. Úsala donde más importa.',
  'No necesitas ser perfecta. Necesitas ser tú.',
  'Cada día que te conoces mejor, creces más.',
];

const FUN_FACTS = [
  'Las mujeres tienen mejor memoria olfativa durante la ovulación.',
  'Tu cerebro procesa información de forma diferente según la fase del ciclo.',
  'El estrés puede afectar la regularidad de tu ciclo más de lo que piensas.',
  'Dormir bien puede reducir los síntomas premenstruales hasta un 40%.',
  'El ejercicio regular puede aliviar el dolor menstrual naturalmente.',
  'Tu ciclo puede influir en cómo tomas decisiones financieras.',
  'Las mujeres son más creativas en la fase folicular de su ciclo.',
  'Comer chocolate durante la menstruación puede ser realmente beneficioso.',
];

const CHALLENGES = [
  'Hoy sonríe a 3 personas que no conoces.',
  'Escribe 3 cosas por las que estás agradecida hoy.',
  'Tómate 5 minutos solo para respirar sin pantallas.',
  'Dile a alguien por qué es especial para ti.',
  'Camina 15 minutos sin música, solo escuchando tu entorno.',
  'Escribe una carta de agradecimiento a ti misma.',
  'Prueba algo nuevo que siempre quisiste hacer.',
  'Bebe 8 vasos de agua hoy y nota cómo te sientes.',
];

const DATOS_CICLO = [
  'Tu ciclo no es solo menstruación — es un sistema completo que involucra hormonas, cerebro y cuerpo.',
  'La fase lútea dura entre 10 y 14 días y es cuando tu cuerpo se prepara para el siguiente ciclo.',
  'El estrógeno no solo afecta tu ánimo — también mejora tu capacidad verbal y memoria.',
  'La progesterona en la fase lútea puede hacerte sentir más ansiosa, es totally normal.',
  'Ciclos irregulares no siempre significan un problema — a veces tu cuerpo simplemente está respondiendo al estrés.',
  'Tu ciclo puede influir en cómo metabolizas los carbohidratos.',
  'Durante la ovulación, las mujeres tienden a ser más Confederaciones y seguras.',
  'El chocolate amargo puede ayudar a reducir los calambres menstruales por su contenido de magnesio.',
];

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getDeterministicIndex(max: number): number {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return seed % max;
}

function generateSurprise(): SurpriseContent {
  const surpriseTypes = ['insight', 'affirmation', 'fact', 'challenge', 'dato'] as const;
  const typeIndex = getDeterministicIndex(surpriseTypes.length);
  const type = surpriseTypes[typeIndex];

  switch (type) {
    case 'affirmation':
      return {
        type,
        text: AFFIRMATIONS[getDeterministicIndex(AFFIRMATIONS.length)],
        icon: 'heart',
      };
    case 'fact':
      return {
        type,
        text: FUN_FACTS[getDeterministicIndex(FUN_FACTS.length)],
        icon: 'bulb',
      };
    case 'challenge':
      return {
        type,
        text: CHALLENGES[getDeterministicIndex(CHALLENGES.length)],
        icon: 'ribbon',
      };
    case 'dato':
      return {
        type,
        text: DATOS_CICLO[getDeterministicIndex(DATOS_CICLO.length)],
        icon: 'information-circle',
      };
    default:
      return {
        type: 'insight',
        text: 'Cada registro te acerca más a conocer tu verdadero potencial.',
        icon: 'sparkles',
      };
  }
}

export default function DailySurprise() {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const colors = currentColors;

  const [opened, setOpened] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [surprise, setSurprise] = useState<SurpriseContent | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const revealScale = useRef(new Animated.Value(0)).current;
  const revealOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkIfOpened();
    const shake = startShake();
    return () => shake.stop();
  }, []);

  const startShake = () => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -4, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -3, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 3, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        Animated.delay(2000),
      ])
    );
    loop.start();
    return loop;
  };

  const checkIfOpened = async () => {
    try {
      const saved = await AsyncStorage.getItem(SURPRISE_KEY);
      if (saved === getTodayKey()) {
        setOpened(true);
      }
    } catch {}
  };

  const handleOpen = useCallback(() => {
    if (opened) return;

    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.85, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1.1, friction: 3, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start(() => {
      const content = generateSurprise();
      setSurprise(content);

      Animated.parallel([
        Animated.spring(revealScale, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(revealOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start(() => {
        setShowContent(true);
      });

      AsyncStorage.setItem(SURPRISE_KEY, getTodayKey()).catch(() => {});
      setOpened(true);
    });
  }, [opened]);

  if (opened && !showContent) return null;

  if (showContent && surprise) {
    const typeColors: Record<string, string> = {
      insight: colors.primary,
      affirmation: colors.gold,
      fact: colors.turquoise,
      challenge: colors.rose,
      dato: colors.phaseLuteal,
    };

    const typeBgs: Record<string, string> = {
      insight: colors.primaryLight + '20',
      affirmation: colors.warningBg,
      fact: colors.successBg,
      challenge: colors.rose + '15',
      dato: colors.warningBg,
    };

    return (
      <Animated.View style={{ opacity: revealOpacity, transform: [{ scale: revealScale }] }}>
        <Card style={[styles.revealedCard, { backgroundColor: typeBgs[surprise.type] }]}>
          <View style={styles.revealedHeader}>
            <View style={[styles.revealedIcon, { backgroundColor: typeColors[surprise.type] + '20' }]}>
              <Ionicons name={surprise.icon as any} size={24} color={typeColors[surprise.type]} />
            </View>
            <View style={styles.revealedInfo}>
              <Text style={[styles.revealedType, { color: typeColors[surprise.type] }]}>
                {surprise.type === 'affirmation' ? 'Afirmación del día' :
                  surprise.type === 'fact' ? 'Dato curioso' :
                    surprise.type === 'challenge' ? 'Reto de hoy' :
                      surprise.type === 'dato' ? 'Dato de tu ciclo' : 'Descubrimiento'}
              </Text>
              <Text style={[styles.revealedDay, { color: colors.subtleText }]}>
                Día {getDayOfYear()} de 365
              </Text>
            </View>
          </View>
          <Text style={[styles.revealedText, { color: colors.text }]}>
            {surprise.text}
          </Text>
        </Card>
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity onPress={handleOpen} activeOpacity={0.85}>
      <Card style={[styles.card, { backgroundColor: colors.white }]}>
        <View style={styles.content}>
          <Animated.View style={[styles.giftWrap, { transform: [{ rotate: shakeAnim }] }]}>
            <View style={[styles.giftIcon, { backgroundColor: colors.gold + '15' }]}>
              <Text style={styles.giftEmoji}>🎁</Text>
            </View>
          </Animated.View>
          <View style={styles.textCol}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('surprise_title')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.subtleText }]}>
              {t('surprise_open')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.subtleText} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftWrap: {
    marginRight: spacing.md,
  },
  giftIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftEmoji: {
    fontSize: 24,
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  revealedCard: {
    marginBottom: spacing.lg,
  },
  revealedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  revealedIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  revealedInfo: {
    flex: 1,
  },
  revealedType: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  revealedDay: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  revealedText: {
    fontSize: typography.sizes.lg,
    lineHeight: 26,
    fontWeight: typography.weights.medium,
  },
});
