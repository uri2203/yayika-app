import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';



const BADGES = [
  { emoji: '🌙', name: 'Primera fase', description: 'Registra tu primer ciclo', unlocked: true, categoryKey: 'cycle' },
  { emoji: '💰', name: 'Ahorradora', description: 'Ahorra $500 en un mes', unlocked: true, categoryKey: 'finance' },
  { emoji: '📋', name: 'Productiva', description: 'Completa 5 retos', unlocked: true, categoryKey: 'productivity' },
  { emoji: '🔥', name: 'Racha de 7', description: '7 días seguidos activa', unlocked: true, categoryKey: 'productivity' },
  { emoji: '🌸', name: 'Ciclo consciente', description: '30 días registrando', unlocked: true, categoryKey: 'cycle' },
  { emoji: '💎', name: 'Guerrera', description: 'Suscríbete al plan Guerrera', unlocked: false, categoryKey: 'special' },
  { emoji: '🎯', name: 'Meta cumplida', description: 'Alcanza tu meta de ahorro', unlocked: false, categoryKey: 'finance' },
  { emoji: '👥', name: 'Influencer', description: '10 referidas activas', unlocked: false, categoryKey: 'social' },
  { emoji: '🏆', name: 'Top 10', description: 'Entra al ranking semanal', unlocked: false, categoryKey: 'social' },
  { emoji: '⭐', name: '5 estrellas', description: 'Recibe 5 reseñas positivas', unlocked: false, categoryKey: 'social' },
  { emoji: '📚', name: 'Estudiosa', description: 'Completa todos los módulos', unlocked: false, categoryKey: 'productivity' },
  { emoji: '🌟', name: 'Leyenda', description: 'Desbloquea todos los logros', unlocked: false, categoryKey: 'special' },
];

const CATEGORY_KEYS = ['all', 'cycle', 'finance', 'productivity', 'social', 'special'] as const;

export default function BadgesScreen({ navigation }: any) {
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('all');
  const { t } = useLanguage();

  const CATEGORY_LABELS: Record<string, string> = {
    all: t('badges_all'),
    cycle: t('badges_cycle'),
    finance: t('badges_finance'),
    productivity: t('badges_productivity'),
    social: t('badges_social'),
    special: t('badges_special'),
  };

  const filteredBadges = selectedCategoryKey === 'all'
    ? BADGES
    : BADGES.filter((b) => b.categoryKey === selectedCategoryKey);

  const unlockedCount = BADGES.filter((b) => b.unlocked).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="trophy" size={28} color={colors.gold} />
          <Text style={styles.headerTitle}>{t('badges_title')}</Text>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {unlockedCount}/{BADGES.length} {t('badges_unlocked')}
          </Text>
          <View style={styles.statsBar}>
            <View style={[styles.statsFill, { width: `${(unlockedCount / BADGES.length) * 100}%` }]} />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <View style={styles.categoriesRow}>
            {CATEGORY_KEYS.map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.categoryChip, selectedCategoryKey === key && styles.categoryChipActive]}
                onPress={() => setSelectedCategoryKey(key)}
              >
                <Text style={[styles.categoryText, selectedCategoryKey === key && styles.categoryTextActive]}>
                  {CATEGORY_LABELS[key]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.badgeGrid}>
          {filteredBadges.map((badge, index) => (
            <View key={index} style={styles.badgeCard}>
              <View style={[styles.badgeCircle, badge.unlocked ? styles.badgeCircleUnlocked : styles.badgeCircleLocked]}>
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
              </View>
              <Text style={[styles.badgeName, !badge.unlocked && styles.badgeNameLocked]} numberOfLines={1}>
                {badge.name}
              </Text>
              <Text style={[styles.badgeDescription, !badge.unlocked && styles.badgeDescriptionLocked]} numberOfLines={2}>
                {badge.description}
              </Text>
              {!badge.unlocked && (
                <View style={styles.lockedBadge}>
                  <Ionicons name="lock-closed" size={10} color={colors.subtleText} />
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  statsRow: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statsText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  statsBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statsFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 4,
  },
  categoriesScroll: {
    marginBottom: spacing.lg,
  },
  categoriesRow: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    fontWeight: typography.weights.medium,
  },
  categoryTextActive: {
    color: colors.white,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '31%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badgeCircleUnlocked: {
    backgroundColor: '#FFF9E6',
  },
  badgeCircleLocked: {
    backgroundColor: colors.border,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeNameLocked: {
    color: colors.subtleText,
  },
  badgeDescription: {
    fontSize: 10,
    color: colors.subtleText,
    textAlign: 'center',
    lineHeight: 14,
  },
  badgeDescriptionLocked: {
    color: colors.border,
  },
  lockedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
});
