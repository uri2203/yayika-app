import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import Card from '../../components/Card';
import Button from '../../components/Button';

const AFFILIATE_CODE = 'GUERRERA20';

const stats = [
  { label: 'Visitas', value: '124', icon: 'eye' as keyof typeof Ionicons.glyphMap, color: colors.primary },
  { label: 'Conversiones', value: '18', icon: 'cart' as keyof typeof Ionicons.glyphMap, color: colors.turquoise },
  { label: 'Ganancias', value: '$1,440', icon: 'cash' as keyof typeof Ionicons.glyphMap, color: colors.gold },
];

const history = [
  { id: '1', date: '10 Ago 2026', amount: '+$120', status: 'Pagado' },
  { id: '2', date: '05 Ago 2026', amount: '+$80', status: 'Pagado' },
  { id: '3', date: '01 Ago 2026', amount: '+$200', status: 'Pendiente' },
];

export default function AffiliateScreen() {
  const [affiliateCode] = useState(AFFILIATE_CODE);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Únete a Yayika con mi código ${affiliateCode} y obtén un descuento! 🎉\n\nhttps://yayika.app/ref/${affiliateCode}`,
      });
    } catch {}
  };

  const handleCopyCode = () => {
    Alert.alert('Código copiado', `Tu código: ${affiliateCode}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Programa de Afiliadas</Text>
        <Text style={styles.subtitle}>Comparte y gana comisiones</Text>

        <Card style={styles.codeCard}>
          <Text style={styles.codeLabel}>Tu código de afiliada</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{affiliateCode}</Text>
            <Button
              title="Copiar"
              onPress={handleCopyCode}
              variant="secondary"
              style={styles.copyButton}
            />
          </View>
        </Card>

        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <Card key={index} style={styles.statCard}>
              <Ionicons name={stat.icon} size={22} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Card>
          ))}
        </View>

        <Button
          title="Compartir mi código"
          onPress={handleShare}
          variant="primary"
          style={styles.shareButton}
        />

        <Card style={styles.historyCard}>
          <Text style={styles.historyTitle}>Historial de comisiones</Text>
          {history.map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <View>
                <Text style={styles.historyDate}>{item.date}</Text>
                <Text
                  style={[
                    styles.historyStatus,
                    item.status === 'Pagado' ? styles.paid : styles.pending,
                  ]}
                >
                  {item.status}
                </Text>
              </View>
              <Text style={styles.historyAmount}>{item.amount}</Text>
            </View>
          ))}
        </Card>
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
  codeCard: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    marginBottom: spacing.sm,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeText: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    letterSpacing: 2,
    marginRight: spacing.md,
  },
  copyButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    paddingVertical: spacing.md,
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginTop: 2,
  },
  shareButton: {
    marginBottom: spacing.lg,
  },
  historyCard: {
    marginBottom: spacing.md,
  },
  historyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDate: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  historyStatus: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  paid: {
    color: colors.success,
  },
  pending: {
    color: colors.gold,
  },
  historyAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.turquoise,
  },
});
