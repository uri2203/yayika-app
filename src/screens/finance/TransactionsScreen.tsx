import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getTransactions, addTransaction } from '../../config/api';
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

function formatDate(dateStr: string, lang: Language = 'es') {
  const d = new Date(dateStr);
  const months = MONTHS_BY_LANG[lang] || MONTHS_BY_LANG.es;
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

interface TransactionsScreenProps {
  navigation: any;
  route?: any;
}

export default function TransactionsScreen({ navigation, route }: TransactionsScreenProps) {
  const { currentColors } = useTheme();
  const colors = currentColors;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: spacing.lg, paddingTop: spacing.md, marginBottom: spacing.sm,
    },
    backBtn: { padding: spacing.xs },
    title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text },
    summaryBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.white, marginHorizontal: spacing.lg, padding: spacing.md,
      borderRadius: borderRadius.md, marginBottom: spacing.md,
      shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    summaryLabel: { fontSize: typography.sizes.sm, color: colors.subtleText },
    summaryAmount: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
    filterRow: {
      flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm,
    },
    filterBtn: {
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
    },
    filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterBtnIncome: { backgroundColor: colors.success, borderColor: colors.success },
    filterBtnExpense: { backgroundColor: colors.error, borderColor: colors.error },
    filterText: { fontSize: typography.sizes.xs, color: colors.subtleText, fontWeight: typography.weights.medium },
    filterTextActive: { color: colors.white },
    categoryFilterContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.xs },
    catChip: {
      paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full,
      backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, marginRight: spacing.xs,
    },
    catChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
    catChipText: { fontSize: typography.sizes.xs, color: colors.subtleText },
    catChipTextActive: { color: colors.primary, fontWeight: typography.weights.semibold },
    listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
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
    fab: {
      position: 'absolute', right: spacing.lg, bottom: spacing.xl, width: 56, height: 56,
      borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
    },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
    emptyText: { fontSize: typography.sizes.sm, color: colors.subtleText, marginTop: spacing.sm },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: colors.white, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
      padding: spacing.lg, paddingBottom: spacing.xxl,
    },
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md,
    },
    modalTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text },
    typeToggle: { flexDirection: 'row', marginBottom: spacing.md, gap: spacing.sm },
    typeBtn: {
      flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, borderWidth: 1.5,
      borderColor: colors.border, alignItems: 'center',
    },
    typeBtnIncome: { backgroundColor: '#D1FAE5', borderColor: colors.success },
    typeBtnExpense: { backgroundColor: '#FEE2E2', borderColor: colors.error },
    typeBtnText: { fontSize: typography.sizes.sm, color: colors.subtleText },
    typeBtnTextActive: { fontWeight: typography.weights.semibold, color: colors.text },
    inputLabel: { fontSize: typography.sizes.sm, color: colors.subtleText, marginBottom: spacing.xs, marginTop: spacing.sm },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.sizes.md, color: colors.text,
    },
    saveButton: {
      backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md,
      alignItems: 'center', marginTop: spacing.lg,
    },
    saveButtonText: { color: colors.white, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  });

  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (route?.params?.action === 'add') {
      setNewType(route.params.type || 'expense');
      setAddModalVisible(true);
    }
  }, [route?.params]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const txs = await getTransactions(user.id, 100);
      setTransactions(txs || []);
    } catch (e) {
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
      setNewDescription('');
      setNewDate(new Date().toISOString().split('T')[0]);
      fetchData();
    } catch (e) {
      Alert.alert(t('common_error') || 'Error', e instanceof Error ? e.message : (t('finance_save_error') || 'Error al guardar'));
    } finally {
      setSaving(false);
    }
  };

  const filtered = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterCategory && tx.category?.toLowerCase() !== filterCategory.toLowerCase()) return false;
    return true;
  });

  const totalFiltered = filtered.reduce((s, tx) => {
    return tx.type === 'income' ? s + tx.amount : s - tx.amount;
  }, 0);

  const categories = [...new Set(transactions.map((tx) => tx.category).filter(Boolean))];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('finance_transactions') || 'Transacciones'}</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.summaryBar}>
        <Text style={styles.summaryLabel}>{t('finance_total') || 'Total'}:</Text>
        <Text style={[styles.summaryAmount, totalFiltered >= 0 ? { color: colors.success } : { color: colors.error }]}>
          {totalFiltered >= 0 ? '+' : ''}${totalFiltered.toLocaleString()}
        </Text>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filterType === 'all' && styles.filterBtnActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>{t('finance_all') || 'Todos'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filterType === 'income' && styles.filterBtnIncome]}
          onPress={() => setFilterType('income')}
        >
          <Text style={[styles.filterText, filterType === 'income' && styles.filterTextActive]}>{t('finance_income') || 'Ingresos'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filterType === 'expense' && styles.filterBtnExpense]}
          onPress={() => setFilterType('expense')}
        >
          <Text style={[styles.filterText, filterType === 'expense' && styles.filterTextActive]}>{t('finance_expenses') || 'Gastos'}</Text>
        </TouchableOpacity>
      </View>

      {categories.length > 0 && (
        <FlatList
          data={[null, ...categories]}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilterContainer}
          keyExtractor={(item, i) => item || `all-${i}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catChip, filterCategory === item && styles.catChipActive]}
              onPress={() => setFilterCategory(filterCategory === item ? null : item)}
            >
              <Text style={[styles.catChipText, filterCategory === item && styles.catChipTextActive]}>
                {item || (t('finance_all') || 'Todos')}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={64} color={colors.border} />
          <Text style={styles.emptyText}>{t('finance_no_transactions') || 'Sin transacciones'}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id || item.date}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: tx }) => {
            const isIncome = tx.type === 'income';
            return (
              <View style={styles.txRow}>
                <View style={[styles.txIcon, isIncome ? styles.txIconIncome : styles.txIconExpense]}>
                  <Ionicons name={isIncome ? 'arrow-down' : 'arrow-up'} size={16} color={isIncome ? colors.success : colors.error} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc}>{getLocalized(tx.category, lang) || (isIncome ? t('finance_income') || 'Ingreso' : t('finance_expenses') || 'Gasto')}</Text>
                  <Text style={styles.txDate}>{tx.date ? formatDate(tx.date, lang) : ''}</Text>
                </View>
                <Text style={[styles.txAmount, isIncome ? styles.txAmountIncome : styles.txAmountExpense]}>
                  {isIncome ? `+$${(typeof tx.amount === 'number' ? tx.amount : 0).toLocaleString()}` : `-$${(typeof tx.amount === 'number' ? tx.amount : 0).toLocaleString()}`}
                </Text>
              </View>
            );
          }}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      <Modal visible={addModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('finance_add_title') || 'Nueva transacción'}</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeBtn, newType === 'income' && styles.typeBtnIncome]}
                onPress={() => setNewType('income')}
              >
                <Text style={[styles.typeBtnText, newType === 'income' && styles.typeBtnTextActive]}>{t('finance_income') || 'Ingreso'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, newType === 'expense' && styles.typeBtnExpense]}
                onPress={() => setNewType('expense')}
              >
                <Text style={[styles.typeBtnText, newType === 'expense' && styles.typeBtnTextActive]}>{t('finance_expenses') || 'Gasto'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t('finance_amount') || 'Monto'}</Text>
            <TextInput style={styles.input} placeholder="$0.00" keyboardType="numeric" value={newAmount} onChangeText={setNewAmount} />

            <Text style={styles.inputLabel}>{t('finance_category') || 'Categoría'}</Text>
            <TextInput style={styles.input} placeholder={t('finance_category_placeholder') || 'Ej: Comida, Transporte...'} value={newCategory} onChangeText={setNewCategory} />

            <Text style={styles.inputLabel}>{t('finance_description') || 'Descripción'}</Text>
            <TextInput style={styles.input} placeholder={t('finance_description_placeholder') || 'Nota opcional'} value={newDescription} onChangeText={setNewDescription} />

            <Text style={styles.inputLabel}>{t('finance_date') || 'Fecha'}</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={newDate} onChangeText={setNewDate} />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddTransaction}
              disabled={saving || !newAmount}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>{t('finance_save') || 'Guardar'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
