import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getSocialProof, SocialProof } from '../../config/retention';

export default function SocialProofWidget() {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const colors = currentColors;
  const [proof, setProof] = useState<SocialProof | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const data = await getSocialProof();
      setProof(data);
    } catch (e) {
      console.error('Social proof error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !proof) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('retention_social_title')}</Text>
      
      {/* Active now indicator */}
      <View style={[styles.activeIndicator, { backgroundColor: '#F0FDF4' }]}>
        <View style={styles.activeDot} />
        <Text style={[styles.activeText, { color: '#065F46' }]}>
          {t('retention_social_active', { count: proof.active_today })}
        </Text>
      </View>

      {/* User rank */}
      <View style={styles.rankRow}>
        <Ionicons name="trophy" size={16} color={colors.gold} />
        <Text style={[styles.rankText, { color: colors.text }]}>
          {t('retention_social_rank', { rank: proof.my_rank || '—' })}
        </Text>
      </View>

      {/* Top active users */}
      {proof.top_active && proof.top_active.length > 0 && (
        <View style={styles.topSection}>
          <Text style={[styles.topLabel, { color: colors.subtleText }]}>{t('retention_social_top')}</Text>
          {proof.top_active.slice(0, 3).map((user, index) => (
            <View key={user.user_id} style={styles.topRow}>
              <Text style={styles.topEmoji}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </Text>
              <Text style={[styles.topName, { color: colors.text }]}>{user.name}</Text>
            </View>
          ))}
        </View>
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
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  activeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  rankText: {
    fontSize: typography.sizes.sm,
  },
  topSection: {
    marginTop: spacing.sm,
  },
  topLabel: {
    fontSize: typography.sizes.xs,
    marginBottom: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  topEmoji: {
    fontSize: 16,
  },
  topName: {
    fontSize: typography.sizes.sm,
  },
});
