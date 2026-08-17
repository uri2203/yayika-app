import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ProductDetailScreen({ navigation, route }: any) {
  const { t } = useLanguage();
  const product = route?.params?.product || {
    name: 'Ciclo Productiva',
    price: '$199 MXN',
    description: 'Aprende a crear productos digitales desde cero y genera ingresos pasivos.',
    url: 'https://buy.stripe.com/eVq6oH8yWfsS248cX3gA80c',
    color: '#4E3470',
    icon: 'rocket',
  };

  const benefits = [
    'Identifica nichos de mercado con alta demanda',
    'Crea productos digitales validados por el mercado',
    'Establece precios estratégicos para maximizar ganancias',
    'Lanza y promociona tu producto exitosamente',
  ];

  const reviews = [
    { name: 'María García', rating: 5, text: 'Increíble contenido. En 2 semanas lancé mi primer producto digital.' },
    { name: 'Carlos López', rating: 5, text: 'Muy práctico y fácil de seguir. Recomendado al 100%.' },
    { name: 'Ana Martínez', rating: 4, text: 'Me encantó la sección de pricing. Muy completa.' },
  ];

  const handleBuy = async () => {
    await WebBrowser.openBrowserAsync(product.url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={[styles.hero, { backgroundColor: product.color || colors.primary }]}>
          <Ionicons name={product.icon || 'rocket'} size={80} color="white" />
        </View>

        {/* Product Info */}
        <View style={styles.content}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{product.price}</Text>
          </View>

          <Text style={styles.description}>{product.description}</Text>

          {/* Benefits Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('pdetail_learns')}</Text>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={24} color={colors.turquoise} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Reviews Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('pdetail_reviews')}</Text>
            {reviews.map((review, index) => (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <View style={styles.stars}>
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Ionicons key={i} name="star" size={16} color={colors.gold} />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceContainer}>
          <Text style={styles.bottomPriceLabel}>Precio</Text>
          <Text style={styles.bottomPrice}>{product.price}</Text>
        </View>
        <TouchableOpacity style={styles.buyButton} onPress={handleBuy}>
          <Text style={styles.buyButtonText}>{t('pdetail_buy')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  hero: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
  },
  productName: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  priceBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  priceText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  description: {
    fontSize: typography.sizes.md,
    color: colors.subtleText,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  benefitText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  reviewCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reviewName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  stars: {
    flexDirection: 'row',
  },
  reviewText: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomPriceContainer: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
  },
  bottomPrice: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  buyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  buyButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
});
