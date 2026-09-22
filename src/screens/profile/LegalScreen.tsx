import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LEGAL_TEXTS } from '../../config/legalTexts';

interface DocumentDef {
  key: string;
  titleKey: string;
  icon: string;
  sections: string[];
}

export default function LegalScreen({ navigation }: any) {
  const { currentColors } = useTheme();
  const { t, lang } = useLanguage();
  const colors = currentColors;
  const texts = LEGAL_TEXTS[lang] || LEGAL_TEXTS.es;

  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const documents: DocumentDef[] = [
    {
      key: 'terms',
      titleKey: 'terms_title',
      icon: 'document-text-outline',
      sections: [
        'terms_acceptance_title', 'terms_acceptance_text',
        'terms_description_title', 'terms_description_text',
        'terms_eligibility_title', 'terms_eligibility_text',
        'terms_account_title', 'terms_account_text',
        'terms_acceptable_use_title', 'terms_acceptable_use_text',
        'terms_ip_title', 'terms_ip_text',
        'terms_termination_title', 'terms_termination_text',
        'terms_modification_title', 'terms_modification_text',
        'terms_governing_title', 'terms_governing_text',
      ],
    },
    {
      key: 'privacy',
      titleKey: 'privacy_title',
      icon: 'shield-checkmark-outline',
      sections: [
        'privacy_data_collection_title', 'privacy_data_collection_text',
        'privacy_data_use_title', 'privacy_data_use_text',
        'privacy_data_sharing_title', 'privacy_data_sharing_text',
        'privacy_data_security_title', 'privacy_data_security_text',
        'privacy_data_retention_title', 'privacy_data_retention_text',
        'privacy_user_rights_title', 'privacy_user_rights_text',
        'privacy_cookies_title', 'privacy_cookies_text',
        'privacy_children_title', 'privacy_children_text',
      ],
    },
    {
      key: 'health',
      titleKey: 'health_title',
      icon: 'medical-outline',
      sections: [
        'health_disclaimer_title', 'health_disclaimer_text',
        'health_no_diagnosis_title', 'health_no_diagnosis_text',
        'health_emergency_title', 'health_emergency_text',
        'health_pregnancy_title', 'health_pregnancy_text',
        'health_mental_health_title', 'health_mental_health_text',
        'health_accuracy_title', 'health_accuracy_text',
      ],
    },
    {
      key: 'ai',
      titleKey: 'ai_title',
      icon: 'hardware-chip-outline',
      sections: [
        'ai_disclaimer_title', 'ai_disclaimer_text',
        'ai_limitations_title', 'ai_limitations_text',
        'ai_no_therapy_title', 'ai_no_therapy_text',
        'ai_data_title', 'ai_data_text',
      ],
    },
    {
      key: 'finance',
      titleKey: 'finance_title',
      icon: 'wallet-outline',
      sections: [
        'finance_disclaimer_title', 'finance_disclaimer_text',
        'finance_no_advice_title', 'finance_no_advice_text',
        'finance_responsibility_title', 'finance_responsibility_text',
      ],
    },
    {
      key: 'liability',
      titleKey: 'liability_title',
      icon: 'alert-circle-outline',
      sections: [
        'liability_general_title', 'liability_general_text',
        'liability_user_title', 'liability_user_text',
        'liability_third_party_title', 'liability_third_party_text',
        'liability_availability_title', 'liability_availability_text',
      ],
    },
    {
      key: 'community',
      titleKey: 'community_title',
      icon: 'people-outline',
      sections: [
        'community_conduct_title', 'community_conduct_text',
        'community_moderation_title', 'community_moderation_text',
        'community_content_title', 'community_content_text',
        'community_safety_title', 'community_safety_text',
      ],
    },
  ];

  const toggleExpand = (key: string) => {
    setExpandedDoc(expandedDoc === key ? null : key);
  };

  const handleShare = async () => {
    try {
      const docTitle = expandedDoc
        ? texts[documents.find(d => d.key === expandedDoc)?.titleKey || ''] || 'Legal'
        : 'Yayika Legal Documents';
      await Share.share({
        message: `${docTitle}\n\n© 2026 Yayika - Todos los derechos reservados`,
      });
    } catch {}
  };

  const renderDocContent = (doc: DocumentDef) => {
    const content: React.ReactNode[] = [];
    for (let i = 0; i < doc.sections.length; i += 2) {
      const titleKey = doc.sections[i];
      const textKey = doc.sections[i + 1];
      const title = texts[titleKey] || titleKey;
      const text = texts[textKey] || textKey;
      content.push(
        <View key={titleKey} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.sectionText, { color: colors.subtleText }]}>{text}</Text>
        </View>
      );
    }
    return content;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('legal_title')}</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.iconHeader, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="document-text" size={28} color={colors.primary} />
          <Text style={[styles.iconHeaderText, { color: colors.primary }]}>
            {texts.accept_documents}
          </Text>
        </View>

        <Text style={[styles.lastUpdated, { color: colors.subtleText }]}>
          {texts.terms_last_updated}
        </Text>

        <View style={styles.documentList}>
          {documents.map(doc => (
            <View
              key={doc.key}
              style={[styles.documentCard, { backgroundColor: colors.white }]}
            >
              <TouchableOpacity
                style={styles.documentHeader}
                onPress={() => toggleExpand(doc.key)}
                activeOpacity={0.7}
              >
                <View style={styles.documentLeft}>
                  <View style={[styles.docIconContainer, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name={doc.icon as any} size={18} color={colors.primary} />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={[styles.documentTitle, { color: colors.text }]}>
                      {texts[doc.titleKey] || doc.titleKey}
                    </Text>
                    {expandedDoc !== doc.key && (
                      <Text style={[styles.documentPreview, { color: colors.subtleText }]} numberOfLines={2}>
                        {texts[doc.sections[1]]?.substring(0, 100)}...
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons
                  name={expandedDoc === doc.key ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.subtleText}
                />
              </TouchableOpacity>

              {expandedDoc === doc.key && (
                <View style={styles.documentContent}>
                  {renderDocContent(doc)}
                </View>
              )}
            </View>
          ))}
        </View>

        <Text style={[styles.footer, { color: colors.subtleText }]}>
          {t('legal_copyright')}
        </Text>
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
  shareButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  iconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  iconHeaderText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginLeft: spacing.sm,
  },
  lastUpdated: {
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    marginBottom: spacing.lg,
  },
  documentList: {
    gap: spacing.sm,
  },
  documentCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  documentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  docIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  documentPreview: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  documentContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  sectionText: {
    fontSize: typography.sizes.sm,
    lineHeight: 22,
  },
  footer: {
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    marginTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
});
