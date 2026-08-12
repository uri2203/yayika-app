import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import Card from '../../components/Card';
import Button from '../../components/Button';

interface MembershipTier {
  id: string;
  name: string;
  price: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  features: string[];
  url: string;
}

export default function MembershipScreen() {
  const { t } = useLanguage();

  const tiers: MembershipTier[] = [
    {
      id: 'semilla',
      name: t('mem_semilla'),
      price: `$5${t('mem_month')}`,
      icon: 'leaf',
      color: colors.turquoise,
      features: [
        'Acceso a la comunidad',
        'Un recurso gratuito al mes',
        'Soporte por email',
      ],
      url: 'https://buy.stripe.com/00wcN502q0xY2481elgA80f',
    },
    {
      id: 'guerrera',
      name: t('mem_guerrera'),
      price: `$15${t('mem_month')}`,
      icon: 'shield',
      color: colors.primary,
      features: [
        'Todo lo de Semilla',
        '3 recursos premium al mes',
        'Masterclass mensuales',
        'Grupo privado de WhatsApp',
      ],
      url: 'https://buy.stripe.com/14A4gzeXk0xY4cg3mtgA80g',
    },
    {
      id: 'diamante',
      name: t('mem_diamante'),
      price: `$30${t('mem_month')}`,
      icon: 'diamond',
      color: colors.gold,
      features: [
        'Todo lo de Guerrera',
        'Acceso ilimitado a cursos',
        'Sesión grupal mensual',
        'Contenido exclusivo',
        'Soporte prioritario',
      ],
      url: 'https://buy.stripe.com/cNi9ATdTgfsSbEI4qxgA80h',
    },
  ];
  const handleSubscribe = async (tier: MembershipTier) => {
    try {
      await WebBrowser.openBrowserAsync(tier.url);
    } catch {
      Alert.alert('Error', 'No se pudo abrir el enlace de pago');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('mem_title')}</Text>
        <Text style={styles.subtitle}>Elige tu plan y crece con nosotros</Text>

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
              title={t('mem_subscribe')}
              onPress={() => handleSubscribe(tier)}
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
