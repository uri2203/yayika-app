import React, { useState } from 'react';
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

const PODIUM = [
  { rank: 2, name: 'María G.', xp: 2450 },
  { rank: 1, name: 'Ana L.', xp: 3120 },
  { rank: 3, name: 'Laura P.', xp: 1890 },
];

const LIST = [
  { rank: 4, name: 'Carmen R.', xp: 1650 },
  { rank: 5, name: 'Sofía M.', xp: 1420 },
  { rank: 6, name: 'Isabel T.', xp: 1280 },
  { rank: 7, name: 'Patricia V.', xp: 1150 },
  { rank: 8, name: 'Rosa C.', xp: 980 },
  { rank: 9, name: 'Elena S.', xp: 870 },
  { rank: 10, name: 'Julia F.', xp: 750 },
];

const TABS = ['Semanal', 'Mensual', 'Total'];

function PodiumAvatar({ rank }: { rank: number }) {
  const isFirst = rank === 1;
  const size = isFirst ? 64 : 48;
  return (
    <View
      style={[
        styles.podiumAvatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: isFirst ? colors.gold : colors.border,
          borderWidth: isFirst ? 3 : 2,
        },
      ]}
    >
      <Text style={[styles.podiumInitial, { fontSize: isFirst ? 24 : 18 }]}>
        {PODIUM.find((p) => p.rank === rank)?.name.charAt(0)}
      </Text>
    </View>
  );
}

export default function RankingsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="flame" size={24} color={colors.gold} />
            <Text style={styles.title}>Rankings</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === i && styles.tabActive]}
              onPress={() => setActiveTab(i)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === i && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Podium */}
        <View style={styles.podiumContainer}>
          {/* 2nd place */}
          <View style={styles.podiumColumn}>
            <PodiumAvatar rank={2} />
            <Text style={styles.podiumName}>María G.</Text>
            <Text style={styles.podiumXp}>2,450 XP</Text>
            <View style={[styles.podiumBar, styles.podiumBarSecond]}>
              <Text style={styles.podiumRank}>2</Text>
            </View>
          </View>

          {/* 1st place */}
          <View style={[styles.podiumColumn, styles.podiumColumnFirst]}>
            <Ionicons name="star" size={20} color={colors.gold} style={styles.crownIcon} />
            <PodiumAvatar rank={1} />
            <Text style={styles.podiumName}>Ana L.</Text>
            <Text style={styles.podiumXp}>3,120 XP</Text>
            <View style={[styles.podiumBar, styles.podiumBarFirst]}>
              <Text style={styles.podiumRank}>1</Text>
            </View>
          </View>

          {/* 3rd place */}
          <View style={styles.podiumColumn}>
            <PodiumAvatar rank={3} />
            <Text style={styles.podiumName}>Laura P.</Text>
            <Text style={styles.podiumXp}>1,890 XP</Text>
            <View style={[styles.podiumBar, styles.podiumBarThird]}>
              <Text style={styles.podiumRank}>3</Text>
            </View>
          </View>
        </View>

        {/* List */}
        <View style={styles.listContainer}>
          {LIST.map((item) => (
            <View key={item.rank} style={styles.listRow}>
              <Text style={styles.listRank}>{item.rank}</Text>
              <View style={styles.listAvatar}>
                <Text style={styles.listInitial}>{item.name.charAt(0)}</Text>
              </View>
              <Text style={styles.listName}>{item.name}</Text>
              <Text style={styles.listXp}>{item.xp.toLocaleString('es-MX')} XP</Text>
            </View>
          ))}
        </View>

        {/* Your position */}
        <View style={styles.yourPosition}>
          <Ionicons name="person" size={18} color={colors.primary} />
          <Text style={styles.yourPositionText}>Tu posición: #15 - 420 XP</Text>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.subtleText,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  podiumColumn: {
    flex: 1,
    alignItems: 'center',
  },
  podiumColumnFirst: {
    marginHorizontal: spacing.md,
  },
  crownIcon: {
    marginBottom: spacing.xs,
  },
  podiumAvatar: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  podiumInitial: {
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  podiumName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  podiumXp: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginBottom: spacing.sm,
  },
  podiumBar: {
    width: '100%',
    height: 48,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumBarFirst: {
    height: 72,
    backgroundColor: colors.gold,
  },
  podiumBarSecond: {
    height: 56,
    backgroundColor: colors.border,
  },
  podiumBarThird: {
    height: 44,
    backgroundColor: '#CD7F32',
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
  listRank: {
    width: 28,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.subtleText,
    textAlign: 'center',
  },
  listAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  listInitial: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  listName: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  listXp: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gold,
  },
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
