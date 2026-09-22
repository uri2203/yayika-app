import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LEGAL_TEXTS } from '../config/legalTexts';

interface HealthDisclaimerProps {
  type?: 'health' | 'ai' | 'finance';
}

export default function HealthDisclaimer({ type = 'health' }: HealthDisclaimerProps) {
  const { currentColors } = useTheme();
  const { lang } = useLanguage();
  const colors = currentColors;
  const texts = LEGAL_TEXTS[lang] || LEGAL_TEXTS.es;
  const [expanded, setExpanded] = useState(false);

  const getConfig = () => {
    switch (type) {
      case 'ai':
        return {
          icon: 'hardware-chip-outline' as const,
          label: texts.ai_disclaimer,
          detail: texts.ai_no_therapy,
          color: colors.gold,
          bgColor: 'rgba(212, 168, 67, 0.1)',
        };
      case 'finance':
        return {
          icon: 'wallet-outline' as const,
          label: texts.finance_disclaimer,
          detail: texts.finance_no_advice,
          color: colors.turquoise,
          bgColor: 'rgba(45, 212, 191, 0.1)',
        };
      default:
        return {
          icon: 'medical-outline' as const,
          label: texts.health_disclaimer,
          detail: texts.health_no_diagnosis,
          color: colors.rose,
          bgColor: 'rgba(244, 114, 182, 0.1)',
        };
    }
  };

  const config = getConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons name={config.icon} size={16} color={config.color} />
          <Text style={[styles.label, { color: config.color }]} numberOfLines={1}>
            {config.label}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={config.color}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.detailContainer}>
          <Text style={[styles.detail, { color: colors.subtleText }]}>
            {config.detail}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.sm,
    flex: 1,
  },
  detailContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  detail: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  },
});
