import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { colors, typography, spacing, borderRadius } from '../../config/theme';

const CATEGORIES = ['Todos', 'Cursos', 'Planners', 'Guías', 'Membresías'];

const PRODUCTS = [
  {
    id: '1',
    name: 'Ciclo Productiva',
    price: '$199 MXN',
    icon: 'rocket' as const,
    color: colors.primary,
    url: 'https://buy.stripe.com/eVq6oH8yWfsS248cX3gA80c',
    category: 'Cursos',
  },
  {
    id: '2',
    name: 'Dinero sin Pena',
    price: '$249 MXN',
    icon: 'cash' as const,
    color: colors.gold,
    url: 'https://buy.stripe.com/4gMbJ16qO5SidMQe17gA80d',
    category: 'Cursos',
  },
  {
    id: '3',
    name: 'Mujer que Negocia',
    price: '$179 MXN',
    icon: 'hand-left' as const,
    color: colors.rose,
    url: 'https://buy.stripe.com/8x2eVd5mK94uaAE8GNgA80e',
    category: 'Cursos',
  },
  {
    id: '4',
    name: 'Planner Mensual',
    price: '$89 MXN',
    icon: 'calendar' as const,
    color: colors.turquoise,
    url: '#',
    category: 'Planners',
  },
  {
    id: '5',
    name: 'Guía de Finanzas',
    price: '$129 MXN',
    icon: 'wallet' as const,
    color: colors.gold,
    url: '#',
    category: 'Guías',
  },
  {
    id: '6',
    name: 'Kit de Productividad',
    price: '$149 MXN',
    icon: 'rocket' as const,
    color: colors.primary,
    url: '#',
    category: 'Cursos',
  },
  {
    id: '7',
    name: 'Curso de Negociación',
    price: '$299 MXN',
    icon: 'school' as const,
    color: colors.rose,
    url: '#',
    category: 'Cursos',
  },
  {
    id: '8',
    name: 'Planner de Ciclo',
    price: '$99 MXN',
    icon: 'heartbeat' as const,
    color: '#8B5CF6',
    url: '#',
    category: 'Planners',
  },
];

export default function StoreScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesCategory =
      activeCategory === 'Todos' || product.category === activeCategory;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePurchase = async (url: string, name: string) => {
    if (url === '#') {
      Alert.alert('Próximamente', `${name} estará disponible pronto.`);
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('Error', 'No se pudo abrir el enlace de pago');
    }
  };

  const renderProduct = ({ item }: { item: (typeof PRODUCTS)[0] }) => (
    <View style={styles.productCard}>
      <View
        style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}
      >
        <Ionicons name={item.icon} size={26} color={item.color} />
      </View>
      <Text style={styles.productName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.productPrice}>{item.price}</Text>
      <TouchableOpacity
        style={[styles.buyButton, { backgroundColor: item.color }]}
        onPress={() => handlePurchase(item.url, item.name)}
      >
        <Text style={styles.buyButtonText}>Comprar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Tienda</Text>
        <Text style={styles.subtitle}>Explora nuestros productos</Text>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={colors.subtleText}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            placeholderTextColor={colors.subtleText}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.chip,
                activeCategory === category && styles.chipActive,
              ]}
              onPress={() => setActiveCategory(category)}
            >
              <Text
                style={[
                  styles.chipText,
                  activeCategory === category && styles.chipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.productCountContainer}>
          <Text style={styles.productCount}>
            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </ScrollView>

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productGrid}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="search-outline"
              size={48}
              color={colors.subtleText}
            />
            <Text style={styles.emptyText}>
              No se encontraron productos
            </Text>
          </View>
        }
      />
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
    paddingBottom: spacing.md,
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
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  chipsContainer: {
    paddingBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.subtleText,
  },
  chipTextActive: {
    color: colors.white,
  },
  productCountContainer: {
    marginTop: spacing.sm,
  },
  productCount: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
  },
  productGrid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  productName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  productPrice: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  buyButton: {
    width: '100%',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  buyButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.subtleText,
    marginTop: spacing.md,
  },
});
