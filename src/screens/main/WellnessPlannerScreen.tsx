import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { aiWellnessPlanner } from '../../config/api';

export default function WellnessPlannerScreen({ navigation }: any) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<{
    meals: { name: string; description: string; icon: string }[];
    exercise: { name: string; duration: string; why: string }[];
    tip: string;
  } | null>(null);

  useEffect(() => {
    aiWellnessPlanner({ lang: 'es' })
      .then((res) => setPlan(res.plan))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.scrollContent, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('wellness_loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('wellness_title')}</Text>
        </View>

        {/* Meals */}
        <Text style={styles.sectionTitle}>{t('wellness_meals')}</Text>
        {plan?.meals?.map((meal, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardIcon}>
              <Text style={styles.mealEmoji}>{meal.icon}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{meal.name}</Text>
              <Text style={styles.cardSub}>{meal.description}</Text>
            </View>
          </View>
        ))}

        {/* Exercise */}
        <Text style={styles.sectionTitle}>{t('wellness_exercise')}</Text>
        {plan?.exercise?.map((ex, i) => (
          <View key={i} style={styles.card}>
            <View style={[styles.cardIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="fitness" size={20} color={colors.gold} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{ex.name}</Text>
              <Text style={styles.cardDuration}>{ex.duration}</Text>
              <Text style={styles.cardSub}>{ex.why}</Text>
            </View>
          </View>
        ))}

        {/* Tip */}
        {plan?.tip && (
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={20} color={colors.gold} />
              <Text style={styles.tipTitle}>{t('wellness_tip')}</Text>
            </View>
            <Text style={styles.tipText}>{plan.tip}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.subtleText,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backBtn: {
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  mealEmoji: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  cardDuration: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.gold,
    marginTop: 2,
  },
  cardSub: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginTop: 2,
  },
  tipCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tipTitle: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
  },
  tipText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    lineHeight: 22,
  },
});
