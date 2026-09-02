import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { typography, spacing, borderRadius } from '../../config/theme';
import { supabase } from '../../config/supabase';

const AVATAR_COLORS = ['#4E3470', '#2DD4BF', '#F472B6', '#D4A843', '#10B981', '#EF4444'];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

export default function ProfileScreen({ navigation }: any) {
  const { user, profile, progress, signOut } = useAuth();
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const [subscription, setSubscription] = useState<any>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const [moduleCount, setModuleCount] = useState(0);
  const colors = currentColors;

  const userName = profile?.full_name || user?.user_metadata?.name || t('profile_default_name');
  const userEmail = profile?.email || user?.email || '';
  const countryCode = profile?.country_code || '';

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [subRes, badgeRes, progressRes] = await Promise.all([
          supabase.from('yayika_subscriptions').select('plan').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('yayika_xp_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('event_type', 'badge'),
          supabase.from('yayika_progress').select('modules_completed').eq('user_id', user.id).maybeSingle(),
        ]);
        if (subRes.data) setSubscription(subRes.data);
        if (badgeRes.count != null) setBadgeCount(badgeRes.count);
        if (progressRes.data?.modules_completed != null) setModuleCount(progressRes.data.modules_completed);
      } catch (err) {
      }
    })();
  }, [user]);

  const planName = subscription?.plan_name || subscription?.plan || null;

  const getTierLabel = (plan: string | null): string => {
    if (!plan) return '';
    const lower = plan.toLowerCase();
    if (lower.includes('semilla') || lower.includes('seed')) return t('mem_semilla');
    if (lower.includes('guerrera') || lower.includes('warrior')) return t('mem_guerrera');
    if (lower.includes('diamante') || lower.includes('diamond')) return t('mem_diamante');
    return plan;
  };

  const getTierIcon = (plan: string | null): keyof typeof Ionicons.glyphMap => {
    if (!plan) return 'leaf-outline';
    const lower = plan.toLowerCase();
    if (lower.includes('semilla') || lower.includes('seed')) return 'leaf-outline';
    if (lower.includes('guerrera') || lower.includes('warrior')) return 'shield-outline';
    if (lower.includes('diamante') || lower.includes('diamond')) return 'diamond-outline';
    return 'star-outline';
  };

  const handleSignOut = () => {
    Alert.alert(t('profile_sign_out'), t('profile_sign_out_confirm'), [
      { text: t('common_cancel'), style: 'cancel' },
      { text: t('profile_sign_out'), onPress: signOut, style: 'destructive' },
    ]);
  };

  const [updateState, setUpdateState] = useState('');

  const checkForUpdates = async () => {
    try {
      setUpdateState('checking');
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        setUpdateState('downloading');
        await Updates.fetchUpdateAsync();
        Alert.alert(t('update_found_title'), t('update_found_msg'), [
          {
            text: t('update_restart'),
            onPress: async () => {
              await Updates.reloadAsync();
            },
          },
          { text: t('common_cancel'), style: 'cancel' },
        ]);
      } else {
        setUpdateState('none');
        Alert.alert(t('update_none_title'), t('update_none_msg'));
      }
    } catch (e) {
      setUpdateState('');
      Alert.alert(t('common_error'), t('update_error'));
    }
  };

  const appVersion = Constants.expoConfig?.version || '1.5.0';
  const nativeBuild = Application.nativeBuildVersion || '1';
  const updateId = Updates.updateId ? Updates.updateId.slice(0, 8) : 'default';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('nav_profile')}</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(userName) }]}>
            <Text style={styles.avatarText}>{getInitials(userName)}</Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
          <Text style={[styles.userEmail, { color: colors.subtleText }]}>{userEmail}</Text>
          {countryCode && (
            <Text style={[styles.userLocation, { color: colors.subtleText }]}>
              {countryCode}
            </Text>
          )}
          {planName && (
            <View style={[styles.planBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name={getTierIcon(planName)} size={14} color={colors.primary} />
              <Text style={[styles.planText, { color: colors.primary }]}>{getTierLabel(planName)}</Text>
            </View>
          )}
        </View>

        <View style={[styles.statsCard, { backgroundColor: colors.white }]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{progress?.xp_total ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.subtleText }]}>{t('home_xp')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{progress?.streak_days ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.subtleText }]}>{t('home_streak')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{badgeCount}</Text>
              <Text style={[styles.statLabel, { color: colors.subtleText }]}>{t('home_unlocked')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{moduleCount}</Text>
              <Text style={[styles.statLabel, { color: colors.subtleText }]}>{t('courses_modules')}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.menuCard, { backgroundColor: colors.white }]}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Settings')}>
            <View style={styles.menuLeft}>
              <Ionicons name="settings-outline" size={22} color={colors.primary} />
              <Text style={[styles.menuText, { color: colors.text }]}>{t('profile_settings')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('AffiliateDashboard')}>
            <View style={styles.menuLeft}>
              <Ionicons name="people-outline" size={22} color={colors.turquoise} />
              <Text style={[styles.menuText, { color: colors.text }]}>{t('aff_title')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Legal')}>
            <View style={styles.menuLeft}>
              <Ionicons name="document-text-outline" size={22} color={colors.gold} />
              <Text style={[styles.menuText, { color: colors.text }]}>{t('legal_title')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('Support')}>
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={22} color={colors.rose} />
              <Text style={[styles.menuText, { color: colors.text }]}>{t('support_title')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.updateButton} onPress={checkForUpdates}>
          <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
          <Text style={[styles.updateText, { color: colors.primary }]}>
            {updateState === 'checking' ? t('update_checking') : updateState === 'downloading' ? t('update_downloading') : t('update_check')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>{t('profile_sign_out')}</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.subtleText }]}>
          {t('profile_version')} {appVersion} ({nativeBuild}) · {updateId}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.lg },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: 34, fontWeight: typography.weights.bold, color: '#FFFFFF' },
  userName: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  userEmail: { fontSize: typography.sizes.md, marginTop: spacing.xs },
  userLocation: { fontSize: typography.sizes.sm, marginTop: spacing.xs },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  planText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, marginLeft: spacing.xs },
  statsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold },
  statLabel: { fontSize: typography.sizes.xs, marginTop: spacing.xs },
  statDivider: { width: 1, height: 32 },
  menuCard: { borderRadius: borderRadius.lg, marginBottom: spacing.md, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { fontSize: typography.sizes.md, marginLeft: spacing.md },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: '#D4B8F5',
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  updateText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, marginLeft: spacing.sm },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  signOutText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, marginLeft: spacing.sm },
  version: { textAlign: 'center', fontSize: typography.sizes.xs, marginTop: spacing.sm },
});
