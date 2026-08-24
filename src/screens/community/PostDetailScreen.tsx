import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getCommunityFeed, toggleReaction, addComment } from '../../config/api';
import { Language } from '../../config/i18n';

function getLocalized(value: any, lang: Language): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value[lang] || value.es || value.en || Object.values(value)[0] || '';
  }
  return String(value);
}

interface Comment {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
}

interface PostDetail {
  id: string;
  user_name: string;
  content: string;
  category: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  user_has_liked: boolean;
  comments: Comment[];
}

function timeAgo(dateStr: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return 'ahora';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

interface PostDetailScreenProps {
  navigation: any;
  route: any;
}

export default function PostDetailScreen({ navigation, route }: PostDetailScreenProps) {
  const postId = route?.params?.postId;
  const { t, lang } = useLanguage();

  if (!postId) {
    navigation.goBack();
    return null;
  }

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [togglingLike, setTogglingLike] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCommunityFeed(undefined, 100, 0);
      const found = data.posts?.find((p: any) => p.id === postId);
      if (found) {
        setPost({
          ...found,
          comments: found.comments || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch post:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  const handleToggleLike = useCallback(async () => {
    if (!post || togglingLike) return;
    try {
      setTogglingLike(true);
      await toggleReaction(post.id);
      setPost((prev) => prev ? {
        ...prev,
        user_has_liked: !prev.user_has_liked,
        like_count: prev.like_count + (prev.user_has_liked ? -1 : 1),
      } : prev);
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    } finally {
      setTogglingLike(false);
    }
  }, [post, togglingLike]);

  const handleAddComment = useCallback(async () => {
    if (!post || !commentText.trim()) return;
    try {
      setSubmitting(true);
      const result = await addComment(post.id, commentText.trim());
      setPost((prev) => prev ? {
        ...prev,
        comment_count: prev.comment_count + 1,
        comments: [
          ...prev.comments,
          {
            id: result.comment_id || Date.now().toString(),
            user_name: t('community_you') || 'Tú',
            content: commentText.trim(),
            created_at: new Date().toISOString(),
          },
        ],
      } : prev);
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
    }
  }, [post, commentText]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.border} />
          <Text style={styles.emptyText}>{t('community_post_not_found') || 'Publicación no encontrada'}</Text>
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
        <Text style={styles.headerTitle}>{t('community_post') || 'Publicación'}</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <FlatList
          data={post.comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={
            <>
              <View style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={20} color={colors.white} />
                  </View>
                  <View style={styles.postMeta}>
                    <Text style={styles.postAuthor}>{getLocalized(post.user_name, lang) || (t('community_anonymous') || 'Anónimo')}</Text>
                    <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
                  </View>
                  {post.category ? (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{getLocalized(post.category, lang)}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.postContent}>{getLocalized(post.content, lang)}</Text>
                <View style={styles.postActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleToggleLike}
                    disabled={togglingLike}
                  >
                    {togglingLike ? (
                      <ActivityIndicator size="small" color={colors.rose} />
                    ) : (
                      <Ionicons
                        name={post.user_has_liked ? 'heart' : 'heart-outline'}
                        size={22}
                        color={post.user_has_liked ? colors.rose : colors.subtleText}
                      />
                    )}
                    <Text style={[styles.actionText, post.user_has_liked && styles.actionTextActive]}>
                      {post.like_count}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.actionButton}>
                    <Ionicons name="chatbubble-outline" size={20} color={colors.subtleText} />
                    <Text style={styles.actionText}>{post.comment_count}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.commentsTitle}>
                {post.comments.length > 0 ? `${t('community_comments') || 'Comentarios'} (${post.comments.length})` : (t('community_no_comments') || 'Sin comentarios')}
              </Text>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.commentCard}>
              <View style={styles.commentAvatar}>
                <Ionicons name="person" size={16} color={colors.white} />
              </View>
              <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{getLocalized(item.user_name, lang) || (t('community_anonymous') || 'Anónimo')}</Text>
                  <Text style={styles.commentTime}>{timeAgo(item.created_at)}</Text>
                </View>
                <Text style={styles.commentContent}>{getLocalized(item.content, lang)}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.border} />
              <Text style={styles.emptyText}>{t('community_first_comment') || 'Sé el primero en comentar'}</Text>
            </View>
          }
          ListFooterComponent={
            <View style={{ height: spacing.xl }} />
          }
        />

        <View style={styles.commentInputBar}>
          <TextInput
            style={styles.commentInput}
            placeholder={t('community_comment_placeholder') || 'Escribe un comentario...'}
            placeholderTextColor={colors.subtleText}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!commentText.trim() || submitting) && styles.sendBtnDisabled]}
            onPress={handleAddComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="send" size={20} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  postCard: {
    backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.lg, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  postMeta: { flex: 1 },
  postAuthor: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text },
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
  commentsTitle: {
    fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text, marginBottom: spacing.md,
  },
  commentCard: {
    flexDirection: 'row', backgroundColor: colors.white, borderRadius: borderRadius.sm,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  commentAuthor: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text },
  commentTime: { fontSize: typography.sizes.xs, color: colors.subtleText },
  commentContent: { fontSize: typography.sizes.sm, color: colors.text, lineHeight: 18 },
  emptyComments: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { fontSize: typography.sizes.sm, color: colors.subtleText, marginTop: spacing.sm },
  commentInputBar: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  commentInput: {
    flex: 1, backgroundColor: colors.background, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.sizes.sm,
    color: colors.text, maxHeight: 80, marginRight: spacing.sm,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
