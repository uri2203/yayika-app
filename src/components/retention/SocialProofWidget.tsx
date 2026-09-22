import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getSocialProof,
  getFriendActivity,
  SocialProofStats,
  FriendActivity,
} from '../../services/socialObligationsService';

export default function SocialProofWidget({ onPress }: { onPress?: () => void }) {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const colors = currentColors;

  const [proof, setProof] = useState<SocialProofStats | null>(null);
  const [friends, setFriends] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const animatedCount = useRef(new Animated.Value(0)).current;
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (proof && proof.activeToday > 0) {
      animateCounter(proof.activeToday);
    }
  }, [proof?.activeToday]);

  const animateCounter = (target: number) => {
    animatedCount.setValue(0);
    Animated.timing(animatedCount, {
      toValue: target,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    const listener = animatedCount.addListener(({ value }) => {
      setDisplayCount(Math.round(value));
    });

    return () => animatedCount.removeListener(listener);
  };

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const [proofData, friendData] = await Promise.allSettled([
        getSocialProof(user.id),
        getFriendActivity(user.id),
      ]);
      if (proofData.status === 'fulfilled') setProof(proofData.value);
      if (friendData.status === 'fulfilled') setFriends(friendData.value);
    } catch (e) {
      console.error('Social proof error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !proof) return null;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.white }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Ionicons name="people" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          {t('social_proof_title')}
        </Text>
      </View>

      {/* Active women count */}
      <View style={[styles.activeBanner, { backgroundColor: colors.successBg }]}>
        <View style={[styles.activeDot, { backgroundColor: colors.success }]} />
        <Text style={[styles.activeCount, { color: colors.success }]}>
          {t('social_proof_women', { count: displayCount })}
        </Text>
      </View>

      {/* Circle with new posts */}
      {proof.circleRankings.length > 0 && proof.circleRankings[0].engagement_score > 0 && (
        <View style={styles.circleHighlight}>
          <Ionicons name="chatbubbles" size={16} color={colors.primary} />
          <Text style={[styles.circleHighlightText, { color: colors.text }]}>
            {t('social_proof_circle_new', {
              name: proof.circleRankings[0].circle_name,
              count: String(proof.circleRankings[0].engagement_score),
            })}
          </Text>
        </View>
      )}

      {/* Ranking */}
      {proof.topPercentile <= 50 && (
        <View style={styles.rankingRow}>
          <Ionicons name="trophy" size={16} color={colors.gold} />
          <Text style={[styles.rankingText, { color: colors.text }]}>
            {t('social_proof_ranking', { percent: String(proof.topPercentile) })}
          </Text>
        </View>
      )}

      {/* Friend avatars */}
      {friends.length > 0 && (
        <View style={styles.friendsRow}>
          <Text style={[styles.friendsLabel, { color: colors.subtleText }]}>
            {t('retention_social_top')}
          </Text>
          <View style={styles.avatarsContainer}>
            {friends.slice(0, 4).map((friend, index) => (
              <View
                key={`${friend.user_name}-${index}`}
                style={[
                  styles.avatar,
                  { backgroundColor: colors.primaryLight },
                  index > 0 && styles.avatarOverlap,
                ]}
              >
                {friend.avatar_url ? (
                  <Image source={{ uri: friend.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                    {friend.user_name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            ))}
            {friends.length > 4 && (
              <View style={[styles.avatar, styles.avatarOverlap, { backgroundColor: colors.border }]}>
                <Text style={[styles.avatarInitial, { color: colors.subtleText, fontSize: 10 }]}>
                  +{friends.length - 4}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* View circle button */}
      <TouchableOpacity style={[styles.viewButton, { borderColor: colors.primary }]} onPress={onPress}>
        <Text style={[styles.viewButtonText, { color: colors.primary }]}>
          {t('social_view_circle')}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeCount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  circleHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  circleHighlightText: {
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  rankingText: {
    fontSize: typography.sizes.sm,
  },
  friendsRow: {
    marginBottom: spacing.sm,
  },
  friendsLabel: {
    fontSize: typography.sizes.xs,
    marginBottom: spacing.xs,
  },
  avatarsContainer: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarInitial: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  viewButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
