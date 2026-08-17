import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Share, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiGanaConYayika, aiShareEarn, GanaConYayikaResponse, ShareEarnResponse } from '../../config/api';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function AffiliateScreen() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [affiliateData, setAffiliateData] = useState<GanaConYayikaResponse | null>(null);
  const [shareData, setShareData] = useState<ShareEarnResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [aff, share] = await Promise.all([
        aiGanaConYayika({ lang }),
        aiShareEarn({ lang }),
      ]);
      setAffiliateData(aff);
      setShareData(share);
    } catch (e) {
      console.error('Failed to load affiliate data', e);
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

  const affiliateCode = affiliateData?.affiliate_code ?? '';
  const referralLink = affiliateData?.referral_link ?? '';
  const stats = affiliateData
    ? [
        { label: t('aff_referrals'), value: String(affiliateData.stats.total_referrals), icon: 'people' as keyof typeof Ionicons.glyphMap, color: colors.primary },
        { label: t('aff_earnings'), value: `$${affiliateData.stats.total_earnings}`, icon: 'cash' as keyof typeof Ionicons.glyphMap, color: colors.gold },
        { label: t('aff_pending'), value: `$${affiliateData.stats.pending_earnings}`, icon: 'time' as keyof typeof Ionicons.glyphMap, color: colors.turquoise },
      ]
    : [];

  const history = affiliateData?.history ?? [];

  const handleShare = async () => {
    try {
      const message = shareData?.share_message ?? t('aff_share_message').replace('{code}', affiliateCode);
      await Share.share({ message });
    } catch {}
  };

  const handleCopyCode = async () => {
    try {
      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(affiliateCode);
        }
      } else {
        const Clipboard = await import('expo-clipboard');
        await Clipboard.setStringAsync(affiliateCode);
      }
    } catch {
      return;
    }
    Alert.alert(t('aff_copied'), `${t('aff_your_code')}: ${affiliateCode}`);
  };

  const handleCopyLink = async () => {
    if (!referralLink) return;
    try {
      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(referralLink);
        }
      } else {
        const Clipboard = await import('expo-clipboard');
        await Clipboard.setStringAsync(referralLink);
      }
    } catch {
      return;
    }
    Alert.alert(t('aff_copied'), t('aff_link_copied'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.title}>{t('aff_title')}</Text>
        <Text style={styles.subtitle}>{t('aff_subtitle')}</Text>

        <Card style={styles.codeCard}>
          <Text style={styles.codeLabel}>{t('aff_your_code')}</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{affiliateCode}</Text>
            <Button
              title={t('aff_copy')}
              onPress={handleCopyCode}
              variant="secondary"
              style={styles.copyButton}
            />
          </View>
          {referralLink ? (
            <View style={styles.linkRow}>
              <Text style={styles.linkLabel} numberOfLines={1}>{referralLink}</Text>
              <Button
                title={t('aff_copy_link')}
                onPress={handleCopyLink}
                variant="secondary"
                style={styles.copyButton}
              />
            </View>
          ) : null}
        </Card>

        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <Card key={index} style={styles.statCard}>
              <Ionicons name={stat.icon} size={22} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        <Button
          title={t('aff_share')}
          onPress={handleShare}
          variant="primary"
          style={styles.shareButton}
        />

        {shareData?.earnings ? (
          <Card style={styles.historyCard}>
            <Text style={styles.historyTitle}>{t('aff_share_earnings')}</Text>
            <Text style={styles.shareEarningsValue}>${shareData.earnings}</Text>
          </Card>
        ) : null}

        <Card style={styles.historyCard}>
          <Text style={styles.historyTitle}>{t('aff_history')}</Text>
          {history.length === 0 && !loading ? (
            <Text style={styles.emptyText}>{t('aff_no_history')}</Text>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyRow}>
                <View>
                  <Text style={styles.historyDate}>{item.date}</Text>
                  <Text
                    style={[
                      styles.historyStatus,
                      item.status === 'paid' ? styles.paid : styles.pending,
                    ]}
                  >
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    paddingTop: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.subtleText,
    marginBottom: spacing.lg,
  },
  codeCard: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    marginBottom: spacing.sm,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeText: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    letterSpacing: 2,
    marginRight: spacing.md,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  linkLabel: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    marginRight: spacing.md,
    flex: 1,
  },
  copyButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    paddingVertical: spacing.md,
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginTop: 2,
  },
  shareButton: {
    marginBottom: spacing.lg,
  },
  historyCard: {
    marginBottom: spacing.md,
  },
  historyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  shareEarningsValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.gold,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDate: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  historyStatus: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  paid: {
    color: colors.success,
  },
  pending: {
    color: colors.gold,
  },
  historyAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.turquoise,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
