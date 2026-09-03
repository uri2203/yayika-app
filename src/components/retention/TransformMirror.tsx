import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTransformHistory, TransformMonth } from '../../config/retention';

export default function TransformMirror() {
  const { currentColors } = useTheme();
  const { t, language } = useLanguage();
  const colors = currentColors;
  const [history, setHistory] = useState<TransformMonth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getTransformHistory();
      setHistory(data);
    } catch (e) {
      console.error('Transform history error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.white }]}>
        <Text style={[styles.loadingText, { color: colors.subtleText }]}>{t('retention_transform_title')}...</Text>
      </View>
    );
  }

  if (history.length < 1) {
    return (
      <View style={[styles.container, { backgroundColor: colors.white }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('retention_transform_title')}</Text>
        <Text style={[styles.emptyText, { color: colors.subtleText }]}>
          {t('retention_transform_current')}
        </Text>
      </View>
    );
  }

  const latest = history[0];
  const snapshot = latest.data_snapshot || {};
  const comparison = latest.comparison;

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('retention_transform_title')}</Text>
      
      <View style={[styles.mirrorCard, { backgroundColor: colors.primaryLight }]}>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{snapshot.checkins || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.subtleText }]}>{t('common_checkins')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.gold }]}>{snapshot.badges || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.subtleText }]}>{t('common_badges_label')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.turquoise }]}>{snapshot.xp || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.subtleText }]}>{t('common_xp_unit')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.rose }]}>{latest.level_at_month || 1}</Text>
            <Text style={[styles.statLabel, { color: colors.subtleText }]}>{t('home_level')}</Text>
          </View>
        </View>

        {comparison && comparison.xp_delta > 0 && (
          <View style={[styles.deltaBar, { borderTopColor: colors.border }]}>
            <Ionicons name="trending-up" size={16} color="#10B981" />
            <Text style={styles.deltaText}>
              +{comparison.xp_delta} {t('common_xp_unit')} · +{comparison.badges_delta || 0} {t('common_badges_label').toLowerCase()} · +{comparison.level_delta || 0} {t('home_level').toLowerCase()}
            </Text>
          </View>
        )}
      </View>

      {history.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
          {history.slice(1, 4).map((month, index) => (
            <View key={index} style={[styles.historyCard, { backgroundColor: colors.background }]}>
              <Text style={[styles.historyMonth, { color: colors.subtleText }]}>
                {new Date(month.month_date).toLocaleDateString(language, { month: 'short', year: 'numeric' })}
              </Text>
              <Text style={[styles.historyXP, { color: colors.text }]}>{month.data_snapshot?.xp || 0} {t('common_xp_unit')}</Text>
              <Text style={[styles.historyBadges, { color: colors.subtleText }]}>{month.data_snapshot?.badges || 0} {t('home_my_badges').toLowerCase()}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  mirrorCard: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  deltaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    gap: spacing.xs,
  },
  deltaText: {
    fontSize: typography.sizes.sm,
    color: '#10B981',
    fontWeight: typography.weights.medium,
  },
  historyScroll: {
    marginTop: spacing.md,
  },
  historyCard: {
    width: 100,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  historyMonth: {
    fontSize: typography.sizes.xs,
    textTransform: 'capitalize',
  },
  historyXP: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  historyBadges: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
