import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';

const TRANSACTIONS = [
  { id: '1', desc: 'Comisión afiliada', amount: 89.5, date: '12 ago 2026', type: 'income' as const },
  { id: '2', desc: 'Venta directa', amount: 199, date: '10 ago 2026', type: 'income' as const },
  { id: '3', desc: 'Retiro SPEI', amount: -500, date: '8 ago 2026', type: 'expense' as const },
  { id: '4', desc: 'Comisión afiliada', amount: 45, date: '5 ago 2026', type: 'income' as const },
  { id: '5', desc: 'Membresía Guerrera', amount: 15, date: '3 ago 2026', type: 'income' as const },
  { id: '6', desc: 'Venta Ciclo Productiva', amount: 199, date: '1 ago 2026', type: 'income' as const },
  { id: '7', desc: 'Comisión afiliada', amount: 67.5, date: 'Ago 2026', type: 'income' as const },
  { id: '8', desc: 'Retiro SPEI', amount: -300, date: 'Jul 2026', type: 'expense' as const },
];

function formatMoney(n: number) {
  const sign = n >= 0 ? '+' : '';
  return `$${sign}${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
}

export default function WalletScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          <Text style={styles.balanceAmount}>$1,247.50 MXN</Text>
          <TouchableOpacity style={styles.withdrawButton}>
            <Text style={styles.withdrawButtonText}>Retirar</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="arrow-forward" size={20} color={colors.turquoise} />
            </View>
            <Text style={styles.actionText}>Enviar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#FDE68A' }]}>
              <Ionicons name="arrow-down" size={20} color={colors.gold} />
            </View>
            <Text style={styles.actionText}>Solicitar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="time" size={20} color={colors.rose} />
            </View>
            <Text style={styles.actionText}>Historial</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>Historial de transacciones</Text>
        {TRANSACTIONS.map((tx) => {
          const isIncome = tx.type === 'income';
          return (
            <View key={tx.id} style={styles.txRow}>
              <View
                style={[
                  styles.txIcon,
                  isIncome ? styles.txIconIncome : styles.txIconExpense,
                ]}
              >
                <Ionicons
                  name={isIncome ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={isIncome ? colors.success : colors.error}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{tx.desc}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  isIncome ? styles.txAmountIncome : styles.txAmountExpense,
                ]}
              >
                {formatMoney(tx.amount)}
              </Text>
            </View>
          );
        })}
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
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: typography.sizes.md,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.sm,
  },
  balanceAmount: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.white,
    marginBottom: spacing.lg,
  },
  withdrawButton: {
    backgroundColor: colors.turquoise,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
  },
  withdrawButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
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
});
