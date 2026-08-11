import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import Card from '../../components/Card';
import Button from '../../components/Button';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  priceAmount: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  url: string;
}

const products: Product[] = [
  {
    id: 'ciclo-productiva',
    name: 'Ciclo Productiva',
    description:
      'Aprende a crear productos digitales que se vendan solos. Guía completa paso a paso.',
    price: '$199 MXN',
    priceAmount: 199,
    icon: 'rocket',
    color: colors.primary,
    url: 'https://buy.stripe.com/eVq6oH8yWfsS248cX3gA80c',
  },
  {
    id: 'dinero-sin-pena',
    name: 'Dinero sin Pena',
    description:
      'Supera la culpa de cobrar y aprende a valorar tu trabajo. Módulo transformador.',
    price: '$249 MXN',
    priceAmount: 249,
    icon: 'cash',
    color: colors.gold,
    url: 'https://buy.stripe.com/4gMbJ16qO5SidMQe17gA80d',
  },
  {
    id: 'mujer-que-negocia',
    name: 'Mujer que Negocia',
    description:
      'Técnicas de negociación diseñadas para mujeres. Negocia con confianza.',
    price: '$179 MXN',
    priceAmount: 179,
    icon: 'hand-left',
    color: colors.rose,
    url: 'https://buy.stripe.com/8x2eVd5mK94uaAE8GNgA80e',
  },
];

export default function ProductsScreen() {
  const handlePurchase = async (product: Product) => {
    try {
      await WebBrowser.openBrowserAsync(product.url);
    } catch {
      Alert.alert('Error', 'No se pudo abrir el enlace de pago');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Productos</Text>
        <Text style={styles.subtitle}>Invierte en tu crecimiento</Text>

        {products.map((product) => (
          <Card key={product.id} style={styles.productCard}>
            <View style={styles.productHeader}>
              <View style={[styles.iconContainer, { backgroundColor: product.color + '20' }]}>
                <Ionicons name={product.icon} size={28} color={product.color} />
              </View>
              <Text style={styles.productPrice}>{product.price}</Text>
            </View>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription}>{product.description}</Text>
            <Button
              title="Comprar ahora"
              onPress={() => handlePurchase(product)}
              variant="primary"
              style={[styles.buyButton, { backgroundColor: product.color }]}
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
