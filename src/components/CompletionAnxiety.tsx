import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

interface IncompleteItem {
  id: string;
  type: 'course' | 'challenge' | 'cycle_log' | 'budget' | 'checkin';
  title: string;
  progress: number;
  total: number;
  deadline?: string;
  urgency: 'low' | 'medium' | 'high';
}

interface CompletionAnxietyProps {
  onItemPress?: (item: IncompleteItem) => void;
}

export default function CompletionAnxiety({ onItemPress }: CompletionAnxietyProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { currentColors } = useTheme();
  const colors = currentColors;
  
  const [incompleteItems, setIncompleteItems] = useState<IncompleteItem[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (!user) return;
    
    const loadIncomplete = async () => {
      const items: IncompleteItem[] = [];
      
      // Check incomplete courses
      const { data: courses } = await supabase
        .from('course_progress')
        .select('course_id, total_lessons, completed_lessons')
        .eq('user_id', user.id)
        .lt('completed_lessons', 'total_lessons');
      
      if (courses) {
        for (const c of courses) {
          const progress = c.completed_lessons / c.total_lessons;
          items.push({
            id: `course_${c.course_id}`,
            type: 'course',
            title: t('incomplete_course') || 'Curso incompleto',
            progress: c.completed_lessons,
            total: c.total_lessons,
            urgency: progress >= 0.7 ? 'high' : progress >= 0.4 ? 'medium' : 'low',
          });
        }
      }
      
      // Check incomplete challenges
      const { data: challenges } = await supabase
        .from('user_challenges')
        .select('challenge_id, progress, target')
        .eq('user_id', user.id)
        .lt('progress', 'target');
      
      if (challenges) {
        for (const ch of challenges) {
          const progress = ch.progress / ch.target;
          items.push({
            id: `challenge_${ch.challenge_id}`,
            type: 'challenge',
            title: t('incomplete_challenge') || 'Reto incompleto',
            progress: ch.progress,
            total: ch.target,
            urgency: progress >= 0.8 ? 'high' : progress >= 0.5 ? 'medium' : 'low',
          });
        }
      }
      
      // Check missing cycle logs (last 3 days)
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
      const { data: logs } = await supabase
        .from('cycle_entries')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', threeDaysAgo);
      
      if (!logs?.length) {
        items.push({
          id: 'cycle_log_recent',
          type: 'cycle_log',
          title: t('missing_cycle_log') || 'Sin registrar ciclo',
          progress: 0,
          total: 1,
          urgency: 'medium',
        });
      }
      
      setIncompleteItems(items.filter(i => !dismissed.includes(i.id)));
    };
    
    loadIncomplete();
    
    // Pulse animation for high urgency items
    if (incompleteItems.some(i => i.urgency === 'high')) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [user, dismissed]);

  const dismissItem = (id: string) => {
    setDismissed(prev => [...prev, id]);
  };

  if (incompleteItems.length === 0) return null;

  const urgencyColors = {
    low: colors.textSecondary,
    medium: '#F59E0B',
    high: '#EF4444',
  };

  const urgencyIcons = {
    low: 'time-outline',
    medium: 'warning-outline',
    high: 'alert-circle-outline',
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t('anxiety_title') || 'Tareas pendientes'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t('anxiety_subtitle') || 'No dejes a medias...'}
      </Text>
      
      {incompleteItems.slice(0, 3).map((item) => (
        <Animated.View
          key={item.id}
          style={[
            styles.itemCard,
            { 
              backgroundColor: colors.card,
              borderColor: urgencyColors[item.urgency],
              transform: item.urgency === 'high' ? [{ scale: pulseAnim }] : [],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.itemContent}
            onPress={() => onItemPress?.(item)}
          >
            <View style={styles.itemHeader}>
              <Ionicons
                name={urgencyIcons[item.urgency] as any}
                size={20}
                color={urgencyColors[item.urgency]}
              />
              <Text style={[styles.itemTitle, { color: colors.text }]}>
                {item.title}
              </Text>
            </View>
            
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { 
                    width: `${(item.progress / item.total) * 100}%`,
                    backgroundColor: urgencyColors[item.urgency],
                  },
                ]}
              />
            </View>
            
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {item.progress}/{item.total}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => dismissItem(item.id)}
          >
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  itemContent: {
    flex: 1,
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
  },
  dismissButton: {
    padding: 12,
  },
});
