import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';



export default function LegalScreen({ navigation }: any) {
  const { t } = useLanguage();

  const LEGAL_DOCUMENTS = [
    t('legal_terms'),
    t('legal_privacy'),
    t('legal_cookies'),
    t('legal_content'),
    t('legal_community'),
    t('legal_payments'),
    t('legal_ai'),
    t('legal_data'),
    t('legal_fiscal'),
    t('legal_disclaimer'),
    t('legal_accessibility'),
  ];
  const handleDocumentPress = (title: string) => {
    Alert.alert(title, t('legal_content_available'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="document-text" size={28} color={colors.primary} />
          <Text style={styles.headerTitle}>{t('legal_title')}</Text>
        </View>

        <View style={styles.documentList}>
          {LEGAL_DOCUMENTS.map((doc, index) => (
            <TouchableOpacity
              key={index}
              style={styles.documentRow}
              onPress={() => handleDocumentPress(doc)}
              activeOpacity={0.7}
            >
              <View style={styles.documentLeft}>
                <Ionicons name="document-outline" size={20} color={colors.primary} />
                <Text style={styles.documentTitle}>{doc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footer}>{t('legal_copyright')}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  documentList: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  documentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  documentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentTitle: {
    fontSize: typography.sizes.md,
    color: colors.text,
    marginLeft: spacing.md,
    flex: 1,
  },
  footer: {
    textAlign: 'center',
    color: colors.subtleText,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
});
