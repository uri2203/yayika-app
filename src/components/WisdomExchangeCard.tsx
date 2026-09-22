import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Card from './Card';
import {
  getWisdomExchangeLocalized,
  getRandomWisdom,
  WisdomEntry,
} from '../services/deepConnectionService';
import { supabase } from '../config/supabase';

interface Props {
  cyclePhase?: string;
}

export default function WisdomExchangeCard({ cyclePhase }: Props) {
  const { currentColors } = useTheme();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const colors = currentColors;

  const [wisdoms, setWisdoms] = useState<WisdomEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareText, setShareText] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const fadeAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    loadWisdoms();
  }, [user?.id, lang]);

  const loadWisdoms = async () => {
    if (!user?.id) return;
    try {
      const data = await getWisdomExchangeLocalized(user.id, lang);
      setWisdoms(data);
    } catch {
      setWisdoms([getRandomWisdom(lang)]);
    } finally {
      setLoading(false);
    }
  };

  const rotateWisdom = useCallback(() => {
    if (wisdoms.length <= 1) return;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex((prev) => (prev + 1) % wisdoms.length);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [wisdoms.length, fadeAnim]);

  useEffect(() => {
    if (wisdoms.length > 1) {
      const interval = setInterval(rotateWisdom, 8000);
      return () => clearInterval(interval);
    }
  }, [wisdoms.length, rotateWisdom]);

  const handleShare = async () => {
    if (!shareText.trim() || !user?.id) return;
    setSharing(true);
    try {
      await supabase.from('yayika_community_posts').insert({
        user_id: user.id,
        content: shareText.trim(),
        category: 'wisdom',
        is_wisdom: true,
      });
      setShared(true);
      setShareText('');
      setTimeout(() => {
        setShareModalVisible(false);
        setShared(false);
      }, 2000);
    } catch {
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <Card style={[styles.card, { backgroundColor: colors.white }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </Card>
    );
  }

  const currentWisdom = wisdoms[currentIndex];
  if (!currentWisdom) return null;

  return (
    <>
      <Card style={[styles.card, { backgroundColor: colors.white }]}>
        <View style={styles.header}>
          <Ionicons name="sparkles" size={18} color={colors.gold} />
          <Text style={[styles.title, { color: colors.text }]}>
            {t('wisdom_title')}
          </Text>
        </View>

        <Animated.View style={[styles.wisdomContent, { opacity: fadeAnim }]}>
          <Ionicons name="chatbubble-ellipses" size={20} color={colors.primaryLight} style={styles.quoteIcon} />
          <Text style={[styles.wisdomText, { color: colors.text }]}>
            "{currentWisdom.text}"
          </Text>
          <Text style={[styles.wisdomSource, { color: colors.subtleText }]}>
            {t('wisdom_anonymous')}
          </Text>
        </Animated.View>

        {wisdoms.length > 1 && (
          <View style={styles.dots}>
            {wisdoms.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    backgroundColor: idx === currentIndex ? colors.primary : colors.border,
                    width: idx === currentIndex ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.shareButton, { borderColor: colors.primaryLight }]}
          onPress={() => setShareModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={[styles.shareButtonText, { color: colors.primary }]}>
            {t('wisdom_share')}
          </Text>
        </TouchableOpacity>
      </Card>

      <Modal
        visible={shareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('wisdom_share')}
              </Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.subtleText} />
              </TouchableOpacity>
            </View>

            {shared ? (
              <View style={styles.sharedContainer}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                <Text style={[styles.sharedText, { color: colors.success }]}>
                  ¡Gracias por compartir tu sabiduría!
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.modalSubtitle, { color: colors.subtleText }]}>
                  Tu sabiduría puede cambiar la vida de otra mujer
                </Text>
                <TextInput
                  style={[styles.textInput, {
                    backgroundColor: colors.white,
                    color: colors.text,
                    borderColor: colors.border,
                  }]}
                  multiline
                  numberOfLines={4}
                  placeholder={t('wisdom_share')}
                  placeholderTextColor={colors.subtleText}
                  value={shareText}
                  onChangeText={setShareText}
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.submitButton, {
                    backgroundColor: shareText.trim() ? colors.primary : colors.border,
                  }]}
                  onPress={handleShare}
                  disabled={!shareText.trim() || sharing}
                  activeOpacity={0.8}
                >
                  {sharing ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.submitButtonText}>{t('wisdom_share')}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  wisdomContent: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  quoteIcon: {
    marginBottom: spacing.xs,
  },
  wisdomText: {
    fontSize: typography.sizes.md,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: spacing.xs,
  },
  wisdomSource: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: spacing.md,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  shareButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  modalSubtitle: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  submitButton: {
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  sharedContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  sharedText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
