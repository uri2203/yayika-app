import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { dailyCheckin, getSpinResult, DailyCheckinResult, SpinResult } from '../../config/retention';

const WHEEL_SIZE = 180;
const WHEEL_COLORS = ['#4E3470', '#D4A843', '#2DD4BF', '#F472B6', '#10B981', '#EF4444', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'];

interface RetentionCheckinProps {
  onCheckinComplete?: (result: DailyCheckinResult) => void;
}

export default function RetentionCheckin({ onCheckinComplete }: RetentionCheckinProps) {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const colors = currentColors;

  const WHEEL_LABELS = [
    t('retention_wheel_label_1'),
    t('retention_wheel_label_2'),
    t('retention_wheel_label_3'),
    t('retention_wheel_label_4'),
    t('retention_wheel_label_5'),
    t('retention_wheel_label_6'),
    t('retention_wheel_label_7'),
    t('retention_wheel_label_8'),
    t('retention_wheel_label_9'),
    t('retention_wheel_label_10'),
  ];

  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [lastXP, setLastXP] = useState(0);

  const spinAnimation = React.useRef(new Animated.Value(0)).current;

  const handleCheckin = useCallback(async () => {
    if (loading || checkedIn) return;

    try {
      setLoading(true);
      const result = await dailyCheckin();

      if (result.error) {
        if (result.error === 'Already checked in today') {
          setCheckedIn(true);
        }
        return;
      }

      setCheckedIn(true);
      setLastXP(result.xp_earned || 0);

      if (!result.spin_result?.already_spun) {
        setTimeout(() => setShowWheel(true), 800);
      }

      onCheckinComplete?.(result);
    } catch (e) {
      console.error('Checkin error:', e);
    } finally {
      setLoading(false);
    }
  }, [loading, checkedIn, onCheckinComplete]);

  const handleSpin = useCallback(async () => {
    if (spinning) return;

    try {
      setSpinning(true);
      const result = await getSpinResult();

      if (result.already_spun) {
        setSpinResult(result);
        return;
      }

      // Animate wheel
      const spins = 5 + Math.random() * 5;
      const extraDegrees = Math.random() * 360;

      Animated.timing(spinAnimation, {
        toValue: spins * 360 + extraDegrees,
        duration: 3000,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        setSpinResult(result);
        setSpinning(false);
      }, 3200);
    } catch (e) {
      console.error('Spin error:', e);
      setSpinning(false);
    }
  }, [spinning, spinAnimation]);

  const getSpinMessage = (result: SpinResult): string => {
    switch (result.type) {
      case 'xp': return `+${result.value} XP`;
      case 'badge': return t('retention_wheel_badge');
      case 'streak_boost': return `+${result.value} ${t('home_streak')}`;
      case 'content': return t('retention_wheel_special');
      case 'multiplier': return `x${result.value} XP`;
      default: return t('retention_wheel_try_again');
    }
  };

  const getSpinColor = (result: SpinResult): string => {
    switch (result.type) {
      case 'xp': return '#10B981';
      case 'badge': return '#D4A843';
      case 'streak_boost': return '#EF4444';
      case 'content': return '#8B5CF6';
      case 'multiplier': return '#F59E0B';
      default: return '#999';
    }
  };

  const rotateInterpolation = spinAnimation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      {/* Check-in Button */}
      {!showWheel && (
        <TouchableOpacity
          style={[styles.checkinButton, { backgroundColor: colors.primary }]}
          onPress={handleCheckin}
          disabled={loading || checkedIn}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : checkedIn ? (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              <Text style={styles.checkinText}>{t('retention_checkin_done')} +{lastXP} XP</Text>
            </>
          ) : (
            <>
              <Text style={styles.checkinEmoji}>🔥</Text>
              <View style={styles.checkinInfo}>
                <Text style={styles.checkinTitle}>{t('retention_checkin_title')}</Text>
                <Text style={styles.checkinSubtitle}>+10 XP + {t('retention_wheel_title').toLowerCase()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Reward Wheel */}
      {showWheel && (
        <View style={styles.wheelContainer}>
          <Text style={[styles.wheelTitle, { color: colors.text }]}>{t('retention_wheel_title')}</Text>
          
          <View style={styles.wheelWrapper}>
            <Animated.View style={[styles.wheel, { transform: [{ rotate: rotateInterpolation }] }]}>
              {WHEEL_COLORS.map((color, index) => {
                const angle = (index * 360) / WHEEL_COLORS.length;
                return (
                  <View
                    key={index}
                    style={[
                      styles.wheelSegment,
                      {
                        backgroundColor: color,
                        transform: [{ rotate: `${angle}deg` }],
                      },
                    ]}
                  >
                    <Text style={styles.wheelSegmentText}>{WHEEL_LABELS[index]}</Text>
                  </View>
                );
              })}
            </Animated.View>
            
            <TouchableOpacity
              style={[styles.wheelCenter, { backgroundColor: colors.white }]}
              onPress={handleSpin}
              disabled={spinning}
            >
              {spinning ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.wheelCenterEmoji}>🎰</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Spin Result */}
          {spinResult && !spinResult.already_spun && (
            <View style={[styles.spinResult, { backgroundColor: getSpinColor(spinResult) + '20' }]}>
              <Text style={[styles.spinResultText, { color: getSpinColor(spinResult) }]}>
                {getSpinMessage(spinResult)}
              </Text>
            </View>
          )}

          {spinResult?.already_spun && (
            <Text style={[styles.alreadySpun, { color: colors.subtleText }]}>
              {t('retention_wheel_try_again')}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.closeWheel, { backgroundColor: colors.background }]}
            onPress={() => setShowWheel(false)}
          >
            <Text style={[styles.closeWheelText, { color: colors.text }]}>{t('common_close')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  checkinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  checkinEmoji: {
    fontSize: 28,
  },
  checkinInfo: {
    flex: 1,
  },
  checkinTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#FFF',
  },
  checkinSubtitle: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  checkinText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: '#FFF',
  },
  wheelContainer: {
    alignItems: 'center',
  },
  wheelTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  wheelWrapper: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    overflow: 'hidden',
    position: 'absolute',
  },
  wheelSegment: {
    position: 'absolute',
    width: WHEEL_SIZE,
    height: WHEEL_SIZE / 2,
    left: 0,
    top: 0,
    transformOrigin: 'bottom center',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 8,
  },
  wheelSegmentText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#FFF',
  },
  wheelCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  wheelCenterEmoji: {
    fontSize: 28,
  },
  spinResult: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  spinResultText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  alreadySpun: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
  },
  closeWheel: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  closeWheelText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});
