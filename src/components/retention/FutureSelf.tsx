import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getProjection, FutureProjection } from '../../config/retention';

export default function FutureSelf() {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const colors = currentColors;
  const [projection, setProjection] = useState<FutureProjection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getProjection();
      setProjection(data);
    } catch (e) {
      console.error('Projection error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.white }]}>
        <Text style={[styles.loadingText, { color: colors.subtleText }]}>{t('retention_future_title')}...</Text>
      </View>
    );
  }

  if (!projection?.current) {
    return null;
  }

  const { current, future_30_days, if_cancel } = projection;

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('retention_future_title')}</Text>
      
      <View style={styles.comparisonRow}>
        {/* Ahora */}
        <View style={[styles.versionCard, { backgroundColor: colors.primaryLight }]}>
          <Text style={styles.versionLabel}>{t('retention_transform_current')}</Text>
          <Text style={[styles.versionLevel, { color: colors.primary }]}>{t('retention_future_level', { level: current.level })}</Text>
          <Text style={[styles.versionSublabel, { color: colors.subtleText }]}>{t('home_level')}</Text>
          <Text style={[styles.versionBadges, { color: colors.gold }]}>{t('retention_future_badges', { count: current.badges })}</Text>
        </View>
        
        {/* Futuro */}
        <View style={[styles.versionCard, styles.futureCard]}>
          <Text style={[styles.versionLabel, { color: '#065F46' }]}>{t('retention_future_projection')}</Text>
          <Text style={[styles.versionLevel, { color: '#065F46' }]}>{t('retention_future_level', { level: future_30_days?.level || current.level })}</Text>
          <Text style={[styles.versionSublabel, { color: '#065F46' }]}>{t('home_level')}</Text>
          <Text style={[styles.versionBadges, { color: '#059669' }]}>{t('retention_future_badges', { count: future_30_days?.badges || current.badges })}</Text>
        </View>
      </View>

      {/* Si cancelas */}
      <View style={[styles.cancelWarning, { backgroundColor: '#FEF2F2' }]}>
        <Ionicons name="warning" size={16} color="#DC2626" />
        <View style={styles.cancelInfo}>
          <Text style={[styles.cancelTitle, { color: '#DC2626' }]}>{t('retention_future_cancel')}</Text>
          <Text style={[styles.cancelMessage, { color: '#991B1B' }]}>
            {if_cancel?.message || t('retention_future_loss', { xp: 0, days: 0 })}
          </Text>
        </View>
      </View>
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
  comparisonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  versionCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  futureCard: {
    backgroundColor: '#D1FAE5',
  },
  versionLabel: {
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  versionLevel: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
  },
  versionSublabel: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  versionBadges: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.sm,
  },
  cancelWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  cancelInfo: {
    flex: 1,
  },
  cancelTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  cancelMessage: {
    fontSize: typography.sizes.sm,
    marginTop: 2,
    lineHeight: 18,
  },
});
