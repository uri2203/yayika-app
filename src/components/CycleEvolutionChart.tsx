import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  getCycleHistory,
  getEnergyTrend,
  getMoodDistribution,
  getSymptomFrequency,
  type CycleLog,
} from '../services/cycleEvolutionService';

type TabId = 'energy' | 'mood' | 'symptoms';
type PeriodDays = 7 | 30 | 90;

const MOOD_MAP: Record<string, { emoji: string; color: string }> = {
  happy: { emoji: '\u{1F60A}', color: '#10B981' },
  neutral: { emoji: '\u{1F610}', color: '#6B7280' },
  sad: { emoji: '\u{1F622}', color: '#3B82F6' },
  stressed: { emoji: '\u{1F624}', color: '#EF4444' },
  tired: { emoji: '\u{1F634}', color: '#8B5CF6' },
  feliz: { emoji: '\u{1F60A}', color: '#10B981' },
  irritada: { emoji: '\u{1F624}', color: '#EF4444' },
  triste: { emoji: '\u{1F622}', color: '#3B82F6' },
  ansiosa: { emoji: '\u{1F61F}', color: '#F59E0B' },
  cansada: { emoji: '\u{1F634}', color: '#8B5CF6' },
};

const SYMPTOM_CATEGORIES: Record<string, 'physical' | 'emotional' | 'energy'> = {
  pain: 'physical',
  cramps: 'physical',
  headache: 'physical',
  bloating: 'physical',
  breast_tenderness: 'physical',
  nausea: 'physical',
  low_energy: 'energy',
  fatigue: 'energy',
  insomnia: 'energy',
  high_focus: 'energy',
  anxiety: 'emotional',
  mood_swings: 'emotional',
  irritability: 'emotional',
  good_mood: 'emotional',
  sadness: 'emotional',
};

const CATEGORY_COLORS: Record<string, string> = {
  physical: '#F472B6',
  emotional: '#8B5CF6',
  energy: '#14B8A6',
};

function AnimatedBar({ value, maxValue, color, delay }: { value: number; maxValue: number; color: string; delay: number }) {
  const animated = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animated, {
      toValue: maxValue > 0 ? value / maxValue : 0,
      duration: 800,
      delay,
      useNativeDriver: false,
    }).start();
  }, [value, maxValue, delay]);

  const width = animated.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={eBarStyles.bg}>
      <Animated.View
        style={[eBarStyles.fill, { width: width as any, backgroundColor: color }]}
      />
    </View>
  );
}

const eBarStyles = StyleSheet.create({
  bg: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(128,128,128,0.15)',
    borderRadius: 5,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
});

