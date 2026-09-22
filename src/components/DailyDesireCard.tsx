import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { typography, spacing, borderRadius } from '../config/theme';
import { CyclePhase } from '../services/dailyActionService';
import {
  getDailyDesireContent,
  getSensualTip,
  getEmpowermentQuote,
  getBodyLoveMessage,
} from '../services/desireContentService';

interface DailyDesireCardProps {
  cyclePhase: CyclePhase;
}

const ADDITIONAL_TIPS: Record<string, { icon: string; text: string }[]> = {
  es: [
    { icon: 'leaf', text: 'Respira profundo 3 veces. Siente cómo tu cuerpo se llena de vida.' },
    { icon: 'musical-notes', text: 'Pon tu canción favorita y baila como nadie te mira.' },
    { icon: 'book', text: 'Escribe 3 cosas por las que estás agradecida hoy.' },
    { icon: 'eye', text: 'Mírate al espejo y di: "Me quiero tal como soy."' },
  ],
  en: [
    { icon: 'leaf', text: 'Take 3 deep breaths. Feel how your body fills with life.' },
    { icon: 'musical-notes', text: 'Put on your favorite song and dance like nobody\'s watching.' },
    { icon: 'book', text: 'Write 3 things you\'re grateful for today.' },
    { icon: 'eye', text: 'Look in the mirror and say: "I love myself as I am."' },
  ],
  pt: [
    { icon: 'leaf', text: 'Respire fundo 3 vezes. Sinta como seu corpo se enche de vida.' },
    { icon: 'musical-notes', text: 'Coloque sua música favorita e dance como se ninguém estivesse vendo.' },
    { icon: 'book', text: 'Escreva 3 coisas pelas quais é grata hoje.' },
    { icon: 'eye', text: 'Olhe no espelho e diga: "Eu me amo como sou."' },
  ],
  fr: [
    { icon: 'leaf', text: 'Respire profondément 3 fois. Sens comment ton corps se remplit de vie.' },
    { icon: 'musical-notes', text: 'Mets ta chanson préférée et danse comme si personne ne te regardait.' },
    { icon: 'book', text: 'Écris 3 choses pour lesquelles tu es reconnaissante aujourd\'hui.' },
    { icon: 'eye', text: 'Regarde-toi dans le miroir et dis: "Je m\'aime telle que je suis."' },
  ],
  de: [
    { icon: 'leaf', text: 'Atme 3 Mal tief ein. Fühle, wie dein Körper sich mit Leben füllt.' },
    { icon: 'musical-notes', text: 'Spiele dein Lieblingslied ab und tanze, als würde niemand zusehen.' },
    { icon: 'book', text: 'Schreibe 3 Dinge auf, für die du heute dankbar bist.' },
    { icon: 'eye', text: 'Schau in den Spiegel und sag: "Ich liebe mich so, wie ich bin."' },
  ],
};

