import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';



export default function SupportScreen({ navigation }: any) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const { t } = useLanguage();

  const FAQ = [
    { question: t('support_faq_1_question'), answer: t('support_faq_1_answer') },
    { question: t('support_faq_2_question'), answer: t('support_faq_2_answer') },
    { question: t('support_faq_3_question'), answer: t('support_faq_3_answer') },
    { question: t('support_faq_4_question'), answer: t('support_faq_4_answer') },
    { question: t('support_faq_5_question'), answer: t('support_faq_5_answer') },
    { question: t('support_faq_6_question'), answer: t('support_faq_6_answer') },
  ];

  const QUICK_LINKS = [
    { icon: 'chatbubble-ellipses-outline' as const, label: t('support_faq'), color: colors.primary },
    { icon: 'mail-outline' as const, label: t('support_contact'), color: colors.turquoise },
    { icon: 'book-outline' as const, label: t('support_guide'), color: colors.gold },
    { icon: 'bug-outline' as const, label: t('support_bug'), color: colors.rose },
  ];

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="help-circle" size={28} color={colors.primary} />
          <Text style={styles.headerTitle}>{t('support_title')}</Text>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.subtleText} />
          <TextInput style={styles.searchInput} placeholder={t('support_search')} placeholderTextColor={colors.subtleText} />
        </View>

        <Text style={styles.sectionTitle}>{t('support_quick_links')}</Text>
        <View style={styles.quickLinksGrid}>
          {QUICK_LINKS.map((link, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickLinkCard}
              onPress={() => Alert.alert(link.label, t('support_coming_soon'))}
            >
              <View style={[styles.quickLinkIcon, { backgroundColor: link.color + '15' }]}>
                <Ionicons name={link.icon} size={24} color={link.color} />
              </View>
              <Text style={styles.quickLinkLabel}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('support_faq_section')}</Text>
        <View style={styles.faqContainer}>
          {FAQ.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => toggleFAQ(index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqQuestionRow}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Ionicons
                  name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.subtleText}
                />
              </View>
              {expandedIndex === index && (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>{t('support_contact_section')}</Text>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL('mailto:hola@yayika.com')}
          >
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={styles.contactText}>hola@yayika.com</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL('https://wa.me/525512345678')}
          >
            <Ionicons name="logo-whatsapp" size={20} color={colors.turquoise} />
            <Text style={styles.contactText}>WhatsApp: +52 55 1234 5678</Text>
          </TouchableOpacity>
        </View>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.subtleText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  quickLinkCard: {
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
  quickLinkIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickLinkLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  faqContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  faqItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
    marginRight: spacing.sm,
  },
  faqAnswer: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  contactSection: {
    marginTop: spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  contactText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    marginLeft: spacing.md,
  },
});
