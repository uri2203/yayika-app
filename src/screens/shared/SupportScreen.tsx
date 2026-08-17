import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Card from '../../components/Card';

export default function SupportScreen({ navigation }: any) {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const colors = currentColors;

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [sending, setSending] = useState(false);

  const FAQ = [
    { question: t('support_faq_1_question'), answer: t('support_faq_1_answer') },
    { question: t('support_faq_2_question'), answer: t('support_faq_2_answer') },
    { question: t('support_faq_3_question'), answer: t('support_faq_3_answer') },
    { question: t('support_faq_4_question'), answer: t('support_faq_4_answer') },
    { question: t('support_faq_5_question'), answer: t('support_faq_5_answer') },
    { question: t('support_faq_6_question'), answer: t('support_faq_6_answer') },
  ];

  const handleSendForm = () => {
    if (!formName.trim() || !formEmail.trim() || !formMessage.trim()) {
      Alert.alert(t('common_error'), t('auth_fill_all_fields'));
      return;
    }
    const subject = encodeURIComponent(`Soporte Yayika - ${formName.trim()}`);
    const body = encodeURIComponent(
      `Nombre: ${formName.trim()}\nEmail: ${formEmail.trim()}\n\nMensaje:\n${formMessage.trim()}`
    );
    Linking.openURL(`mailto:hola@yayika.com?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert(t('common_error'), t('common_open_link_error'));
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('support_title')}</Text>
            <View style={styles.backButton} />
          </View>

          <View style={[styles.contactBanner, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="mail-open-outline" size={28} color={colors.primary} />
            <View style={styles.contactBannerText}>
              <Text style={[styles.contactBannerTitle, { color: colors.primary }]}>{t('support_contact')}</Text>
              <TouchableOpacity onPress={() => Linking.openURL('mailto:hola@yayika.com')}>
                <Text style={[styles.contactBannerEmail, { color: colors.primary }]}>hola@yayika.com</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.subtleText }]}>{t('support_faq_section')}</Text>
          <Card style={styles.faqCard}>
            {FAQ.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.faqItem, { borderBottomColor: colors.border }, index === FAQ.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                activeOpacity={0.7}
              >
                <View style={styles.faqQuestionRow}>
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.question}</Text>
                  <Ionicons
                    name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.subtleText}
                  />
                </View>
                {expandedFaq === index && (
                  <Text style={[styles.faqAnswer, { color: colors.subtleText }]}>{item.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </Card>

          <Text style={[styles.sectionTitle, { color: colors.subtleText }]}>{t('support_contact_section')}</Text>
          <Card style={styles.formCard}>
            <Text style={[styles.formLabel, { color: colors.subtleText }]}>{t('auth_name')}</Text>
            <TextInput
              style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={formName}
              onChangeText={setFormName}
              placeholder={t('auth_name_placeholder')}
              placeholderTextColor={colors.subtleText}
            />

            <Text style={[styles.formLabel, { color: colors.subtleText }]}>{t('auth_email')}</Text>
            <TextInput
              style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={formEmail}
              onChangeText={setFormEmail}
              placeholder={t('auth_email_placeholder')}
              placeholderTextColor={colors.subtleText}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.formLabel, { color: colors.subtleText }]}>{t('support_title')}</Text>
            <TextInput
              style={[styles.formInput, styles.formTextarea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={formMessage}
              onChangeText={setFormMessage}
              placeholder={t('community_placeholder')}
              placeholderTextColor={colors.subtleText}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
              onPress={handleSendForm}
            >
              <Ionicons name="send-outline" size={18} color={colors.white} />
              <Text style={[styles.sendButtonText, { color: colors.white }]}>{t('auth_send')}</Text>
            </TouchableOpacity>
          </Card>

          <TouchableOpacity
            style={[styles.emailLink, { borderColor: colors.border }]}
            onPress={() => Linking.openURL('mailto:hola@yayika.com')}
          >
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={[styles.emailLinkText, { color: colors.primary }]}>hola@yayika.com</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  contactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  contactBannerText: { marginLeft: spacing.md, flex: 1 },
  contactBannerTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  contactBannerEmail: { fontSize: typography.sizes.sm, marginTop: 2, textDecorationLine: 'underline' },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  faqCard: { marginBottom: spacing.lg },
  faqItem: { padding: spacing.md, borderBottomWidth: 1 },
  faqQuestionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { flex: 1, fontSize: typography.sizes.md, fontWeight: typography.weights.medium, marginRight: spacing.sm },
  faqAnswer: { fontSize: typography.sizes.sm, marginTop: spacing.sm, lineHeight: 20 },
  formCard: { marginBottom: spacing.lg },
  formLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, marginBottom: spacing.xs, marginTop: spacing.sm },
  formInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: typography.sizes.md,
  },
  formTextarea: { height: 120, paddingTop: spacing.sm + 4 },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  sendButtonText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, marginLeft: spacing.sm },
  emailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  emailLinkText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, marginLeft: spacing.sm },
});
