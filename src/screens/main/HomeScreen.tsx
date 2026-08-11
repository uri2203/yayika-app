import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import Card from '../../components/Card';

const TIPS = [
  'Invertir en ti misma es la mejor inversión que puedes hacer.',
  'Cada pequeño paso cuenta para alcanzar tus metas.',
  'Tu valor no depende de los números en tu cuenta bancaria.',
  'Las mujeres que negocian ganan más. ¡Tú puedes!',
];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const userName = user?.user_metadata?.name || 'Guerrera';
  const dailyTip = TIPS[new Date().getDay() % TIPS.length];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {userName} 👋</Text>
            <Text style={styles.subtitle}>¿Qué quieres hacer hoy?</Text>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={18} color={colors.gold} />
            <Text style={styles.streakText}>7</Text>
          </View>
        </View>

        <View style={styles.xpContainer}>
          <View style={styles.xpRow}>
            <Ionicons name="star" size={18} color={colors.gold} />
            <Text style={styles.xpText}>240 XP</Text>
          </View>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: '60%' }]} />
          </View>
          <Text style={styles.xpLevel}>Nivel 3</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Productos')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="bag-handle" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionTitle}>Ver productos</Text>
            <Text style={styles.actionSubtitle}>Cursos y guías</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Membresía')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FDE68A' }]}>
              <Ionicons name="diamond" size={24} color={colors.gold} />
            </View>
            <Text style={styles.actionTitle}>Mi membresía</Text>
            <Text style={styles.actionSubtitle}>Plan actual</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Afiliadas')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="people" size={24} color={colors.turquoise} />
            </View>
            <Text style={styles.actionTitle}>Mi portal</Text>
            <Text style={styles.actionSubtitle}>Comisiones</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb" size={20} color={colors.gold} />
            <Text style={styles.tipTitle}>Consejo del día</Text>
          </View>
          <Text style={styles.tipText}>{dailyTip}</Text>
        </Card>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.subtleText,
    marginTop: spacing.xs,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  streakText: {
    marginLeft: spacing.xs,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.gold,
  },
  xpContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  xpText: {
    marginLeft: spacing.xs,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.gold,
  },
  xpBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  xpFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 4,
  },
  xpLevel: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginTop: 2,
  },
  tipCard: {
    backgroundColor: '#FFF9E6',
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
