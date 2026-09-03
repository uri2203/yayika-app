import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked_at: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

const RARITY_GLOW: Record<string, string> = {
  common: 'transparent',
  rare: 'rgba(59, 130, 246, 0.3)',
  epic: 'rgba(168, 85, 247, 0.4)',
  legendary: 'rgba(245, 158, 11, 0.5)',
};

interface BadgeShowcaseProps {
  userId?: string;
  editable?: boolean;
}

export default function BadgeShowcase({ userId, editable = false }: BadgeShowcaseProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { currentColors } = useTheme();
  const colors = currentColors;
  
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showcase, setShowcase] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (!targetUserId) return;
    
    const loadBadges = async () => {
      // Load all unlocked badges
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id, unlocked_at')
        .eq('user_id', targetUserId);

      // Load showcase preference
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('badge_showcase')
        .eq('user_id', targetUserId)
        .single();

      // Badge definitions
      const badgeDefs: Record<string, Omit<Badge, 'unlocked_at'>> = {
        badge_night_owl: { id: 'badge_night_owl', name: t('badge_night_owl_name') || 'Búho Nocturno', icon: '🦉', description: t('badge_night_owl_desc') || 'Check-in después de las 11 PM', rarity: 'rare' },
        badge_early_bird: { id: 'badge_early_bird', name: t('badge_early_bird_name') || 'Madrugadora', icon: '🐦', description: t('badge_early_bird_desc') || 'Check-in antes de las 6 AM', rarity: 'rare' },
        badge_perfectionist: { id: 'badge_perfectionist', name: t('badge_perfectionist_name') || 'Perfeccionista', icon: '💎', description: t('badge_perfectionist_desc') || 'Racha de 7 días', rarity: 'epic' },
        badge_streak_30: { id: 'badge_streak_30', name: t('badge_streak_30_name') || 'Leyenda', icon: '👑', description: t('badge_streak_30_desc') || 'Racha de 30 días', rarity: 'legendary' },
        badge_xp_1000: { id: 'badge_xp_1000', name: t('badge_xp_1000_name') || 'Maestra', icon: '🌟', description: t('badge_xp_1000_desc') || '1000 XP acumulados', rarity: 'legendary' },
        badge_checkin1: { id: 'badge_checkin1', name: t('badge_checkin1_name') || 'Primera Vez', icon: '✨', description: t('badge_checkin1_desc') || 'Primer check-in', rarity: 'common' },
        badge_mood: { id: 'badge_mood', name: t('badge_mood_name') || 'Emocional', icon: '🎭', description: t('badge_mood_desc') || 'Registra tu humor', rarity: 'common' },
        badge_cycle7: { id: 'badge_cycle7', name: t('badge_cycle7_name') || 'Ciclista', icon: '🌙', description: t('badge_cycle7_desc') || '7 días de ciclo registrado', rarity: 'rare' },
        badge_challenge_first: { id: 'badge_challenge_first', name: t('badge_challenge_first_name') || 'Retadora', icon: '🎯', description: t('badge_challenge_first_desc') || 'Primer reto completado', rarity: 'common' },
        badge_budget: { id: 'badge_budget', name: t('badge_budget_name') || 'Ahorradora', icon: '💰', description: t('badge_budget_desc') || 'Primer presupuesto', rarity: 'common' },
        badge_share: { id: 'badge_share', name: t('badge_share_name') || 'Influencer', icon: '📱', description: t('badge_share_desc') || 'Comparte un producto', rarity: 'common' },
        badge_referral_first: { id: 'badge_referral_first', name: t('badge_referral_first_name') || 'Embajadora', icon: '🤝', description: t('badge_referral_first_desc') || 'Primera referida', rarity: 'rare' },
      };

      const unlockedBadges: Badge[] = (userBadges || []).map((ub) => ({
        ...badgeDefs[ub.badge_id],
        unlocked_at: ub.unlocked_at,
      })).filter((b) => b.name);

      setBadges(unlockedBadges);
      setShowcase(profile?.badge_showcase || []);
      setLoading(false);
    };

    loadBadges();
  }, [targetUserId]);

  const toggleShowcase = async (badgeId: string) => {
    if (!editable || !user) return;
    
    let newShowcase: string[];
    if (showcase.includes(badgeId)) {
      newShowcase = showcase.filter((id) => id !== badgeId);
    } else if (showcase.length < 3) {
      newShowcase = [...showcase, badgeId];
    } else {
      return; // Max 3 badges
    }
    
    setShowcase(newShowcase);
    await supabase
      .from('user_profiles')
      .update({ badge_showcase: newShowcase })
      .eq('user_id', user.id);
  };

  const showcaseBadges = badges.filter((b) => showcase.includes(b.id));
  const otherBadges = badges.filter((b) => !showcase.includes(b.id));

  if (loading) return null;

  return (
    <View style={styles.container}>
      {/* Showcase slots */}
      <View style={styles.showcaseSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('badge_showcase_title') || 'Mi Exhibición'}
        </Text>
        <View style={styles.showcaseSlots}>
          {[0, 1, 2].map((i) => {
            const badge = showcaseBadges[i];
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.showcaseSlot,
                  { 
                    backgroundColor: badge ? RARITY_COLORS[badge.rarity] + '20' : colors.border,
                    borderColor: badge ? RARITY_COLORS[badge.rarity] : colors.border,
                  },
                  badge && { shadowColor: RARITY_GLOW[badge.rarity], shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8 },
                ]}
                onPress={() => badge && editable && toggleShowcase(badge.id)}
                disabled={!editable}
              >
                {badge ? (
                  <>
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={1}>
                      {badge.name}
                    </Text>
                  </>
                ) : (
                  <View style={styles.emptySlot}>
                    <Ionicons name="add" size={24} color={colors.textSecondary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      {editable ? (t('badge_add') || 'Agregar') : ''}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* All badges */}
      {otherBadges.length > 0 && (
        <View style={styles.allBadgesSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('badge_all_title') || `Todas mis insignias (${badges.length})`}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
            {otherBadges.map((badge) => (
              <TouchableOpacity
                key={badge.id}
                style={[styles.miniBadge, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => toggleShowcase(badge.id)}
                disabled={!editable || showcase.length >= 3}
              >
                <Text style={styles.miniBadgeIcon}>{badge.icon}</Text>
                <Text style={[styles.miniBadgeName, { color: colors.text }]} numberOfLines={1}>
                  {badge.name}
                </Text>
                <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[badge.rarity] }]} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  showcaseSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  showcaseSlots: { flexDirection: 'row', gap: 12 },
  showcaseSlot: { flex: 1, aspectRatio: 1, borderRadius: 16, borderWidth: 2, justifyContent: 'center', alignItems: 'center', padding: 8 },
  badgeIcon: { fontSize: 32, marginBottom: 4 },
  badgeName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  emptySlot: { alignItems: 'center', gap: 4 },
  emptyText: { fontSize: 10 },
  allBadgesSection: {},
  badgeScroll: { flexDirection: 'row' },
  miniBadge: { width: 80, padding: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center', marginRight: 8 },
  miniBadgeIcon: { fontSize: 24, marginBottom: 4 },
  miniBadgeName: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
  rarityDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
});
