import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  getFriendActivity,
  FriendActivity,
} from '../services/socialObligationsService';
import Card from './Card';

interface Props {
  maxItems?: number;
  onActivityPress?: (activity: FriendActivity) => void;
  onSeeAll?: () => void;
}

function timeAgo(dateStr: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return t('common_now');
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t('social_activity_time_ago', { time: `${diffMin}m` });
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t('social_activity_time_ago', { time: `${diffHr}h` });
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return t('social_activity_time_ago', { time: `${diffDay}d` });
  return t('social_activity_time_ago', { time: `${Math.floor(diffDay / 7)}sem` });
}

function getActivityText(
  activity: FriendActivity,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  switch (activity.activity_type) {
    case 'posted':
      return t('social_activity_posted', {
        name: activity.user_name,
        circle: activity.circle_name,
      });
    case 'reacted':
      return t('social_activity_reacted', {
        name: activity.user_name,
        circle: activity.circle_name,
      });
    case 'joined':
      return t('social_activity_joined', {
        name: activity.user_name,
        circle: activity.circle_name,
      });
    default:
      return t('social_activity_posted', {
        name: activity.user_name,
        circle: activity.circle_name,
      });
  }
}

function getActivityIcon(type: FriendActivity['activity_type']): string {
  switch (type) {
    case 'posted':
      return 'create-outline';
    case 'reacted':
      return 'heart-outline';
    case 'joined':
      return 'person-add-outline';
    case 'commented':
      return 'chatbubble-outline';
    default:
      return 'create-outline';
  }
}

export default function CircleActivityFeed({ maxItems = 5, onActivityPress, onSeeAll }: Props) {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const colors = currentColors;

  const [activities, setActivities] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const data = await getFriendActivity(user.id);
      setActivities(data);
    } catch (e) {
      console.error('Circle activity feed error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card style={styles.container}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.subtleText }]}>
            {t('common_loading')}
          </Text>
        </View>
      </Card>
    );
  }

  if (activities.length === 0) return null;

  const displayed = activities.slice(0, maxItems);

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="pulse" size={16} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('social_proof_title')}
        </Text>
      </View>

      {displayed.map((activity, index) => (
        <TouchableOpacity
          key={`${activity.user_name}-${activity.circle_name}-${index}`}
          style={[
            styles.activityRow,
            index < displayed.length - 1 && { borderBottomColor: colors.border },
          ]}
          activeOpacity={0.7}
          onPress={() => onActivityPress?.(activity)}
        >
          <View style={[styles.activityIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons
              name={getActivityIcon(activity.activity_type) as any}
              size={14}
              color={colors.primary}
            />
          </View>
          <View style={styles.activityContent}>
            <Text style={[styles.activityText, { color: colors.text }]} numberOfLines={2}>
              {getActivityText(activity, t)}
            </Text>
            <Text style={[styles.activityTime, { color: colors.subtleText }]}>
              {timeAgo(activity.created_at, t)}
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      {activities.length > maxItems && (
        <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAll}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>
            {t('social_see_all')}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: typography.sizes.sm,
    lineHeight: 18,
  },
  activityTime: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  seeAllText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
