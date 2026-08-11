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
  'Tu ciclo es tu superpoder. Úsalo a tu favor.',
];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const userName = user?.user_metadata?.name || 'Guerrera';
  const dailyTip = TIPS[new Date().getDay() % TIPS.length];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
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

        {/* XP Bar */}
        <Card style={styles.xpContainer}>
          <View style={styles.xpRow}>
            <Ionicons name="star" size={18} color={colors.gold} />
            <Text style={styles.xpText}>240 XP</Text>
            <Text style={styles.xpLevel}>Nivel 3</Text>
          </View>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: '60%' }]} />
          </View>
        </Card>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Explorar')}
          >
            <View style={[styles.gridIcon, { backgroundColor: colors.primaryLight || '#E8D5F5' }]}>
              <Ionicons name="compass" size={22} color={colors.primary} />
            </View>
            <Text style={styles.gridTitle}>Explorar</Text>
            <Text style={styles.gridSub}>Tienda y cursos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Mi Progreso')}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="trending-up" size={22} color={colors.turquoise} />
            </View>
            <Text style={styles.gridTitle}>Mi Progreso</Text>
            <Text style={styles.gridSub}>Ciclo y finanzas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Inicio', { screen: 'CycleTracker' })}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#FDE68A' }]}>
              <Ionicons name="moon" size={22} color={colors.gold} />
            </View>
            <Text style={styles.gridTitle}>Mi Ciclo</Text>
            <Text style={styles.gridSub}>Fase actual</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Inicio', { screen: 'FinancialTracker' })}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="wallet" size={22} color={colors.rose} />
            </View>
            <Text style={styles.gridTitle}>Finanzas</Text>
            <Text style={styles.gridSub}>Ingresos y gastos</Text>
          </TouchableOpacity>
        </View>

        {/* Feature Cards */}
        <Text style={styles.sectionTitle}>Herramientas</Text>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Inicio', { screen: 'Challenges' })}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="trophy" size={24} color={colors.gold} />
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Retos de la semana</Text>
            <Text style={styles.featureSub}>3/5 completados</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Inicio', { screen: 'Badges' })}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#E0E7FF' }]}>
            <Ionicons name="ribbon" size={24} color={colors.primary} />
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Mis Logros</Text>
            <Text style={styles.featureSub}>12/30 desbloqueados</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Inicio', { screen: 'Rankings' })}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="flame" size={24} color="#EF4444" />
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Rankings</Text>
            <Text style={styles.featureSub}>Posición #15</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Inicio', { screen: 'Wallet' })}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="card" size={24} color={colors.turquoise} />
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Mi Billetera</Text>
            <Text style={styles.featureSub}>$1,247.50 MXN</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
        </TouchableOpacity>

        {/* Daily Tip */}
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
  xpLevel: {
    marginLeft: 'auto',
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
  },
  xpBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  gridItem: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gridIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  gridTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  gridSub: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginTop: 2,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  featureSub: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginTop: 2,
  },
  tipCard: {
    backgroundColor: '#FFF9E6',
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
