import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Language } from '../../config/i18n';
import { colors as defaultColors, typography, spacing, borderRadius } from '../../config/theme';
import Card from '../../components/Card';

const LANGUAGES: { key: Language; label: string }[] = [
  { key: 'es', label: 'Español' },
  { key: 'en', label: 'English' },
  { key: 'pt', label: 'Português' },
  { key: 'fr', label: 'Français' },
  { key: 'de', label: 'Deutsch' },
];

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme, currentColors } = useTheme();
  const { lang, setLanguage, t } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const colors = currentColors;
  const userName = user?.user_metadata?.name || t('profile_default_name');
  const userEmail = user?.email || '';

  const handleSignOut = () => {
    Alert.alert(t('profile_sign_out'), t('profile_sign_out_confirm'), [
      { text: t('common_cancel'), style: 'cancel' },
      { text: t('profile_sign_out'), onPress: signOut, style: 'destructive' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('profile_settings')}</Text>

          <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
            <View style={styles.menuLeft}>
              <Ionicons name="moon-outline" size={22} color={colors.primary} />
              <Text style={[styles.menuText, { color: colors.text }]}>{t('profile_dark_mode')}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowLanguageModal(true)}>
            <View style={styles.menuLeft}>
              <Ionicons name="language-outline" size={22} color={colors.primary} />
              <Text style={styles.menuText}>{t('profile_language')}</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuValue}>{LANGUAGES.find(l => l.key === lang)?.label || 'Español'}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
            </View>
          </TouchableOpacity>
        </Card>

        <Modal visible={showLanguageModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('profile_language')}</Text>
              {LANGUAGES.map((language) => (
                <TouchableOpacity
                  key={language.key}
                  style={[
                    styles.languageOption,
                    lang === language.key && { backgroundColor: colors.primaryLight || '#E8D5F5' },
                  ]}
                  onPress={() => {
                    setLanguage(language.key);
                    setShowLanguageModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.languageText,
                      { color: colors.text },
                      lang === language.key && { color: colors.primary, fontWeight: typography.weights.bold },
                    ]}
                  >
                    {language.label}
                  </Text>
                  {lang === language.key && (
                    <Ionicons name="checkmark" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.modalClose, { borderColor: colors.border }]}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={[styles.modalCloseText, { color: colors.primary }]}>{t('common_close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('profile_support')}</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Support')}>
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
              <Text style={styles.menuText}>{t('profile_help')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Legal')}>
            <View style={styles.menuLeft}>
              <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              <Text style={styles.menuText}>{t('profile_terms')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Legal')}>
            <View style={styles.menuLeft}>
              <Ionicons name="shield-outline" size={22} color={colors.primary} />
              <Text style={styles.menuText}>{t('profile_privacy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
          </TouchableOpacity>
        </Card>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.signOutText}>{t('profile_sign_out')}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{t('profile_version')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: defaultColors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: defaultColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
    color: defaultColors.white,
  },
  userName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: defaultColors.text,
  },
  userEmail: {
    fontSize: typography.sizes.md,
    color: defaultColors.subtleText,
    marginTop: spacing.xs,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: defaultColors.subtleText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: defaultColors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: typography.sizes.md,
    color: defaultColors.text,
    marginLeft: spacing.md,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    fontSize: typography.sizes.md,
    color: defaultColors.subtleText,
    marginRight: spacing.xs,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius.md,
  },
  signOutText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: defaultColors.error,
    marginLeft: spacing.sm,
  },
  version: {
    textAlign: 'center',
    color: defaultColors.subtleText,
    fontSize: typography.sizes.xs,
    marginTop: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  languageText: {
    fontSize: typography.sizes.md,
  },
  modalClose: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
