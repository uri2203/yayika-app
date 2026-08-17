import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { getProductCatalog } from '../../config/api';
import Card from '../../components/Card';
import Button from '../../components/Button';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  priceAmount: number;
  icon: string;
  color: string;
  url: string;
}

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  rocket: 'rocket',
  cash: 'cash',
  'hand-left': 'hand-left',
  book: 'book',
  star: 'star',
  heart: 'heart',
 bulb: 'bulb',
  default: 'cube',
};

const COLOR_MAP: Record<string, string> = {
  primary: colors.primary,
  gold: colors.gold,
  rose: colors.rose,
  turquoise: colors.turquoise,
  purple: colors.primary,
};

export default function ProductsScreen() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await getProductCatalog();
        if (cancelled) return;
        const mapped = (res.products ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price_display ?? `$${p.price ?? ''}`,
          priceAmount: p.price ?? 0,
          icon: ICON_MAP[p.icon] ?? 'cube',
          color: COLOR_MAP[p.color] ?? colors.primary,
          url: p.checkout_url ?? p.url ?? '',
        }));
        setProducts(mapped);
      } catch {
        // keep empty on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handlePurchase = async (product: Product) => {
    try {
      await WebBrowser.openBrowserAsync(product.url);
    } catch {
      Alert.alert(t('common_error'), t('products_open_link_error'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('products_title')}</Text>
        <Text style={styles.subtitle}>{t('products_subtitle')}</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          products.map((product) => (
            <Card key={product.id} style={styles.productCard}>
              <View style={styles.productHeader}>
                <View style={[styles.iconContainer, { backgroundColor: product.color + '20' }]}>
                  <Ionicons name={product.icon as any} size={28} color={product.color} />
                </View>
                <Text style={styles.productPrice}>{product.price}</Text>
              </View>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDescription}>{product.description}</Text>
              <Button
                title={t('store_buy_now')}
                onPress={() => handlePurchase(product)}
                variant="primary"
                style={[styles.buyButton, { backgroundColor: product.color }]}
              />
            </Card>
          ))
        )}
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
  productCard: {
    marginBottom: spacing.md,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  productName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  productDescription: {
    fontSize: typography.sizes.md,
    color: colors.subtleText,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  buyButton: {
    marginTop: spacing.xs,
  },
});
