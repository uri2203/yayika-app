import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Card from './Card';
import {
  calculateEmotionalProfile,
  getArchetype,
  getCycleIQ,
  getPowerDays,
  EmotionalProfile,
  ARCHETYPES,
} from '../services/emotionalProfileService';

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  neutral: '😐',
  sad: '😢',
  irritable: '😤',
  tired: '😴',
};

const MOOD_COLORS: Record<string, string> = {
  happy: '#FBBF24',
  neutral: '#94A3B8',
  sad: '#60A5FA',
  irritable: '#F87171',
  tired: '#A78BFA',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EmotionalProfileCard() {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const colors = currentColors;

  const [profile, setProfile] = useState<EmotionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      const p = await calculateEmotionalProfile(user.id);
      setProfile(p);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start(() => setShowDetail(true));
  };

  if (loading || !profile) {
    return (
      <Card style={[styles.card, { backgroundColor: colors.white }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="person-circle-outline" size={32} color={colors.primaryLight} />
        </View>
      </Card>
    );
  }

  const archetype = getArchetype(profile);
  const cycleIQ = getCycleIQ(profile);
  const powerDays = getPowerDays(profile);

  const ringProgress = cycleIQ.score / 100;
  const ringRadius = 32;
  const ringCircumference = 2 * Math.PI * ringRadius;

  return (
    <>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: fadeAnim }}>
        <Card style={[styles.card, { backgroundColor: colors.white }]}>
          <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
            {/* Archetype Header */}
            <View style={styles.archetypeRow}>
              <View style={[styles.archetypeIconWrap, { backgroundColor: archetype.color + '20' }]}>
                <Text style={styles.archetypeEmoji}>{archetype.icon}</Text>
              </View>
              <View style={styles.archetypeInfo}>
                <Text style={[styles.archetypeLabel, { color: colors.subtleText }]}>
                  {t('profile_archetype')}
                </Text>
                <Text style={[styles.archetypeName, { color: colors.text }]}>
                  {t(archetype.nameKey)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.subtleText} />
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              {/* Cycle IQ Ring */}
              <View style={styles.statItem}>
                <View style={styles.ringContainer}>
                  <View style={[styles.ringBg, { borderColor: colors.border }]} />
                  <View
                    style={[
                      styles.ringProgress,
                      {
                        borderColor: colors.primary,
                        transform: [{ rotate: '-90deg' }],
                        borderTopColor: ringProgress > 0.25 ? colors.primary : 'transparent',
                        borderRightColor: ringProgress > 0.5 ? colors.primary : 'transparent',
                        borderBottomColor: ringProgress > 0.75 ? colors.primary : 'transparent',
                        borderLeftColor: ringProgress >= 1 ? colors.primary : 'transparent',
                      },
                    ]}
                  />
                  <View style={styles.ringCenter}>
                    <Text style={[styles.ringValue, { color: colors.text }]}>{cycleIQ.score}</Text>
                  </View>
                </View>
                <Text style={[styles.statLabel, { color: colors.subtleText }]}>
                  {t('profile_cycle_iq')}
                </Text>
              </View>

              {/* Power Days */}
              <View style={styles.statItem}>
                <View style={[styles.powerBadge, { backgroundColor: colors.gold + '15' }]}>
                  <Ionicons name="flash" size={28} color={colors.gold} />
                  <Text style={[styles.powerValue, { color: colors.gold }]}>{powerDays}</Text>
                </View>
                <Text style={[styles.statLabel, { color: colors.subtleText }]}>
                  {t('profile_power_days')}
                </Text>
              </View>

              {/* Mood Distribution Mini */}
              <View style={styles.statItem}>
                <View style={styles.moodWheel}>
                  {profile.moodDistribution.slice(0, 4).map((m, i) => (
                    <View
                      key={m.mood}
                      style={[
                        styles.moodSegment,
                        {
                          backgroundColor: MOOD_COLORS[m.mood] || colors.border,
                          width: `${Math.max(20, m.percentage)}%`,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.statLabel, { color: colors.subtleText }]}>
                  {t('profile_mood_dist')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Card>
      </Animated.View>

      {/* Detail Modal */}
      <Modal
        visible={showDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('profile_archetype')}
              </Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <Ionicons name="close" size={24} color={colors.subtleText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Archetype Detail */}
              <View style={[styles.detailArchetypeCard, { backgroundColor: archetype.color + '15' }]}>
                <Text style={styles.detailEmoji}>{archetype.icon}</Text>
                <Text style={[styles.detailName, { color: archetype.color }]}>
                  {t(archetype.nameKey)}
                </Text>
                <Text style={[styles.detailDesc, { color: colors.text }]}>
                  {archetype.description}
                </Text>
              </View>

              {/* All Archetypes */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Los 5 Arquetipos
              </Text>
              {(Object.keys(ARCHETYPES) as Array<keyof typeof ARCHETYPES>).map((key) => {
                const a = ARCHETYPES[key];
                const isActive = key === profile.archetype;
                return (
                  <View
                    key={key}
                    style={[
                      styles.archetypeOption,
                      {
                        backgroundColor: isActive ? a.color + '15' : colors.white,
                        borderColor: isActive ? a.color : colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.optionEmoji}>{a.icon}</Text>
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionName, { color: isActive ? a.color : colors.text }]}>
                        {t(a.nameKey)}
                      </Text>
                      {isActive && (
                        <Text style={[styles.optionActive, { color: a.color }]}>← {t('profile_your_archetype')}</Text>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Cycle IQ Detail */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('profile_cycle_iq')}
              </Text>
              <Card style={{ backgroundColor: colors.white }}>
                <View style={styles.iqDetailRow}>
                  <View style={styles.iqBigRing}>
                    <Text style={[styles.iqBigValue, { color: colors.primary }]}>{cycleIQ.score}</Text>
                    <Text style={[styles.iqOutOf, { color: colors.subtleText }]}>de 100</Text>
                  </View>
                  <View style={styles.iqInfo}>
                    <Text style={[styles.iqLabel, { color: colors.text }]}>{cycleIQ.label}</Text>
                    <View style={styles.iqBar}>
                      <View style={[styles.iqBarFill, { width: `${cycleIQ.score}%`, backgroundColor: colors.primary }]} />
                    </View>
                  </View>
                </View>
              </Card>

              {/* Power Days Detail */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('profile_power_days')}
              </Text>
              <Card style={{ backgroundColor: colors.white }}>
                <View style={styles.powerDetailRow}>
                  <Ionicons name="flash" size={32} color={colors.gold} />
                  <View style={styles.powerInfo}>
                    <Text style={[styles.powerBigValue, { color: colors.gold }]}>{powerDays}</Text>
                    <Text style={[styles.powerDesc, { color: colors.subtleText }]}>
                      días donde te sentiste en tu mejor momento
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Weekly Mood Journey */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Tu semana emocional
              </Text>
              <Card style={{ backgroundColor: colors.white }}>
                <View style={styles.weekRow}>
                  {profile.weeklySummary.map((d) => (
                    <View key={d.day} style={styles.weekDay}>
                      <Text style={[styles.weekDayLabel, { color: colors.subtleText }]}>{d.day}</Text>
                      <Text style={styles.weekMood}>
                        {d.mood ? MOOD_EMOJIS[d.mood] || '·' : '·'}
                      </Text>
                      {d.energy != null && (
                        <View style={[styles.energyDot, {
                          backgroundColor: d.energy >= 7 ? colors.success : d.energy >= 4 ? colors.gold : colors.error,
                        }]} />
                      )}
                    </View>
                  ))}
                </View>
              </Card>
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
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  archetypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  archetypeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  archetypeEmoji: {
    fontSize: 24,
  },
  archetypeInfo: {
    flex: 1,
  },
  archetypeLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  archetypeName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  ringContainer: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringBg: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
  },
  ringProgress: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  ringCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: typography.weights.medium,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  powerBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  powerValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  moodWheel: {
    flexDirection: 'row',
    height: 24,
    width: 72,
    borderRadius: 12,
    overflow: 'hidden',
  },
  moodSegment: {
    height: '100%',
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
    maxHeight: '85%',
    paddingHorizontal: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  detailArchetypeCard: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  detailEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  detailName: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  detailDesc: {
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  archetypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  optionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  optionActive: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  iqDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iqBigRing: {
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  iqBigValue: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
  },
  iqOutOf: {
    fontSize: typography.sizes.xs,
  },
  iqInfo: {
    flex: 1,
  },
  iqLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  iqBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  iqBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  powerDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  powerInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  powerBigValue: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
  },
  powerDesc: {
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    alignItems: 'center',
    flex: 1,
  },
  weekDayLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  weekMood: {
    fontSize: 20,
    marginBottom: 4,
  },
  energyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
