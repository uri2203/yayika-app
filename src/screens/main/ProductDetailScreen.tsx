import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { getProductDetail } from '../../config/api';

const COLOR_MAP: Record<string, string> = {
  primary: colors.primary,
  gold: colors.gold,
  rose: colors.rose,
  turquoise: colors.turquoise,
  purple: colors.primary,
};

export default function ProductDetailScreen({ navigation, route }: any) {
  const { t } = useLanguage();
  const productId = route?.params?.productId ?? route?.params?.product?.id;
  const fallbackProduct = route?.params?.product;

  const [product, setProduct] = useState<any>(fallbackProduct ?? null);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [reviews, setReviews] = useState<{ name: string; rating: number; text: string }[]>([]);
  const [loading, setLoading] = useState(!fallbackProduct);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await getProductDetail(productId);
        if (cancelled) return;
        setProduct(res.product);
        setBenefits(res.product?.benefits ?? []);
        setReviews(res.product?.reviews ?? []);
      } catch {
        // keep fallback product if available
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [productId]);

  const priceDisplay = product?.price_display ?? (product?.price ? `$${product.price} MXN` : '');
  const heroColor = COLOR_MAP[product?.color] ?? product?.color ?? colors.primary;
  const iconName = product?.icon ?? 'rocket';

  const handleBuy = async () => {
    const url = product?.checkout_url ?? product?.url;
    if (url) await WebBrowser.openBrowserAsync(url);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={[styles.hero, { backgroundColor: heroColor }]}>
          <Ionicons name={iconName as any} size={80} color="white" />
        </View>

        {/* Product Info */}
        <View style={styles.content}>
          <Text style={styles.productName}>{product?.name}</Text>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{priceDisplay}</Text>
          </View>

          <Text style={styles.description}>{product?.description}</Text>

          {/* Benefits Section */}
          {benefits.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('pdetail_learns')}</Text>
              {benefits.map((benefit: string, index: number) => (
                <View key={index} style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.turquoise} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Reviews Section */}
          {reviews.length > 0 && (
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
          )}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceContainer}>
          <Text style={styles.bottomPriceLabel}>{t('pdetail_price')}</Text>
          <Text style={styles.bottomPrice}>{priceDisplay}</Text>
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
