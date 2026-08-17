import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { getProductCatalog } from '../../config/api';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  icon: string;
  color: string;
  url: string;
  category: string;
}

const CATEGORY_KEYS = ['Todos'] as const;
type CategoryKey = typeof CATEGORY_KEYS[number];

export default function StoreScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('Todos');
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const result = await getProductCatalog();
      if (result.success && result.products) {
        const mapped: Product[] = result.products.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          icon: p.icon || 'cart',
          color: p.color || colors.primary,
          url: p.url || '#',
          category: p.category || 'Cursos',
        }));
        setProducts(mapped);
        const uniqueCategories = [...new Set(mapped.map((p) => p.category))];
        setCategories(uniqueCategories);
      } else {
        setProducts([]);
        setCategories([]);
      }
    } catch {
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon as any} size={26} color={item.color} />
      </View>
      <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.productPrice}>{item.price}</Text>
      <TouchableOpacity
        style={[styles.buyButton, { backgroundColor: item.color }]}
        onPress={() => handleProductPress(item)}
      >
        <Text style={styles.buyButtonText}>{t('store_buy')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('store_title')}</Text>
        <Text style={styles.subtitle}>{t('store_subtitle')}</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.subtleText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('store_search')}
            placeholderTextColor={colors.subtleText}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
          {['Todos', ...categories].map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.chip, activeCategory === category && styles.chipActive]}
              onPress={() => setActiveCategory(category as CategoryKey)}
            >
              <Text style={[styles.chipText, activeCategory === category && styles.chipTextActive]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.productCountContainer}>
          <Text style={styles.productCount}>
            {t('store_product_count', { count: filteredProducts.length })}
          </Text>
        </View>

        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={colors.subtleText} />
            <Text style={styles.emptyText}>{t('store_no_products')}</Text>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {filteredProducts.map((item) => (
              <View key={item.id} style={styles.productCard}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={26} color={item.color} />
                </View>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>
                ) : null}
                <Text style={styles.productPrice}>{item.price}</Text>
                <TouchableOpacity
                  style={[styles.buyButton, { backgroundColor: item.color }]}
                  onPress={() => handleProductPress(item)}
                >
                  <Text style={styles.buyButtonText}>{t('store_buy')}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text, paddingTop: spacing.md },
  subtitle: { fontSize: typography.sizes.md, color: colors.subtleText, marginBottom: spacing.md },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: borderRadius.md, paddingHorizontal: spacing.md, marginBottom: spacing.md,
    shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, height: 48, fontSize: typography.sizes.md, color: colors.text },
  chipsContainer: { paddingBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
    backgroundColor: colors.white, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.subtleText },
  chipTextActive: { color: colors.white },
  productCountContainer: { marginTop: spacing.sm },
  productCount: { fontSize: typography.sizes.sm, color: colors.subtleText },
  productGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, 
    paddingBottom: spacing.xxl 
  },
  productRow: { justifyContent: 'space-between' },
  productCard: {
    width: '48%', backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.md, alignItems: 'center', shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  iconContainer: {
    width: 56, height: 56, borderRadius: borderRadius.md, justifyContent: 'center',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  productName: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text, textAlign: 'center', marginBottom: spacing.xs },
  productDescription: { fontSize: typography.sizes.xs, color: colors.subtleText, textAlign: 'center', marginBottom: spacing.xs, lineHeight: 16 },
  productPrice: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.primary, marginBottom: spacing.sm },
  buyButton: { width: '100%', paddingVertical: spacing.sm, borderRadius: borderRadius.sm, alignItems: 'center' },
  buyButtonText: { color: colors.white, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { fontSize: typography.sizes.md, color: colors.subtleText, marginTop: spacing.md },
});
