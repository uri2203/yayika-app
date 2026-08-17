import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { stripeMarketplaceCheckout, stripeConnectOnboard, getSubscriptions } from '../../config/api';
import Card from '../../components/Card';
import Button from '../../components/Button';

interface MembershipTier {
  id: string;
  name: string;
  price: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  features: string[];
}

export default function MembershipScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      if (!user) return;
      const sub = await getSubscriptions(user.id);
      setActiveSubscription(sub);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const built: MembershipTier[] = [
      {
        id: 'semilla',
        name: t('mem_semilla'),
        price: `$5${t('mem_month')}`,
        icon: 'leaf',
        color: colors.turquoise,
        features: [t('mem_semilla_feature_1'), t('mem_semilla_feature_2'), t('mem_semilla_feature_3')],
      },
      {
        id: 'guerrera',
        name: t('mem_guerrera'),
        price: `$15${t('mem_month')}`,
        icon: 'shield',
        color: colors.primary,
        features: [t('mem_guerrera_feature_1'), t('mem_guerrera_feature_2'), t('mem_guerrera_feature_3'), t('mem_guerrera_feature_4')],
      },
      {
        id: 'diamante',
        name: t('mem_diamante'),
        price: `$30${t('mem_month')}`,
        icon: 'diamond',
        color: colors.gold,
        features: [t('mem_diamante_feature_1'), t('mem_diamante_feature_2'), t('mem_diamante_feature_3'), t('mem_diamante_feature_4'), t('mem_diamante_feature_5')],
      },
    ];
    setTiers(built);
  }, [t]);

  const handleSubscribe = async (tier: MembershipTier) => {
    try {
      setSubscribing(tier.id);
      const res = await stripeMarketplaceCheckout({
        tier: tier.id,
        success_url: 'yayika://membership/success',
        cancel_url: 'yayika://membership/cancel',
      });
      await WebBrowser.openBrowserAsync(res.url);
      loadSubscription();
    } catch {
      Alert.alert(t('common_error'), t('common_open_link_error'));
    } finally {
      setSubscribing(null);
    }
  };

  const handleManage = async () => {
    try {
      const res = await stripeConnectOnboard();
      await WebBrowser.openBrowserAsync(res.url);
    } catch {
      Alert.alert(t('common_error'), t('common_open_link_error'));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('mem_title')}</Text>
        <Text style={styles.subtitle}>{t('mem_subtitle')}</Text>

        {activeSubscription && (
          <Card style={[styles.tierCard, { borderColor: colors.success, borderWidth: 2 }]}>
            <View style={styles.tierHeader}>
              <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={28} color={colors.success} />
              </View>
              <View style={styles.tierInfo}>
                <Text style={styles.tierName}>{activeSubscription.tier ?? 'Guerrera'}</Text>
                <Text style={[styles.tierPrice, { color: colors.success }]}>{t('mem_active')}</Text>
              </View>
            </View>
            <Button
              title={t('mem_manage')}
              onPress={handleManage}
              variant="outline"
              style={styles.subscribeButton}
            />
          </Card>
        )}

        {tiers.map((tier) => (
          <Card
            key={tier.id}
            style={[styles.tierCard, tier.id === 'guerrera' && styles.featuredCard]}
          >
            {tier.id === 'guerrera' && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>{t('mem_popular')}</Text>
              </View>
            )}
            <View style={styles.tierHeader}>
              <View style={[styles.iconContainer, { backgroundColor: tier.color + '20' }]}>
                <Ionicons name={tier.icon} size={28} color={tier.color} />
              </View>
              <View style={styles.tierInfo}>
                <Text style={styles.tierName}>{tier.name}</Text>
                <Text style={[styles.tierPrice, { color: tier.color }]}>{tier.price}</Text>
              </View>
            </View>

            <View style={styles.featuresContainer}>
              {tier.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={tier.color}
                    style={styles.featureIcon}
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <Button
              title={subscribing === tier.id ? t('mem_subscribing') : t('mem_subscribe')}
              onPress={() => handleSubscribe(tier)}
              disabled={subscribing !== null}
              variant={tier.id === 'guerrera' ? 'primary' : 'outline'}
              style={[styles.subscribeButton, tier.id === 'guerrera' && { backgroundColor: tier.color }]}
            />
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    paddingTop: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.subtleText,
    marginBottom: spacing.lg,
  },
  tierCard: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  featuredCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  featuredBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  featuredText: {
    color: colors.white,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  tierPrice: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  featuresContainer: {
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureIcon: {
    marginRight: spacing.sm,
  },
  featureText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    flex: 1,
  },
  subscribeButton: {
    marginTop: spacing.xs,
  },
});
