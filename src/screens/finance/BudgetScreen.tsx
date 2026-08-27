import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getTransactions } from '../../config/api';

const CATEGORIES = [
  { key: 'food', icon: 'restaurant', color: '#F59E0B' },
  { key: 'transport', icon: 'car', color: '#3B82F6' },
  { key: 'housing', icon: 'home', color: '#8B5CF6' },
  { key: 'entertainment', icon: 'film', color: '#EC4899' },
  { key: 'health', icon: 'medical', color: '#10B981' },
  { key: 'education', icon: 'school', color: '#06B6D4' },
  { key: 'clothing', icon: 'shirt', color: '#F97316' },
  { key: 'other', icon: 'ellipsis-horizontal', color: '#6B7280' },
];

interface BudgetData {
  income: number;
}

function formatMoney(n: number, lang: string = 'es') {
  const locale = lang === 'es' ? 'es-MX' : lang === 'pt' ? 'pt-BR' : 'en-US';
  return `$${n.toLocaleString(locale)}`;
}

export default function BudgetScreen({ navigation }: any) {
  const { currentColors } = useTheme();
  const colors = currentColors;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingTop: spacing.md, marginBottom: spacing.lg,
    },
    backBtn: { padding: spacing.xs },
    title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text },
    incomeSection: {
      backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.lg,
      marginBottom: spacing.lg, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    incomeLabel: { fontSize: typography.sizes.sm, color: colors.subtleText, marginBottom: spacing.xs },
    incomeDisplay: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    incomeAmount: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: colors.primary },
    incomeEdit: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    incomeInput: {
      flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold, color: colors.text,
    },
    incomeSaveBtn: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
      justifyContent: 'center', alignItems: 'center',
    },
    splitSection: { marginBottom: spacing.lg },
    sectionTitle: {
      fontSize: typography.sizes.lg, fontWeight: typography.weights.bold,
      color: colors.text, marginBottom: spacing.md,
    },
    splitCard: {
      backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md,
      shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06,
      shadowRadius: 6, elevation: 2,
    },
    splitItem: { marginBottom: spacing.md },
    splitHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
    splitDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
    splitLabel: { fontSize: typography.sizes.sm, color: colors.text, fontWeight: typography.weights.medium },
    splitAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text, marginLeft: spacing.lg },
    progressBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginTop: spacing.xs },
    progressFill: { height: '100%', borderRadius: 3 },
    categoryRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.white, borderRadius: borderRadius.sm, padding: spacing.md,
      marginBottom: spacing.sm, shadowColor: colors.black, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
    },
    categoryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    categoryIcon: {
      width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
    },
    categoryName: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.text },
    categoryAmount: { fontSize: typography.sizes.xs, color: colors.subtleText, marginTop: 2 },
    categoryRight: { flexDirection: 'row', alignItems: 'center', width: 120 },
    categoryBar: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginRight: spacing.sm },
    categoryFill: { height: '100%', borderRadius: 3 },
    categoryPct: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.subtleText, width: 32, textAlign: 'right' },
  });

  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState(0);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
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

  const saveIncome = async () => {
    const val = parseFloat(incomeInput) || 0;
    setIncome(val);
    setEditingIncome(false);
  };

  const now = new Date();
  const monthExpenses = transactions
    .filter((tx) => {
      if (tx.type !== 'expense' || !tx.date) return false;
      const d = new Date(tx.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

  const totalExpenses = monthExpenses.reduce((s, tx) => s + (typeof tx.amount === 'number' ? tx.amount : 0), 0);

  const categorySpending: Record<string, number> = {};
  monthExpenses.forEach((tx) => {
    const cat = (tx.category || 'other').toLowerCase();
    if (!categorySpending[cat]) categorySpending[cat] = 0;
    categorySpending[cat] += tx.amount;
  });

  const needsAmount = income * 0.5;
  const wantsAmount = income * 0.3;
  const savingsAmount = income * 0.2;

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
          <Text style={styles.title}>{t('finance_budget') || 'Presupuesto'}</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.incomeSection}>
          <Text style={styles.incomeLabel}>{t('finance_income') || 'Ingreso mensual'}</Text>
          {editingIncome ? (
            <View style={styles.incomeEdit}>
              <TextInput
                style={styles.incomeInput}
                keyboardType="numeric"
                value={incomeInput}
                onChangeText={setIncomeInput}
                autoFocus
              />
              <TouchableOpacity style={styles.incomeSaveBtn} onPress={saveIncome}>
                <Ionicons name="checkmark" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.incomeDisplay} onPress={() => { setIncomeInput(String(income)); setEditingIncome(true); }}>
              <Text style={styles.incomeAmount}>{formatMoney(income, lang)}</Text>
              <Ionicons name="pencil" size={16} color={colors.subtleText} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.splitSection}>
          <Text style={styles.sectionTitle}>50 / 30 / 20</Text>
          <View style={styles.splitCard}>
            <View style={styles.splitItem}>
              <View style={styles.splitHeader}>
                <View style={[styles.splitDot, { backgroundColor: colors.turquoise }]} />
                <Text style={styles.splitLabel}>50% {t('finance_needs') || 'Necesidades'}</Text>
              </View>
              <Text style={styles.splitAmount}>{formatMoney(needsAmount, lang)}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min((totalExpenses * 0.625 / needsAmount) * 100, 100)}%`, backgroundColor: colors.turquoise }]} />
              </View>
            </View>
            <View style={styles.splitItem}>
              <View style={styles.splitHeader}>
                <View style={[styles.splitDot, { backgroundColor: colors.gold }]} />
                <Text style={styles.splitLabel}>30% {t('finance_wants') || 'Deseos'}</Text>
              </View>
              <Text style={styles.splitAmount}>{formatMoney(wantsAmount, lang)}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min((totalExpenses * 0.375 / wantsAmount) * 100, 100)}%`, backgroundColor: colors.gold }]} />
              </View>
            </View>
            <View style={styles.splitItem}>
              <View style={styles.splitHeader}>
                <View style={[styles.splitDot, { backgroundColor: colors.rose }]} />
                <Text style={styles.splitLabel}>20% {t('finance_savings_stat') || 'Ahorro'}</Text>
              </View>
              <Text style={styles.splitAmount}>{formatMoney(savingsAmount, lang)}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min((savingsAmount / (income || 1)) * 100, 100)}%`, backgroundColor: colors.rose }]} />
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('finance_categories') || 'Gastos por categoría'}</Text>
        {CATEGORIES.map((cat) => {
          const spent = categorySpending[cat.key] || 0;
          const pct = totalExpenses > 0 ? (spent / totalExpenses) * 100 : 0;
          return (
            <View key={cat.key} style={styles.categoryRow}>
              <View style={styles.categoryLeft}>
                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                  <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                </View>
                <View>
                  <Text style={styles.categoryName}>{t(`category_${cat.key}`) || cat.key}</Text>
                  <Text style={styles.categoryAmount}>{formatMoney(spent, lang)}</Text>
                </View>
              </View>
              <View style={styles.categoryRight}>
                <View style={styles.categoryBar}>
                  <View style={[styles.categoryFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
                </View>
                <Text style={styles.categoryPct}>{Math.round(pct)}%</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
