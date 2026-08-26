import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getCommunityFeed, createPost, toggleReaction, getCommunityCategories } from '../../config/api';
import { Language } from '../../config/i18n';

function getLocalized(value: any, lang: Language): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value[lang] || value.es || value.en || Object.values(value)[0] || '';
  }
  return String(value);
}

interface Post {
  id: string;
  user_name: string;
  content: string;
  category: string;
  category_slug: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
  is_flagged?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

function timeAgo(dateStr: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return 'ahora';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return `${Math.floor(diffDay / 7)}sem`;
}

export default function CommunityFeedScreen({ navigation }: any) {
  const { currentColors } = useTheme();
  const colors = currentColors;
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('logros');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchPosts = useCallback(async (categorySlug?: string) => {
    try {
      const data = await getCommunityFeed(categorySlug ?? undefined);
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Failed to fetch community feed:', err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCommunityCategories();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPosts(), fetchCategories()]).finally(() => setLoading(false));
  }, [fetchPosts, fetchCategories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts(selectedCategory ?? undefined);
    setRefreshing(false);
  }, [fetchPosts, selectedCategory]);

  const onCategoryPress = useCallback(async (slug: string | null) => {
    setSelectedCategory(slug);
    setLoading(true);
    await fetchPosts(slug ?? undefined);
    setLoading(false);
  }, [fetchPosts]);

  const handleSubmitPost = useCallback(async () => {
    const trimmed = newPostContent.trim();
    if (!trimmed) return;
    try {
      setSubmitting(true);
      await createPost(trimmed, newPostCategory);
      setNewPostContent('');
      setModalVisible(false);
      await fetchPosts(selectedCategory ?? undefined);
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setSubmitting(false);
    }
  }, [newPostContent, newPostCategory, fetchPosts, selectedCategory]);

  const handleToggleReaction = useCallback(async (postId: string) => {
    try {
      setTogglingId(postId);
      await toggleReaction(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, user_has_liked: !p.user_has_liked, like_count: p.like_count + (p.user_has_liked ? -1 : 1) }
            : p
        )
      );
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    } finally {
      setTogglingId(null);
    }
  }, []);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
    },
    backBtn: { padding: spacing.xs },
    title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text },
    newPostBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary,
      justifyContent: 'center', alignItems: 'center',
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    chip: {
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
      backgroundColor: colors.white, marginRight: spacing.sm, marginBottom: spacing.sm,
      borderWidth: 1, borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.subtleText },
    chipTextActive: { color: colors.white },
    listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    postCard: {
      backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md,
      marginBottom: spacing.md, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    avatar: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight,
      justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
    },
    postMeta: { flex: 1 },
    postAuthor: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text },
    postTime: { fontSize: typography.sizes.xs, color: colors.subtleText },
    categoryBadge: {
      backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 2,
      borderRadius: borderRadius.full,
    },
    categoryBadgeText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium, color: colors.primary },
    postContent: { fontSize: typography.sizes.md, color: colors.text, lineHeight: 22, marginBottom: spacing.md },
    postActions: {
      flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm,
    },
    actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.lg },
    actionText: { fontSize: typography.sizes.sm, color: colors.subtleText, marginLeft: spacing.xs },
    actionTextActive: { color: colors.rose, fontWeight: typography.weights.semibold },
    flaggedBadge: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#FEF3C7', paddingHorizontal: spacing.sm, paddingVertical: 2,
      borderRadius: borderRadius.full, marginTop: spacing.xs,
    },
    flaggedText: { fontSize: typography.sizes.xs, color: '#D97706', marginLeft: spacing.xs },
    emptyTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text, marginTop: spacing.md },
    emptySubtitle: { fontSize: typography.sizes.sm, color: colors.subtleText, marginTop: spacing.xs, textAlign: 'center' },
    fab: {
      position: 'absolute', right: spacing.lg, bottom: spacing.xl, width: 56, height: 56,
      borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: colors.white, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
      padding: spacing.lg, maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md,
    },
    modalTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text },
    modalChipContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingBottom: spacing.md },
    postInput: {
      backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md,
      fontSize: typography.sizes.md, color: colors.text, minHeight: 120, marginBottom: spacing.sm,
    },
    charCount: { fontSize: typography.sizes.xs, color: colors.subtleText, textAlign: 'right', marginBottom: spacing.md },
    submitButton: {
      backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center',
    },
    submitButtonDisabled: { opacity: 0.5 },
    submitButtonText: { color: colors.white, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  });

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={colors.white} />
        </View>
        <View style={styles.postMeta}>
          <Text style={styles.postAuthor}>{getLocalized(item.user_name, lang) || t('community_anonymous') || 'Anónimo'}</Text>
          <Text style={styles.postTime}>{timeAgo(item.created_at)}</Text>
        </View>
        {item.category ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{getLocalized(item.category, lang)}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.postContent}>{getLocalized(item.content, lang)}</Text>

      {item.is_flagged && (
        <View style={styles.flaggedBadge}>
          <Ionicons name="flag" size={12} color="#D97706" />
          <Text style={styles.flaggedText}>{t('community_flagged') || 'Moderado'}</Text>
        </View>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleToggleReaction(item.id)}
          disabled={togglingId === item.id}
        >
          {togglingId === item.id ? (
            <ActivityIndicator size="small" color={colors.rose} />
          ) : (
            <Ionicons
              name={item.user_has_liked ? 'heart' : 'heart-outline'}
              size={20}
              color={item.user_has_liked ? colors.rose : colors.subtleText}
            />
          )}
          <Text style={[styles.actionText, item.user_has_liked && styles.actionTextActive]}>
            {item.like_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.subtleText} />
          <Text style={styles.actionText}>{item.comment_count}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ), [handleToggleReaction, togglingId, t, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('community_title') || 'Comunidad'}</Text>
        <TouchableOpacity style={styles.newPostBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      {categories.length > 0 && (
        <View style={styles.chipContainer}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item.slug}
              style={[styles.chip, selectedCategory === item.slug && styles.chipActive]}
              onPress={() => onCategoryPress(selectedCategory === item.slug ? null : item.slug)}
            >
              <Text style={[styles.chipText, selectedCategory === item.slug && styles.chipTextActive]}>
                {getLocalized(item.name, lang)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {posts.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>{t('community_empty_title') || 'Sin publicaciones'}</Text>
          <Text style={styles.emptySubtitle}>{t('community_empty_subtitle') || 'Sé el primero en compartir'}</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="create-outline" size={26} color={colors.white} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('community_new_post') || 'Nueva publicación'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.subtleText} />
              </TouchableOpacity>
            </View>

            {categories.length > 0 && (
              <View style={styles.modalChipContainer}>
                {categories.map((item) => (
                  <TouchableOpacity
                    key={item.slug}
                    style={[styles.chip, newPostCategory === item.slug && styles.chipActive]}
                    onPress={() => setNewPostCategory(item.slug)}
                  >
                    <Text style={[styles.chipText, newPostCategory === item.slug && styles.chipTextActive]}>
                      {getLocalized(item.name, lang)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TextInput
              style={styles.postInput}
              placeholder={t('community_placeholder') || '¿Qué quieres compartir?'}
              placeholderTextColor={colors.subtleText}
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />

            <Text style={styles.charCount}>{newPostContent.length}/500</Text>

            <TouchableOpacity
              style={[styles.submitButton, (!newPostContent.trim() || submitting) && styles.submitButtonDisabled]}
              onPress={handleSubmitPost}
              disabled={!newPostContent.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>{t('community_publish') || 'Publicar'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

