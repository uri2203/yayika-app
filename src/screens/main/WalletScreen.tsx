import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getProfile,
  getTransactions,
  stripeConnectPayout,
  stripeConnectDashboard,
} from '../../config/api';

function formatMoney(n: number) {
  const sign = n >= 0 ? '+' : '';
  return `$${sign}${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
}

export default function WalletScreen({ navigation }: any) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!user) return;
      const [profile, txs] = await Promise.all([
        getProfile(user.id),
        getTransactions(user.id, 20),
      ]);
      setBalance(profile?.balance ?? 0);
      setTransactions(txs);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setWithdrawing(true);
      const res = await stripeConnectPayout();
      if (res.balance !== undefined) setBalance(res.balance);
      Alert.alert(t('wallet_withdraw_success'), res.message ?? '');
      loadData();
    } catch {
      Alert.alert(t('common_error'), t('common_open_link_error'));
    } finally {
      setWithdrawing(false);
    }
  };

  const handleViewInStripe = async () => {
    try {
      const res = await stripeConnectDashboard();
      await WebBrowser.openBrowserAsync(res.url);
    } catch {
      Alert.alert(t('common_error'), t('common_open_link_error'));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('wallet_available')}</Text>
          <Text style={styles.balanceAmount}>
            ${balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </Text>
          <TouchableOpacity
            style={[styles.withdrawButton, withdrawing && { opacity: 0.6 }]}
            onPress={handleWithdraw}
            disabled={withdrawing}
          >
            <Text style={styles.withdrawButtonText}>
              {withdrawing ? t('wallet_withdrawing') : t('wallet_withdraw')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleViewInStripe}>
            <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="arrow-forward" size={20} color={colors.turquoise} />
            </View>
            <Text style={styles.actionText}>{t('wallet_send')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#FDE68A' }]}>
              <Ionicons name="arrow-down" size={20} color={colors.gold} />
            </View>
            <Text style={styles.actionText}>{t('wallet_request')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleViewInStripe}>
            <View style={[styles.actionIcon, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="time" size={20} color={colors.rose} />
            </View>
            <Text style={styles.actionText}>{t('wallet_history')}</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>{t('wallet_history')}</Text>
        {transactions.length === 0 && (
          <Text style={{ color: colors.subtleText, marginBottom: spacing.md }}>
            {t('wallet_no_transactions')}
          </Text>
        )}
        {transactions.map((tx) => {
          const isIncome = tx.amount > 0;
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
                <Text style={styles.txDesc}>{tx.category ?? tx.type}</Text>
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
