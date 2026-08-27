import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiGanaConYayika, GanaConYayikaResponse } from '../../config/api';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function AffiliateDashboardScreen({ navigation }: any) {
  const { currentColors } = useTheme();
  const colors = currentColors;
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<GanaConYayikaResponse | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const result = await aiGanaConYayika({ lang });
      setData(result);
    } catch (err) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, lang]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleCopyCode = async () => {
    const code = data?.dashboard?.referralCode;
    if (!code) return;
    try {
      if (Platform.OS === 'web') {
        if (navigator.clipboard) await navigator.clipboard.writeText(code);
      } else {
        const Clipboard = await import('expo-clipboard');
        await Clipboard.setStringAsync(code);
      }
    } catch { return; }
    Alert.alert(t('aff_copied'), `${t('aff_your_code')}: ${code}`);
  };

  const handleCopyLink = async () => {
    if (!referralLink) return;
    try {
      if (Platform.OS === 'web') {
        if (navigator.clipboard) await navigator.clipboard.writeText(referralLink);
      } else {
        const Clipboard = await import('expo-clipboard');
        await Clipboard.setStringAsync(referralLink);
      }
    } catch { return; }
    Alert.alert(t('aff_copied'), t('aff_link_copied'));
  };

  const handleShare = async () => {
    try {
      const code = data?.dashboard?.referralCode ?? '';
      const link = code ? `https://yayika.app/join/${code}` : '';
      const message = t('aff_share_message').replace('{code}', code);
      await Share.share({ message: `${message} ${link}` });
    } catch {}
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing.md,
      marginBottom: spacing.sm,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: {
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.bold,
      color: colors.text,
    },
    subtitle: {
      fontSize: typography.sizes.md,
      color: colors.subtleText,
      marginBottom: spacing.lg,
    },
    codeCard: { marginBottom: spacing.lg, alignItems: 'center' },
    codeLabel: { fontSize: typography.sizes.sm, color: colors.subtleText, marginBottom: spacing.sm },
    codeRow: { flexDirection: 'row', alignItems: 'center' },
    codeText: {
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.bold,
      color: colors.primary,
      letterSpacing: 2,
      marginRight: spacing.md,
    },
    codeBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 40 },
    linkSection: { marginTop: spacing.md, width: '100%' },
    linkLabel: { fontSize: typography.sizes.xs, color: colors.subtleText, marginBottom: spacing.sm },
    linkActions: { flexDirection: 'row', gap: spacing.sm },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
    statCard: { flex: 1, alignItems: 'center', marginHorizontal: spacing.xs, paddingVertical: spacing.md },
    statValue: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text, marginTop: spacing.sm },
    statLabel: { fontSize: typography.sizes.xs, color: colors.subtleText, marginTop: 2 },
    historyCard: { marginBottom: spacing.md },
    historyTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.text,
      marginBottom: spacing.md,
    },
    historyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    historyInfo: { flex: 1 },
    historyDate: { fontSize: typography.sizes.md, color: colors.text },
    historyStatus: { fontSize: typography.sizes.xs, marginTop: 2 },
    statusPaid: { color: colors.success },
    statusPending: { color: colors.gold },
    historyAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.turquoise },
    emptyText: {
      fontSize: typography.sizes.sm,
      color: colors.subtleText,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
  }), [colors]);

  const referralLink = data?.dashboard?.referralCode
    ? `https://yayika.app/join/${data.dashboard.referralCode}`
    : '';
  const stats = data?.dashboard
    ? [
        { label: t('aff_referrals'), value: String(data.dashboard.stats.referralsCount), icon: 'people' as const, color: colors.primary },
        { label: t('aff_earnings'), value: `$${data.dashboard.earnings.total / 100}`, icon: 'cash' as const, color: colors.gold },
        { label: t('aff_pending'), value: `$${data.dashboard.earnings.pending / 100}`, icon: 'time' as const, color: colors.turquoise },
      ]
    : [];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('aff_title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.subtitle}>{t('aff_subtitle')}</Text>

        <Card style={styles.codeCard}>
          <Text style={styles.codeLabel}>{t('aff_your_code')}</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{data?.dashboard?.referralCode ?? '---'}</Text>
            <Button title={t('aff_copy')} onPress={handleCopyCode} variant="secondary" style={styles.codeBtn} />
          </View>
          {referralLink ? (
            <View style={styles.linkSection}>
              <Text style={styles.linkLabel} numberOfLines={1}>{referralLink}</Text>
              <View style={styles.linkActions}>
                <Button title={t('aff_copy_link')} onPress={handleCopyLink} variant="secondary" style={styles.codeBtn} />
                <Button title={t('aff_share')} onPress={handleShare} variant="primary" style={styles.codeBtn} />
              </View>
            </View>
          ) : null}
        </Card>

        <View style={styles.statsRow}>
          {stats.map((stat, i) => (
            <Card key={i} style={styles.statCard}>
              <Ionicons name={stat.icon} size={22} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        <Card style={styles.historyCard}>
          <Text style={styles.historyTitle}>{t('aff_history')}</Text>
          {(!data?.dashboard?.recent || data.dashboard.recent.length === 0) ? (
            <Text style={styles.emptyText}>{t('aff_no_history')}</Text>
          ) : (
            data.dashboard.recent.slice(0, 10).map((item) => (
              <View key={item.id} style={styles.historyRow}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDate}>{item.date}</Text>
                  <Text style={[styles.historyStatus, item.status === 'paid' ? styles.statusPaid : styles.statusPending]}>
                    {item.status === 'paid' ? t('aff_paid') : t('aff_pending')}
                  </Text>
                </View>
                <Text style={styles.historyAmount}>+${item.amount}</Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
