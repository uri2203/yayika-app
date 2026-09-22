import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LEGAL_TEXTS } from '../config/legalTexts';
import Button from './Button';

interface LegalDisclaimerModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function LegalDisclaimerModal({
  visible,
  onAccept,
  onDecline,
}: LegalDisclaimerModalProps) {
  const { currentColors } = useTheme();
  const { t, lang } = useLanguage();
  const colors = currentColors;
  const texts = LEGAL_TEXTS[lang] || LEGAL_TEXTS.es;

  const [checked, setChecked] = useState({
    terms: false,
    privacy: false,
    health: false,
    age: false,
    ai: false,
  });

  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const allChecked = checked.terms && checked.privacy && checked.health && checked.age && checked.ai;

  const toggleCheck = (key: keyof typeof checked) => {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const documents = [
    { key: 'terms', title: texts.accept_terms, fullTitle: texts.terms_title, content: buildDocContent(texts, 'terms') },
    { key: 'privacy', title: texts.accept_privacy, fullTitle: texts.privacy_title, content: buildDocContent(texts, 'privacy') },
    { key: 'health', title: texts.accept_health, fullTitle: texts.health_title, content: buildDocContent(texts, 'health') },
    { key: 'ai', title: texts.accept_ai, fullTitle: texts.ai_title, content: buildDocContent(texts, 'ai') },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              {texts.accept_title}
            </Text>
            <Text style={[styles.subtitle, { color: colors.subtleText }]}>
              {texts.accept_required}
            </Text>
          </View>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
          >
            {documents.map(doc => (
              <View key={doc.key} style={[styles.checkSection, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.checkRow}
                  onPress={() => toggleCheck(doc.key as keyof typeof checked)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkbox,
                    {
                      borderColor: checked[doc.key as keyof typeof checked]
                        ? colors.primary
                        : colors.border,
                      backgroundColor: checked[doc.key as keyof typeof checked]
                        ? colors.primary
                        : 'transparent',
                    },
                  ]}>
                    {checked[doc.key as keyof typeof checked] && (
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    )}
                  </View>
                  <Text style={[styles.checkLabel, { color: colors.text }]}>
                    {doc.title}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.readMore}
                  onPress={() => setExpandedDoc(expandedDoc === doc.key ? null : doc.key)}
                >
                  <Text style={[styles.readMoreText, { color: colors.primary }]}>
                    {texts.accept_read_more}
                  </Text>
                  <Ionicons
                    name={expandedDoc === doc.key ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={colors.primary}
                  />
                </TouchableOpacity>

                {expandedDoc === doc.key && (
                  <View style={[styles.expandedContent, { backgroundColor: colors.white }]}>
                    <Text style={[styles.expandedTitle, { color: colors.text }]}>
                      {doc.fullTitle}
                    </Text>
                    <Text style={[styles.expandedText, { color: colors.subtleText }]}>
                      {doc.content}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => toggleCheck('age')}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                {
                  borderColor: checked.age ? colors.primary : colors.border,
                  backgroundColor: checked.age ? colors.primary : 'transparent',
                },
              ]}>
                {checked.age && (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                )}
              </View>
              <Text style={[styles.checkLabel, { color: colors.text }]}>
                {texts.accept_age}
              </Text>
            </TouchableOpacity>

            <View style={[styles.infoBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>
                {texts.accept_documents}
              </Text>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button
              title={texts.accept_terms.replace('Acepto', 'Aceptar').replace('I accept', 'Accept').replace('Aceito', 'Aceitar').replace("J'accepte", 'Accepter').replace('Ich akzeptiere', 'Akzeptieren')}
              onPress={onAccept}
              disabled={!allChecked}
              style={styles.acceptButton}
            />
            <TouchableOpacity onPress={onDecline} style={styles.declineButton}>
              <Text style={[styles.declineText, { color: colors.subtleText }]}>
                {t('common_cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function buildDocContent(texts: Record<string, string>, prefix: string): string {
  const sections: string[] = [];
  for (const key of Object.keys(texts)) {
    if (key.startsWith(prefix + '_') && key.endsWith('_text')) {
      sections.push(texts[key]);
    }
  }
  return sections.join('\n\n');
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  checkSection: {
    borderBottomWidth: 1,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkLabel: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingLeft: 30,
  },
  readMoreText: {
    fontSize: typography.sizes.sm,
    marginRight: spacing.xs,
  },
  expandedContent: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginLeft: 30,
  },
  expandedTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  expandedText: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    marginLeft: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  acceptButton: {
    marginBottom: spacing.sm,
  },
  declineButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  declineText: {
    fontSize: typography.sizes.md,
  },
});
