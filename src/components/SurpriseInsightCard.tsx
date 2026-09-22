import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Card from './Card';
import {
  calculateEmotionalProfile,
  getSurpriseInsight,
  EmotionalProfile,
} from '../services/emotionalProfileService';

interface SurpriseInsightCardProps {
  onPress?: () => void;
}

export default function SurpriseInsightCard({ onPress }: SurpriseInsightCardProps) {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const colors = currentColors;

  const [insight, setInsight] = useState<{ text: string; type: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    loadInsight();
  }, [user?.id]);

  const loadInsight = async () => {
    if (!user?.id) return;
    try {
      const profile = await calculateEmotionalProfile(user.id);
      const result = getSurpriseInsight(profile);
      setInsight(result);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading || !insight) return null;

  const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
    pattern: { icon: 'analytics', color: colors.primary, bg: colors.primaryLight + '30' },
    celebration: { icon: 'sparkles', color: colors.gold, bg: colors.warningBg },
    curiosity: { icon: 'bulb', color: colors.turquoise, bg: colors.successBg },
  };

  const config = typeConfig[insight.type] || typeConfig.curiosity;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      }}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <Card style={[styles.card, { backgroundColor: config.bg }]}>
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: config.color + '20' }]}>
              <Ionicons name={config.icon as any} size={18} color={config.color} />
            </View>
            <Text style={[styles.headerTitle, { color: config.color }]}>
              {t('insight_title')}
            </Text>
          </View>
          <Text style={[styles.insightText, { color: colors.text }]}>
            {insight.text}
          </Text>
          <View style={styles.footer}>
            <Text style={[styles.footerLink, { color: config.color }]}>
              {t('surprise_more')}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={config.color} />
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  insightText: {
    fontSize: typography.sizes.md,
    lineHeight: 22,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerLink: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