export default function DailyDesireCard({ cyclePhase }: DailyDesireCardProps) {
  const { currentColors } = useTheme();
  const { t, lang } = useLanguage();
  const colors = currentColors;

  const [showTipsModal, setShowTipsModal] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const desireContent = getDailyDesireContent(cyclePhase);
  const sensualTip = getSensualTip(cyclePhase);
  const empowermentQuote = getEmpowermentQuote();
  const bodyLoveMessage = getBodyLoveMessage(cyclePhase);
  const additionalTips = ADDITIONAL_TIPS[lang] || ADDITIONAL_TIPS.es;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => pulse.stop();
  }, []);

  const gradientColors = {
    menstrual: ['#F9E8EE', '#F472B6', '#D4B8F5'],
    follicular: ['#D1FAE5', '#3BAF7A', '#A7F3D0'],
    ovulatory: ['#CCFBF1', '#1A9E8F', '#99F6E4'],
    luteal: ['#FEF3C7', '#D4A843', '#FDE68A'],
    unknown: ['#F3E8FF', '#8B5CF6', '#DDD6FE'],
  };

  const phaseGradient = gradientColors[cyclePhase] || gradientColors.unknown;

  return (
    <>
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        {/* Gradient background */}
        <View style={[styles.gradientBg, { backgroundColor: phaseGradient[0] }]}>
          <View style={[styles.gradientOverlay, { backgroundColor: phaseGradient[1] + '15' }]} />

          {/* Header */}
          <View style={styles.header}>
            <Animated.View style={[styles.heartIcon, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="heart" size={24} color={colors.rose || '#F472B6'} />
            </Animated.View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t('desire_title')}
            </Text>
          </View>

          {/* Desire Content */}
          <View style={styles.contentSection}>
            <Ionicons name={desireContent.icon as any} size={20} color={phaseGradient[1]} />
            <Text style={[styles.desireMessage, { color: colors.text }]}>
              {desireContent.message}
            </Text>
          </View>

          {/* Empowerment Quote */}
          <View style={[styles.quoteSection, { backgroundColor: colors.white + '80' }]}>
            <Ionicons name="chatbubble-ellipses" size={16} color={colors.gold} />
            <View style={styles.quoteTextContainer}>
              <Text style={[styles.quoteText, { color: colors.text }]} numberOfLines={3}>
                {empowermentQuote.text}
              </Text>
              <Text style={[styles.quoteAuthor, { color: colors.subtleText }]}>
                — {empowermentQuote.author}
              </Text>
            </View>
          </View>

          {/* Body Love */}
          <View style={[styles.bodyLoveSection, { backgroundColor: colors.rose + '10' || '#F472B610' }]}>
            <Ionicons name="heart-circle" size={18} color={colors.rose || '#F472B6'} />
            <Text style={[styles.bodyLoveTitle, { color: colors.text }]}>
              {t('desire_body_love')}
            </Text>
            <Text style={[styles.bodyLoveText, { color: colors.subtleText }]} numberOfLines={3}>
              {bodyLoveMessage}
            </Text>
          </View>

          {/* Sensual Tip */}
          <View style={[styles.tipSection, { backgroundColor: colors.white + '90' }]}>
            <View style={styles.tipHeader}>
              <Ionicons name={sensualTip.icon as any} size={18} color={colors.primary} />
              <Text style={[styles.tipTitle, { color: colors.text }]}>
                {t('desire_sensual_tip')}
              </Text>
            </View>
            <Text style={[styles.tipText, { color: colors.subtleText }]}>
              {sensualTip.detail}
            </Text>
          </View>

          {/* See more tips */}
          <TouchableOpacity
            style={styles.moreTipsButton}
            onPress={() => setShowTipsModal(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.moreTipsText, { color: colors.primary }]}>
              Más consejos
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Tips Modal */}
      <Modal
        visible={showTipsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTipsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('desire_sensual_tip')}
              </Text>
              <TouchableOpacity onPress={() => setShowTipsModal(false)}>
                <Ionicons name="close" size={24} color={colors.subtleText} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.tipsList}>
              {additionalTips.map((tip, idx) => (
                <View
                  key={idx}
                  style={[styles.tipItem, { backgroundColor: colors.white, borderColor: colors.border }]}
                >
                  <View style={[styles.tipItemIcon, { backgroundColor: phaseGradient[1] + '15' }]}>
                    <Ionicons name={tip.icon as any} size={20} color={phaseGradient[1]} />
                  </View>
                  <Text style={[styles.tipItemText, { color: colors.text }]} numberOfLines={3}>
                    {tip.text}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  gradientBg: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    position: 'relative',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
    zIndex: 1,
  },
  heartIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F472B620',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    flex: 1,
  },
  contentSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
    zIndex: 1,
  },
  desireMessage: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    flex: 1,
    lineHeight: 22,
  },
  quoteSection: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
    zIndex: 1,
  },
  quoteTextContainer: {
    flex: 1,
  },
  quoteText: {
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 4,
  },
  quoteAuthor: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  bodyLoveSection: {
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    zIndex: 1,
  },
  bodyLoveTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  bodyLoveText: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  tipSection: {
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    zIndex: 1,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  tipTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  tipText: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  moreTipsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    zIndex: 1,
  },
  moreTipsText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  tipsList: {
    paddingHorizontal: spacing.lg,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    gap: spacing.md,
  },
  tipItemIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipItemText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
});
