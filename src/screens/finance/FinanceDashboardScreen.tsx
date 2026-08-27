import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getTransactions } from '../../config/api';
import { Language } from '../../config/i18n';

function getLocalized(value: any, lang: Language): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return value[lang] || value.es || value.en || Object.values(value)[0] || '';
  return String(value);
}

const MONTHS_BY_LANG: Record<string, string[]> = {
  es: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  pt: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  fr: ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'],
  de: ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'],
};

function formatMoney(n: any, lang: Language = 'es') {
  const num = typeof n === 'number' && !isNaN(n) ? n : 0;
  const locale = lang === 'es' ? 'es-MX' : lang === 'pt' ? 'pt-BR' : 'en-US';
  return `$${num.toLocaleString(locale)}`;
}

function formatDate(dateStr: string, lang: Language = 'es') {
  const d = new Date(dateStr);
  const months = MONTHS_BY_LANG[lang] || MONTHS_BY_LANG.es;
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

const EXPENSE_CATEGORIES: Record<string, number> = {
  food: 0.5,
  transport: 0.15,
  housing: 0.2,
  entertainment: 0.1,
  other: 0.05,
};

export default function FinanceDashboardScreen({ navigation }: any) {
  const { currentColors } = useTheme();
  const colors = currentColors;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.md,
      marginBottom: spacing.lg,
    },
    backBtn: { padding: spacing.xs },
    title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text },
    incomeCard: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    incomeLabel: { fontSize: typography.sizes.sm, color: colors.primaryLight, marginBottom: spacing.xs },
    incomeAmount: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: colors.white, marginBottom: spacing.md },
    balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
    balanceItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    balanceVal: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.white },
    balanceLabel: { fontSize: typography.sizes.xs, color: colors.primaryLight },
    splitCard: {
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
    splitTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
    splitRow: { flexDirection: 'row', justifyContent: 'space-between' },
    splitItem: { flex: 1, alignItems: 'center' },
    splitDot: { width: 10, height: 10, borderRadius: 5, marginBottom: spacing.xs },
    splitLabel: { fontSize: typography.sizes.xs, color: colors.subtleText, marginBottom: 2 },
    splitAmount: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.text },
    quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
    actionBtn: { alignItems: 'center', flex: 1 },
    actionIcon: {
      width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs,
    },
    actionLabel: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium, color: colors.text },
    sectionTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text, marginBottom: spacing.md },
    txRow: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
      borderRadius: borderRadius.sm, padding: spacing.md, marginBottom: spacing.sm,
      shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
    },
    txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    txIconIncome: { backgroundColor: '#D1FAE5' },
    txIconExpense: { backgroundColor: '#FEE2E2' },
    txInfo: { flex: 1 },
    txDesc: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.text },
    txDate: { fontSize: typography.sizes.xs, color: colors.subtleText, marginTop: 2 },
    txAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
    txAmountIncome: { color: colors.success },
    txAmountExpense: { color: colors.error },
    viewAllBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      padding: spacing.md, marginTop: spacing.sm,
    },
    viewAllText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.primary, marginRight: spacing.xs },
    emptyState: { alignItems: 'center', paddingVertical: spacing.xl },
    emptyText: { fontSize: typography.sizes.sm, color: colors.subtleText, marginTop: spacing.sm },
  });

  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const txs = await getTransactions(user.id);
      setTransactions(txs || []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const monthlyTxs = [...transactions].sort((a, b) => {
    if (a.date && b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
    return 0;
  });

  const now = new Date();
  const currentMonthTxs = monthlyTxs.filter((tx) => {
    if (!tx.date) return false;
    const d = new Date(tx.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalIncome = currentMonthTxs
    .filter((tx) => tx.type === 'income')
    .reduce((s, tx) => s + (typeof tx.amount === 'number' ? tx.amount : 0), 0);
  const totalExpenses = currentMonthTxs
    .filter((tx) => tx.type === 'expense')
    .reduce((s, tx) => s + (typeof tx.amount === 'number' ? tx.amount : 0), 0);
  const savings = totalIncome - totalExpenses;
  const needs = totalExpenses * 0.625;
  const wants = totalExpenses * 0.375;

  const recentTransactions = monthlyTxs.slice(0, 5);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
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
          <Text style={styles.title}>{t('finance_title') || 'Finanzas'}</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.incomeCard}>
          <Text style={styles.incomeLabel}>{t('finance_income') || 'Ingreso mensual'}</Text>
          <Text style={styles.incomeAmount}>{formatMoney(totalIncome, lang)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Ionicons name="trending-down" size={16} color={colors.error} />
              <Text style={styles.balanceVal}>{formatMoney(totalExpenses, lang)}</Text>
              <Text style={styles.balanceLabel}>{t('finance_expenses') || 'Gastos'}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Ionicons name="wallet" size={16} color={colors.turquoise} />
              <Text style={[styles.balanceVal, { color: savings >= 0 ? colors.success : colors.error }]}>
                {formatMoney(savings, lang)}
              </Text>
              <Text style={styles.balanceLabel}>{t('finance_savings_stat') || 'Ahorro'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.splitCard}>
          <Text style={styles.splitTitle}>50 / 30 / 20</Text>
          <View style={styles.splitRow}>
            <View style={styles.splitItem}>
              <View style={[styles.splitDot, { backgroundColor: colors.turquoise }]} />
              <Text style={styles.splitLabel}>50% {t('finance_needs') || 'Necesidades'}</Text>
              <Text style={styles.splitAmount}>{formatMoney(totalIncome * 0.5, lang)}</Text>
            </View>
            <View style={styles.splitItem}>
              <View style={[styles.splitDot, { backgroundColor: colors.gold }]} />
              <Text style={styles.splitLabel}>30% {t('finance_wants') || 'Deseos'}</Text>
              <Text style={styles.splitAmount}>{formatMoney(totalIncome * 0.3, lang)}</Text>
            </View>
            <View style={styles.splitItem}>
              <View style={[styles.splitDot, { backgroundColor: colors.rose }]} />
              <Text style={styles.splitLabel}>20% {t('finance_savings_stat') || 'Ahorro'}</Text>
              <Text style={styles.splitAmount}>{formatMoney(totalIncome * 0.2, lang)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Transactions', { action: 'add', type: 'expense' })}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="remove" size={20} color={colors.error} />
            </View>
            <Text style={styles.actionLabel}>{t('finance_add_expense') || 'Gasto'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Transactions', { action: 'add', type: 'income' })}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="add" size={20} color={colors.success} />
            </View>
            <Text style={styles.actionLabel}>{t('finance_add_income') || 'Ingreso'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Budget')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="pie-chart" size={20} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>{t('finance_budget') || 'Presupuesto'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{t('finance_recent_transactions') || 'Últimas transacciones'}</Text>
        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>{t('finance_no_transactions') || 'Sin transacciones aún'}</Text>
          </View>
        ) : (
          recentTransactions.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <View key={tx.id || tx.date} style={styles.txRow}>
                <View style={[styles.txIcon, isIncome ? styles.txIconIncome : styles.txIconExpense]}>
                  <Ionicons name={isIncome ? 'arrow-down' : 'arrow-up'} size={16} color={isIncome ? colors.success : colors.error} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc}>{getLocalized(tx.category, lang) || (isIncome ? t('finance_income') || 'Ingreso' : t('finance_expenses') || 'Gasto')}</Text>
                  <Text style={styles.txDate}>{tx.date ? formatDate(tx.date, lang) : ''}</Text>
                </View>
                <Text style={[styles.txAmount, isIncome ? styles.txAmountIncome : styles.txAmountExpense]}>
                  {isIncome ? `+${formatMoney(tx.amount, lang)}` : `-${formatMoney(tx.amount, lang)}`}
                </Text>
              </View>
            );
          })
        )}

        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => navigation.navigate('Transactions')}
        >
          <Text style={styles.viewAllText}>{t('finance_view_all') || 'Ver todas las transacciones'}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
