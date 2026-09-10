import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getCircles, getMyCircles, joinCircle, leaveCircle, Circle } from '../../config/api';

const CATEGORIES = [
  { key: 'all', icon: 'grid', label: 'Todos' },
  { key: 'emprendimiento', icon: 'rocket', label: 'Emprendimiento' },
  { key: 'bienestar', icon: 'heart', label: 'Bienestar' },
  { key: 'finanzas', icon: 'wallet', label: 'Finanzas' },
  { key: 'general', icon: 'people', label: 'General' },
];

export default function CirclesListScreen({ navigation }: any) {
  const { currentColors } = useTheme();
  const colors = currentColors;
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const [circles, setCircles] = useState<Circle[]>([]);
  const [myCircleIds, setMyCircleIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [allCircles, myCircles] = await Promise.all([
        getCircles(selectedCategory !== 'all' ? selectedCategory : undefined),
        getMyCircles(),
      ]);
      setCircles(allCircles);
      setMyCircleIds(new Set(myCircles.map(c => c.id)));
    } catch (err) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleJoinLeave = async (circle: Circle) => {
    if (!user) return;
    try {
      setJoiningId(circle.id);
      if (myCircleIds.has(circle.id)) {
        await leaveCircle(circle.id);
        setMyCircleIds(prev => { const n = new Set(prev); n.delete(circle.id); return n; });
      } else {
        await joinCircle(circle.id);
        setMyCircleIds(prev => new Set(prev).add(circle.id));
      }
    } catch (err) {
    } finally {
      setJoiningId(null);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: spacing.lg, paddingTop: spacing.md, marginBottom: spacing.sm,
    },
    title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text },
    createBtn: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
      justifyContent: 'center', alignItems: 'center',
    },
    categoryRow: {
      paddingHorizontal: spacing.lg, marginBottom: spacing.md,
    },
    categoryScroll: { flexDirection: 'row', gap: spacing.sm },
    categoryChip: {
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      borderRadius: borderRadius.full, backgroundColor: colors.white,
      flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    categoryChipActive: { backgroundColor: colors.primary },
    categoryText: { fontSize: typography.sizes.xs, color: colors.text },
    categoryTextActive: { color: colors.white },
    list: { flex: 1 },
    listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    card: {
      backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg,
      marginBottom: spacing.md, shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
    emojiCircle: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '15',
      justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
    },
    cardInfo: { flex: 1 },
    cardName: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text },
    cardCategory: { fontSize: typography.sizes.xs, color: colors.primary, marginTop: 2 },
    cardDescription: { fontSize: typography.sizes.sm, color: colors.subtleText, marginBottom: spacing.sm },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    membersRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    membersText: { fontSize: typography.sizes.xs, color: colors.subtleText },
    joinBtn: {
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
    },
    joinBtnActive: { backgroundColor: colors.primary + '15' },
    joinBtnText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.primary },
    joinBtnTextActive: { color: colors.primary },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: spacing.xxl * 2 },
    emptyIcon: { fontSize: 48, marginBottom: spacing.md },
    emptyText: { fontSize: typography.sizes.md, color: colors.subtleText, textAlign: 'center' },
  });

  const renderCircle = ({ item }: { item: Circle }) => {
    const isMember = myCircleIds.has(item.id);
    const isJoining = joiningId === item.id;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('CircleChat', { circleId: item.id, circleName: item.name })}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={styles.emojiCircle}>
            <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardCategory}>{item.category}</Text>
          </View>
        </View>
        {item.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.cardBottom}>
          <View style={styles.membersRow}>
            <Ionicons name="people" size={14} color={colors.subtleText} />
            <Text style={styles.membersText}>{item.member_count || 0}/{item.max_members}</Text>
          </View>
          <TouchableOpacity
            style={[styles.joinBtn, isMember && styles.joinBtnActive]}
            onPress={() => handleJoinLeave(item)}
            disabled={isJoining}
          >
            <Text style={[styles.joinBtnText, isMember && styles.joinBtnTextActive]}>
              {isJoining ? '...' : isMember ? t('circles_joined') || 'Unido' : t('circles_join') || 'Unirse'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('circles_title') || 'Círculos'}</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateCircle')}>
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.categoryRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={c => c.key}
          contentContainerStyle={styles.categoryScroll}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[styles.categoryChip, selectedCategory === cat.key && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Ionicons name={cat.icon as any} size={12} color={selectedCategory === cat.key ? colors.white : colors.subtleText} />
              <Text style={[styles.categoryText, selectedCategory === cat.key && styles.categoryTextActive]}>
                {cat.key === 'all' ? (t('circles_all') || cat.label) : cat.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={circles}
        keyExtractor={c => c.id}
        renderItem={renderCircle}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💜</Text>
            <Text style={styles.emptyText}>{t('circles_empty') || 'No hay círculos aún. ¡Crea uno!'}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
