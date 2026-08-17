import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

const LEGAL_URLS: Record<string, string> = {
  terms: 'https://yayika.com/legal/terminos',
  privacy: 'https://yayika.com/legal/privacidad',
  cookies: 'https://yayika.com/legal/cookies',
  content: 'https://yayika.com/legal/contenido',
  community: 'https://yayika.com/legal/comunidad',
  ai: 'https://yayika.com/legal/ia',
  data: 'https://yayika.com/legal/proteccion-datos',
};

export default function LegalScreen({ navigation }: any) {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const colors = currentColors;

  const documents = [
    { key: 'terms', label: t('legal_terms'), icon: 'document-text-outline' as const },
    { key: 'privacy', label: t('legal_privacy'), icon: 'shield-checkmark-outline' as const },
    { key: 'cookies', label: t('legal_cookies'), icon: 'leaf-outline' as const },
    { key: 'content', label: t('legal_content'), icon: 'document-outline' as const },
    { key: 'community', label: t('legal_community'), icon: 'people-outline' as const },
    { key: 'ai', label: t('legal_ai'), icon: 'hardware-chip-outline' as const },
    { key: 'data', label: t('legal_data'), icon: 'lock-closed-outline' as const },
  ];

  const handlePress = (key: string) => {
    const url = LEGAL_URLS[key];
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('legal_title')}</Text>
          <View style={styles.backButton} />
        </View>

        <View style={[styles.iconHeader, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="document-text" size={32} color={colors.primary} />
          <Text style={[styles.iconHeaderText, { color: colors.primary }]}>{t('legal_title')}</Text>
        </View>

        <View style={[styles.documentList, { backgroundColor: colors.white }]}>
          {documents.map((doc, index) => (
            <TouchableOpacity
              key={doc.key}
              style={[
                styles.documentRow,
                { borderBottomColor: colors.border },
                index === documents.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => handlePress(doc.key)}
              activeOpacity={0.7}
            >
              <View style={styles.documentLeft}>
                <View style={[styles.docIconContainer, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name={doc.icon} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.documentTitle, { color: colors.text }]}>{doc.label}</Text>
              </View>
              <View style={styles.documentRight}>
                <Ionicons name="open-outline" size={16} color={colors.subtleText} />
                <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.footer, { color: colors.subtleText }]}>{t('legal_copyright')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  iconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  iconHeaderText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginLeft: spacing.sm,
  },
  documentList: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  documentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  documentLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  docIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  documentTitle: { fontSize: typography.sizes.md, flex: 1 },
  documentRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  footer: {
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    marginTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
});
