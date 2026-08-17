import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getTransactions, addTransaction, aiFinancialCoach } from '../../config/api';

const BUDGET_LIMIT = 5000;

function formatMoney(n: number) {
  const sign = n >= 0 ? '+' : '';
  return `$${sign}${n.toLocaleString('es-MX')}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDate();
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${day} ${months[d.getMonth()]}`;
}

export default function FinancialTrackerScreen({ navigation }: any) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [advice, setAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const txs = await getTransactions(user.id);
      setTransactions(txs || []);

      if (txs && txs.length > 0) {
        const monthlyTxs = txs.slice(0, 50);
        const totalIncome = monthlyTxs
          .filter((tx: any) => tx.type === 'income')
          .reduce((s: number, tx: any) => s + tx.amount, 0);
        const totalExpenses = monthlyTxs
          .filter((tx: any) => tx.type === 'expense')
          .reduce((s: number, tx: any) => s + tx.amount, 0);
        const categories: Record<string, { total: number; count: number }> = {};
        monthlyTxs.filter((tx: any) => tx.type === 'expense').forEach((tx: any) => {
          const cat = tx.category || 'Otros';
          if (!categories[cat]) categories[cat] = { total: 0, count: 0 };
          categories[cat].total += tx.amount;
          categories[cat].count += 1;
        });
        const topCategories = Object.entries(categories)
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 5)
          .map(([name, data]) => ({
            name,
            total: data.total,
            percentage: totalExpenses > 0 ? Math.round((data.total / totalExpenses) * 100) : 0,
          }));

        try {
          setLoadingAdvice(true);
          const result = await aiFinancialCoach({
            user_id: user.id,
            transactions: monthlyTxs.map((tx: any) => ({
              type: tx.type as 'expense' | 'income',
              amount: tx.amount,
              category: tx.category,
              date: tx.date,
            })),
            monthly_summary: { totalIncome, totalExpenses, topCategories },
          });
          setAdvice(result.advice || '');
        } catch (e) {
          console.log('Financial coach error:', e);
        } finally {
          setLoadingAdvice(false);
        }
      }
    } catch (e) {
      console.log('Fetch transactions error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddTransaction = async () => {
    if (!user || !newAmount || parseFloat(newAmount) <= 0) return;
    try {
      setSaving(true);
      await addTransaction(user.id, {
        type: newType,
        amount: parseFloat(newAmount),
        category: newCategory || undefined,
        date: newDate,
      });
      setAddModalVisible(false);
      setNewAmount('');
      setNewCategory('');
      setNewDate(new Date().toISOString().split('T')[0]);
      Alert.alert(t('finance_saved_title') || 'Guardado', t('finance_saved_msg') || 'Transacción registrada');
      fetchData();
    } catch (e) {
      console.log('Add transaction error:', e);
    } finally {
      setSaving(false);
    }
  };

  const TOTAL_INCOME = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((s, tx) => s + tx.amount, 0);
  const TOTAL_EXPENSES = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((s, tx) => s + tx.amount, 0);
  const BALANCE = TOTAL_INCOME - TOTAL_EXPENSES;

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (a.date && b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
    return 0;
  });
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('finance_title')}</Text>
          <Text style={styles.subtitle}>{t('finance_month')}</Text>
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
            <Text style={styles.statLabel}>{t('finance_incomes_stat')}</Text>
            <Text style={[styles.statAmount, { color: colors.success }]}>
              ${TOTAL_INCOME.toLocaleString('es-MX')}
            </Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.error }]}>
            <Text style={styles.statLabel}>{t('finance_expenses_stat')}</Text>
            <Text style={[styles.statAmount, { color: colors.error }]}>
              ${TOTAL_EXPENSES.toLocaleString('es-MX')}
            </Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.turquoise }]}>
            <Text style={styles.statLabel}>{t('finance_savings_stat')}</Text>
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
            {t('finance_budget_remaining')} ${(BUDGET_LIMIT - TOTAL_EXPENSES).toLocaleString('es-MX')} {t('finance_budget_available')}
          </Text>
        </View>

        {/* Transactions */}
        <Text style={styles.sectionTitle}>{t('finance_recent_transactions')}</Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : sortedTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>{t('finance_no_transactions') || 'Sin transacciones aún'}</Text>
          </View>
        ) : (
          sortedTransactions.slice(0, 20).map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <View key={tx.id || tx.date} style={styles.txRow}>
                <View style={[styles.txIcon, isIncome ? styles.txIconIncome : styles.txIconExpense]}>
                  <Ionicons
                    name={isIncome ? 'arrow-down' : 'arrow-up'}
                    size={16}
                    color={isIncome ? colors.success : colors.error}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc}>{tx.category || (isIncome ? 'Ingreso' : 'Gasto')}</Text>
                  <Text style={styles.txDate}>{tx.date ? formatDate(tx.date) : ''}</Text>
                </View>
                <Text style={[styles.txAmount, isIncome ? styles.txAmountIncome : styles.txAmountExpense]}>
                  {isIncome ? `+$${tx.amount.toLocaleString('es-MX')}` : `-$${tx.amount.toLocaleString('es-MX')}`}
                </Text>
              </View>
            );
          })
        )}

        {/* AI Financial Advice */}
        {loadingAdvice && (
          <View style={styles.adviceCard}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.adviceLoading}>{t('finance_coaching') || 'Obteniendo consejos...'}</Text>
          </View>
        )}
        {!loadingAdvice && advice ? (
          <View style={styles.adviceCard}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
            <Text style={styles.adviceText}>{advice}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Add Transaction Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('finance_add_title') || 'Nueva transacción'}</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeBtn, newType === 'income' && styles.typeBtnActive]}
                onPress={() => setNewType('income')}
              >
                <Text style={[styles.typeBtnText, newType === 'income' && styles.typeBtnTextActive]}>
                  {t('finance_income') || 'Ingreso'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, newType === 'expense' && styles.typeBtnActiveExpense]}
                onPress={() => setNewType('expense')}
              >
                <Text style={[styles.typeBtnText, newType === 'expense' && styles.typeBtnTextActive]}>
                  {t('finance_expenses') || 'Gasto'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t('finance_amount') || 'Monto'}</Text>
            <TextInput
              style={styles.input}
              placeholder="$0.00"
              keyboardType="numeric"
              value={newAmount}
              onChangeText={setNewAmount}
            />

            <Text style={styles.inputLabel}>{t('finance_category') || 'Categoría'}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('finance_category_placeholder') || 'Ej: Comida, Transporte...'}
              value={newCategory}
              onChangeText={setNewCategory}
            />

            <Text style={styles.inputLabel}>{t('finance_date') || 'Fecha'}</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={newDate}
              onChangeText={setNewDate}
            />

            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleAddTransaction}
              disabled={saving || !newAmount}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.modalSaveText}>{t('finance_save') || 'Guardar'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    marginTop: spacing.sm,
  },
  adviceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EDE7F6',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  adviceLoading: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    marginLeft: spacing.sm,
  },
  adviceText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  typeToggle: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: '#D1FAE5',
    borderColor: colors.success,
  },
  typeBtnActiveExpense: {
    backgroundColor: '#FEE2E2',
    borderColor: colors.error,
  },
  typeBtnText: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
  },
  typeBtnTextActive: {
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  modalSaveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  modalSaveText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
