import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getRankings, RankingEntry } from '../../config/api';

const PODIUM_HEIGHTS: Record<number, number> = { 1: 80, 2: 64, 3: 52 };
const safeName = (name: any) => (typeof name === 'string' && name.trim()) || 'Guerrera';
const safeNum = (n: any) => (typeof n === 'number' && !isNaN(n)) ? n : 0;

export default function RankingsScreen({ navigation }: any) {
  const { currentColors } = useTheme();
  const colors = currentColors;
  const PODIUM_COLORS: Record<number, string> = { 1: colors.gold, 2: '#C0C0C0', 3: '#CD7F32' };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing.md,
      marginBottom: spacing.lg,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: {
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.bold,
      color: colors.text,
    },
    podiumContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-end',
      marginBottom: spacing.xl,
      paddingHorizontal: spacing.sm,
    },
    podiumColumn: { flex: 1, alignItems: 'center' },
    crownIcon: { marginBottom: spacing.xs },
    podiumAvatar: {
      backgroundColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    podiumInitial: { fontWeight: typography.weights.bold, color: colors.text },
    podiumName: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.text,
      textAlign: 'center',
      maxWidth: 80,
    },
    podiumXp: {
      fontSize: typography.sizes.xs,
      color: colors.subtleText,
      marginBottom: spacing.sm,
    },
    podiumBar: {
      width: '100%',
      borderRadius: borderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    podiumRank: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.white,
    },
    listContainer: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      marginBottom: spacing.lg,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    listRowMe: {
      backgroundColor: colors.primary + '10',
    },
    listRank: {
      width: 28,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: colors.subtleText,
      textAlign: 'center',
    },
    listRankMe: { color: colors.primary },
    listAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: spacing.sm,
    },
    listAvatarMe: { backgroundColor: colors.primary + '30' },
    listInitial: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.primary },
    listInitialMe: { color: colors.primary },
    listInfo: { flex: 1 },
    listName: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.text },
    listNameMe: { fontWeight: typography.weights.bold, color: colors.primary },
    listLevel: { fontSize: typography.sizes.xs, color: colors.subtleText, marginTop: 2 },
    listXp: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.gold },
    yourPosition: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary + '15',
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.primary + '40',
    },
    yourPositionText: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: colors.primary,
      marginLeft: spacing.sm,
    },
  });

  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<RankingEntry | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await getRankings(20);
      setRankings(data.rankings);

      const myRank = data.rankings.find((r) => r.user_id === user?.id) ?? null;
      setCurrentUserRank(myRank);
    } catch (err) {
      console.error('Failed to load rankings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const top3 = rankings.filter((r) => r.rank <= 3);
  const rest = rankings.filter((r) => r.rank > 3);

  const getPodiumOrder = () => {
    const sorted = [...top3].sort((a, b) => {
      if (a.rank === 1) return 1;
      if (b.rank === 1) return -1;
      return a.rank - b.rank;
    });
    return sorted;
  };
  const podium = getPodiumOrder();

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
          <Text style={styles.headerTitle}>{t('rankings_title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {top3.length > 0 && (
          <View style={styles.podiumContainer}>
            {podium.map((entry) => {
              const isFirst = entry.rank === 1;
              const size = isFirst ? 64 : 48;
              const barHeight = PODIUM_HEIGHTS[entry.rank] ?? 48;
              return (
                <View key={entry.user_id} style={styles.podiumColumn}>
                  {isFirst && <Ionicons name="star" size={20} color={colors.gold} style={styles.crownIcon} />}
                  <View
                    style={[
                      styles.podiumAvatar,
                      {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderColor: PODIUM_COLORS[entry.rank],
                        borderWidth: isFirst ? 3 : 2,
                      },
                    ]}
                  >
                    <Text style={[styles.podiumInitial, { fontSize: isFirst ? 24 : 18 }]}>
                      {safeName(entry.full_name).charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{safeName(entry.full_name)}</Text>
                  <Text style={styles.podiumXp}>{safeNum(entry.xp_total).toLocaleString()} XP</Text>
                  <View style={[styles.podiumBar, { height: barHeight, backgroundColor: PODIUM_COLORS[entry.rank] }]}>
                    <Text style={styles.podiumRank}>{entry.rank}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {rest.length > 0 && (
          <View style={styles.listContainer}>
            {rest.map((entry) => {
              const isMe = entry.user_id === user?.id;
              return (
                <View
                  key={entry.user_id}
                  style={[styles.listRow, isMe && styles.listRowMe]}
                >
                  <Text style={[styles.listRank, isMe && styles.listRankMe]}>{entry.rank}</Text>
                  <View style={[styles.listAvatar, isMe && styles.listAvatarMe]}>
                    <Text style={[styles.listInitial, isMe && styles.listInitialMe]}>
                      {safeName(entry.full_name).charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={[styles.listName, isMe && styles.listNameMe]} numberOfLines={1}>
                      {safeName(entry.full_name)}
                    </Text>
                    <Text style={styles.listLevel}>{t('home_level')} {entry.level}</Text>
                  </View>
                  <Text style={styles.listXp}>{safeNum(entry.xp_total).toLocaleString()} XP</Text>
                </View>
              );
            })}
          </View>
        )}

        {currentUserRank && (
          <View style={styles.yourPosition}>
            <Ionicons name="person" size={18} color={colors.primary} />
            <Text style={styles.yourPositionText}>
              {t('rankings_your_position')}: #{currentUserRank.rank} - {safeNum(currentUserRank.xp_total).toLocaleString()} XP
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