export default function CycleEvolutionChart() {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('energy');
  const [period, setPeriod] = useState<PeriodDays>(30);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<CycleLog[]>([]);
  const [energyTrend, setEnergyTrend] = useState<ReturnType<typeof getEnergyTrend>>({ data: [], average: 0, trend: 'stable', change: 0 });
  const [moodDist, setMoodDist] = useState<ReturnType<typeof getMoodDistribution>>([]);
  const [symptomFreq, setSymptomFreq] = useState<ReturnType<typeof getSymptomFrequency>>([]);

  const tabIndicator = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'energy', label: t('evolution_energy'), icon: 'flash' },
    { id: 'mood', label: t('evolution_mood'), icon: 'happy' },
    { id: 'symptoms', label: t('evolution_symptoms'), icon: 'medkit' },
  ];

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getCycleHistory(user.id, period);
    setLogs(data);
    setEnergyTrend(getEnergyTrend(data));
    setMoodDist(getMoodDistribution(data));
    setSymptomFreq(getSymptomFrequency(data));
    setLoading(false);
  }, [user, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const switchTab = (tab: TabId) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setActiveTab(tab);
      const idx = tabs.findIndex((t) => t.id === tab);
      Animated.timing(tabIndicator, {
        toValue: idx,
        duration: 250,
        useNativeDriver: false,
      }).start();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const getC = () => currentColors;

  const styles = React.useMemo(() => {
    const c = getC();
    return StyleSheet.create({
      container: {
        backgroundColor: c.white,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        shadowColor: c.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      },
      title: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        color: c.text,
        marginBottom: spacing.md,
      },
      tabRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
        position: 'relative',
      },
      tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        gap: 4,
      },
      tabText: {
        fontSize: typography.sizes.sm,
        color: c.subtleText,
        fontWeight: typography.weights.medium,
      },
      tabTextActive: {
        color: c.primary,
        fontWeight: typography.weights.semibold,
      },
      periodRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.sm,
        marginBottom: spacing.lg,
      },
      periodBtn: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        backgroundColor: 'rgba(128,128,128,0.1)',
      },
      periodBtnActive: {
        backgroundColor: c.primary,
      },
      periodText: {
        fontSize: typography.sizes.xs,
        color: c.subtleText,
        fontWeight: typography.weights.medium,
      },
      periodTextActive: {
        color: c.white,
      },
      chartArea: {
        minHeight: 200,
      },
      emptyState: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
      },
      emptyText: {
        fontSize: typography.sizes.md,
        color: c.subtleText,
        marginTop: spacing.sm,
        textAlign: 'center',
      },
      energyBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
      },
      energyDate: {
        width: 40,
        fontSize: typography.sizes.xs,
        color: c.subtleText,
        textAlign: 'right',
      },
      energyValue: {
        width: 24,
        fontSize: typography.sizes.xs,
        color: c.text,
        textAlign: 'center',
        fontWeight: typography.weights.semibold,
      },
      avgLine: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.md,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: c.border,
      },
      avgLabel: {
        fontSize: typography.sizes.sm,
        color: c.subtleText,
      },
      avgValue: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.bold,
        color: c.primary,
        marginLeft: spacing.xs,
      },
      trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        gap: 4,
      },
      trendText: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.semibold,
      },
      moodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
      },
      moodEmoji: {
        fontSize: 24,
        width: 36,
        textAlign: 'center',
      },
      moodInfo: {
        flex: 1,
        marginLeft: spacing.sm,
      },
      moodName: {
        fontSize: typography.sizes.sm,
        color: c.text,
        fontWeight: typography.weights.medium,
      },
      moodMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
      },
      moodCount: {
        fontSize: typography.sizes.xs,
        color: c.subtleText,
        marginRight: spacing.sm,
      },
      moodPct: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.semibold,
      },
      symptomCol: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 2,
      },
      symptomBarBg: {
        width: 32,
        height: 120,
        backgroundColor: 'rgba(128,128,128,0.1)',
        borderRadius: borderRadius.sm,
        justifyContent: 'flex-end',
        overflow: 'hidden',
      },
      symptomBarFill: {
        width: '100%',
        borderRadius: borderRadius.sm,
      },
      symptomCount: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.bold,
        color: c.text,
        marginTop: 4,
      },
      symptomLabel: {
        fontSize: 10,
        color: c.subtleText,
        marginTop: 2,
        textAlign: 'center',
      },
      symptomTrendDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 2,
      },
      currentHighlight: {
        backgroundColor: c.primaryLight,
        borderRadius: 4,
        paddingHorizontal: 2,
      },
    });
  }, [currentColors]);

  const trendColor = energyTrend.trend === 'up' ? '#10B981' : energyTrend.trend === 'down' ? '#EF4444' : '#6B7280';
  const trendIcon = energyTrend.trend === 'up' ? 'arrow-up' : energyTrend.trend === 'down' ? 'arrow-down' : 'remove';
  const trendKey = energyTrend.trend === 'up' ? 'evolution_trend_up' : energyTrend.trend === 'down' ? 'evolution_trend_down' : 'evolution_trend_stable';

  const maxSymptomCount = Math.max(...symptomFreq.slice(0, 5).map((s) => s.count), 1);

  const renderEnergy = () => {
    if (energyTrend.data.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="flash-outline" size={48} color={currentColors.subtleText} />
          <Text style={styles.emptyText}>{t('evolution_empty')}</Text>
        </View>
      );
    }

    const maxVal = 5;
    const displayData = energyTrend.data.slice(-period);
    const barWidth = Math.max(8, Math.min(20, (spacing.lg * 2 * 3) / displayData.length));

    return (
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 140, paddingHorizontal: spacing.sm }}>
            {displayData.map((val, i) => {
              const isLast = i === displayData.length - 1;
              const barH = (val / maxVal) * 120;
              const ratio = val / maxVal;
              const r = Math.round(155 + (26 - 155) * ratio);
              const g = Math.round(89 + (212 - 89) * ratio);
              const b = Math.round(182 + (188 - 182) * ratio);
              const color = `rgb(${r},${g},${b})`;

              return (
                <View key={i} style={{ alignItems: 'center', marginHorizontal: 1, width: barWidth }}>
                  <Text style={[styles.energyValue, isLast && styles.currentHighlight]}>
                    {val}
                  </Text>
                  <AnimatedBar value={val} maxValue={maxVal} color={color} delay={i * 30} />
                  {(i === 0 || i === displayData.length - 1 || displayData.length <= 14) && (
                    <Text style={[styles.energyDate, isLast && { color: currentColors.primary }]}>
                      {i + 1}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.avgLine}>
          <Ionicons name="analytics-outline" size={14} color={currentColors.subtleText} />
          <Text style={styles.avgLabel}>{t('evolution_average')}</Text>
          <Text style={styles.avgValue}>{energyTrend.average}</Text>
          <View style={[styles.trendBadge, { backgroundColor: `${trendColor}18` }]}>
            <Ionicons name={trendIcon as any} size={12} color={trendColor} />
            <Text style={[styles.trendText, { color: trendColor }]}>
              {t(trendKey)} ({energyTrend.change > 0 ? '+' : ''}{energyTrend.change})
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMood = () => {
    if (moodDist.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="happy-outline" size={48} color={currentColors.subtleText} />
          <Text style={styles.emptyText}>{t('evolution_empty')}</Text>
        </View>
      );
    }

    const maxCount = Math.max(...moodDist.map((m) => m.count), 1);

    return (
      <View>
        {moodDist.map((m, i) => {
          const moodInfo = MOOD_MAP[m.mood.toLowerCase()] || { emoji: '\u{1F610}', color: '#6B7280' };
          return (
            <View key={m.mood} style={styles.moodRow}>
              <Text style={styles.moodEmoji}>{moodInfo.emoji}</Text>
              <View style={styles.moodInfo}>
                <Text style={styles.moodName}>{m.mood}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AnimatedBar value={m.count} maxValue={maxCount} color={moodInfo.color} delay={i * 100} />
                </View>
              </View>
              <Text style={styles.moodCount}>{m.count}</Text>
              <Text style={[styles.moodPct, { color: moodInfo.color }]}>{m.percentage}%</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderSymptoms = () => {
    const top5 = symptomFreq.slice(0, 5);
    if (top5.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="medkit-outline" size={48} color={currentColors.subtleText} />
          <Text style={styles.emptyText}>{t('evolution_empty')}</Text>
        </View>
      );
    }

    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 180, paddingTop: spacing.md }}>
        {top5.map((s, i) => {
          const cat = SYMPTOM_CATEGORIES[s.symptom.toLowerCase()] || 'physical';
          const color = CATEGORY_COLORS[cat];
          const barHeight = (s.count / maxSymptomCount) * 120;
          const trendDotColor = s.trend === 'increasing' ? '#EF4444' : s.trend === 'decreasing' ? '#10B981' : '#9CA3AF';

          return (
            <View key={s.symptom} style={styles.symptomCol}>
              <Text style={styles.symptomCount}>{s.count}</Text>
              <View style={[styles.symptomBarBg, { height: 120 }]}>
                <Animated.View
                  style={[styles.symptomBarFill, { height: barHeight, backgroundColor: color }]}
                />
              </View>
              <Text style={styles.symptomLabel} numberOfLines={2}>
                {s.symptom.replace(/_/g, ' ')}
              </Text>
              <View style={[styles.symptomTrendDot, { backgroundColor: trendDotColor }]} />
            </View>
          );
        })}
      </View>
    );
  };

  const tabWidth = 100 / tabs.length;
  const indicatorLeft = tabIndicator.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, i) => `${i * tabWidth}%`),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('evolution_title')}</Text>

      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => switchTab(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.id ? currentColors.primary : currentColors.subtleText}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: indicatorLeft,
            width: `${tabWidth}%`,
            height: 2,
            backgroundColor: currentColors.primary,
            borderRadius: 1,
          }}
        />
      </View>

      <View style={styles.periodRow}>
        {([7, 30, 90] as PeriodDays[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
            activeOpacity={0.7}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {t(`evolution_period_${p}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <Ionicons name="hourglass-outline" size={32} color={currentColors.subtleText} />
          <Text style={styles.emptyText}>{t('common_loading')}</Text>
        </View>
      ) : (
        <Animated.View style={[styles.chartArea, { opacity: fadeAnim }]}>
          {activeTab === 'energy' && renderEnergy()}
          {activeTab === 'mood' && renderMood()}
          {activeTab === 'symptoms' && renderSymptoms()}
        </Animated.View>
      )}
    </View>
  );
}
