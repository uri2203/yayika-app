import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';

const INCOME = [
  { id: '1', desc: 'Venta Ciclo Productiva', amount: 199, date: '01 Ago' },
  { id: '3', desc: 'Venta Dinero sin Pena', amount: 249, date: '04 Ago' },
  { id: '5', desc: 'Membresía Guerrera', amount: 15, date: '07 Ago' },
  { id: '7', desc: 'Venta Mujer que Negocia', amount: 179, date: '09 Ago' },
];

const EXPENSES = [
  { id: '2', desc: 'Suscripción Semilla', amount: -5, date: '02 Ago' },
  { id: '4', desc: 'Café', amount: -45, date: '05 Ago' },
  { id: '6', desc: 'Uber', amount: -120, date: '08 Ago' },
  { id: '8', desc: 'Supermercado', amount: -650, date: '10 Ago' },
];

const TOTAL_INCOME = INCOME.reduce((s, t) => s + t.amount, 0);
const TOTAL_EXPENSES = EXPENSES.reduce((s, t) => s + Math.abs(t.amount), 0);
const BALANCE = TOTAL_INCOME - TOTAL_EXPENSES;
const BUDGET_LIMIT = 5000;

const ALL_TRANSACTIONS = [...INCOME, ...EXPENSES].sort((a, b) => {
  const da = parseInt(a.id);
  const db = parseInt(b.id);
  return da - db;
});

function formatMoney(n: number) {
  const sign = n >= 0 ? '+' : '';
  return `$${sign}${n.toLocaleString('es-MX')}`;
}

export default function FinancialTrackerScreen({ navigation }: any) {
  const { t } = useLanguage();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('finance_title')}</Text>
          <Text style={styles.subtitle}>Agosto 2026</Text>
        </View>

        {/* Monthly Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryLabel}>{t('finance_income')}</Text>
              <Text style={[styles.summaryAmount, { color: colors.success }]}>
                ${TOTAL_INCOME.toLocaleString('es-MX')}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryLabel}>{t('finance_expenses')}</Text>
              <Text style={[styles.summaryAmount, { color: colors.error }]}>
                ${TOTAL_EXPENSES.toLocaleString('es-MX')}
              </Text>
            </View>
          </View>
          <View style={[styles.balanceContainer, BALANCE < 0 && { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.balanceLabel}>{t('finance_balance')}</Text>
            <Text style={[styles.balanceAmount, BALANCE >= 0 ? { color: colors.success } : { color: colors.error }]}>
              {formatMoney(BALANCE)}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: colors.success }]}>
            <Text style={styles.statLabel}>Ingresos</Text>
            <Text style={[styles.statAmount, { color: colors.success }]}>
              ${TOTAL_INCOME.toLocaleString('es-MX')}
            </Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.error }]}>
            <Text style={styles.statLabel}>Gastos</Text>
            <Text style={[styles.statAmount, { color: colors.error }]}>
              ${TOTAL_EXPENSES.toLocaleString('es-MX')}
            </Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.turquoise }]}>
            <Text style={styles.statLabel}>Ahorro</Text>
            <Text style={[styles.statAmount, { color: colors.turquoise }]}>
              ${BALANCE.toLocaleString('es-MX')}
            </Text>
          </View>
        </View>

        {/* Budget Progress */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetTitle}>{t('finance_budget')}</Text>
            <Text style={styles.budgetAmount}>
              ${TOTAL_EXPENSES.toLocaleString('es-MX')} / ${BUDGET_LIMIT.toLocaleString('es-MX')}
            </Text>
          </View>
          <View style={styles.budgetBar}>
            <View
              style={[
                styles.budgetFill,
                {
                  width: `${Math.min((TOTAL_EXPENSES / BUDGET_LIMIT) * 100, 100)}%`,
                  backgroundColor: TOTAL_EXPENSES / BUDGET_LIMIT > 0.8 ? colors.error : colors.turquoise,
                },
              ]}
            />
          </View>
          <Text style={styles.budgetRemaining}>
            Restan ${(BUDGET_LIMIT - TOTAL_EXPENSES).toLocaleString('es-MX')} disponibles
          </Text>
        </View>

        {/* Transactions */}
        <Text style={styles.sectionTitle}>Transacciones recientes</Text>
        {ALL_TRANSACTIONS.map((tx) => {
          const isIncome = tx.amount > 0;
          return (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIcon, isIncome ? styles.txIconIncome : styles.txIconExpense]}>
                <Ionicons
                  name={isIncome ? 'arrow-down' : 'arrow-up'}
                  size={16}
                  color={isIncome ? colors.success : colors.error}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{tx.desc}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, isIncome ? styles.txAmountIncome : styles.txAmountExpense]}>
                {formatMoney(tx.amount)}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
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
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.subtleText,
    marginTop: spacing.xs,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryBlock: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  summaryLabel: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginBottom: spacing.xs,
  },
  summaryAmount: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  balanceContainer: {
    backgroundColor: '#D1FAE5',
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
  },
  balanceAmount: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    borderLeftWidth: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginBottom: spacing.xs,
  },
  statAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  budgetCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  budgetTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  budgetAmount: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
  },
  budgetBar: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  budgetFill: {
    height: '100%',
    borderRadius: 5,
  },
  budgetRemaining: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  txRow: {
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
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  txIconIncome: {
    backgroundColor: '#D1FAE5',
  },
  txIconExpense: {
    backgroundColor: '#FEE2E2',
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  txDate: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginTop: 2,
  },
  txAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  txAmountIncome: {
    color: colors.success,
  },
  txAmountExpense: {
    color: colors.error,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
