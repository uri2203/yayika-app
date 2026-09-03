import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Language } from '../../config/i18n';
import { typography, spacing, borderRadius } from '../../config/theme';
import { supabase } from '../../config/supabase';
import Card from '../../components/Card';

const LANGUAGES: { key: Language; label: string }[] = [
  { key: 'es', label: 'EspaÃ±ol' },
  { key: 'en', label: 'English' },
  { key: 'pt', label: 'PortuguÃªs' },
  { key: 'fr', label: 'FranÃ§ais' },
  { key: 'de', label: 'Deutsch' },
];

export default function SettingsScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const { isDark, toggleTheme, currentColors } = useTheme();
  const { lang, setLanguage, t } = useLanguage();
  const colors = currentColors;

  const [displayName, setDisplayName] = useState(profile?.full_name || user?.user_metadata?.name || '');
  const [countryCode, setCountryCode] = useState(profile?.country_code || '');
  const [city, setCity] = useState(profile?.city || '');
  const [currency, setCurrency] = useState(profile?.currency_code || '');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.full_name || '');
      setCountryCode(profile.country_code || '');
      setCity(profile.city || '');
      setCurrency(profile.currency_code || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('yayika_profiles')
        .upsert({
          id: user.id,
          full_name: displayName.trim(),
          country_code: countryCode.trim().toUpperCase(),
          city: city.trim(),
          currency_code: currency.trim().toUpperCase(),
        }, { onConflict: 'id' });
      if (error) throw error;
      Alert.alert(t('common_success') , t('profile_settings') + ' âœ“');
    } catch (err: any) {
      Alert.alert(t('common_error'), err.message || t('common_error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile_settings')}</Text>
          <View style={styles.backButton} />
        </View>

        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.subtleText }]}>{t('common_edit')} {t('nav_profile')}</Text>

          <Text style={[styles.label, { color: colors.subtleText }]}>{t('auth_name')}</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.white }]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t('auth_name_placeholder')}
            placeholderTextColor={colors.subtleText}
          />

          <Text style={[styles.label, { color: colors.subtleText }]}>{t('settings_country_code')}</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.white }]}
            value={countryCode}
            onChangeText={(text) => setCountryCode(text.toUpperCase().slice(0, 2))}
            placeholder="MX"
            placeholderTextColor={colors.subtleText}
            maxLength={2}
            autoCapitalize="characters"
          />

          <Text style={[styles.label, { color: colors.subtleText }]}>{t('settings_city')}</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.white }]}
            value={city}
            onChangeText={setCity}
            placeholder="Ciudad de MÃ©xico"
            placeholderTextColor={colors.subtleText}
          />

          <Text style={[styles.label, { color: colors.subtleText }]}>{t('home_balance')}</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.white }]}
            value={currency}
            onChangeText={(text) => setCurrency(text.toUpperCase().slice(0, 3))}
            placeholder="MXN"
            placeholderTextColor={colors.subtleText}
            maxLength={3}
            autoCapitalize="characters"
          />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.subtleText }]}>{t('profile_language')}</Text>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => setShowLanguageModal(true)}>
            <View style={styles.menuLeft}>
              <Ionicons name="language-outline" size={22} color={colors.primary} />
              <Text style={[styles.menuText, { color: colors.text }]}>{t('profile_language')}</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={[styles.menuValue, { color: colors.subtleText }]}>{LANGUAGES.find(l => l.key === lang)?.label }</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
            </View>
          </TouchableOpacity>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.subtleText }]}>{t('settings_appearance') }</Text>

          <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
            <View style={styles.menuLeft}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={colors.primary} />
              <Text style={[styles.menuText, { color: colors.text }]}>{t('settings_dark_mode') }</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.subtleText }]}>{t('onboard_notif_title')}</Text>

          <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
            <View style={styles.menuLeft}>
              <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              <Text style={[styles.menuText, { color: colors.text }]}>{t('onboard_notif_push')}</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
            <View style={styles.menuLeft}>
              <Ionicons name="mail-outline" size={22} color={colors.primary} />
              <Text style={[styles.menuText, { color: colors.text }]}>{t('onboard_notif_email')}</Text>
            </View>
            <Switch
              value={emailDigest}
              onValueChange={setEmailDigest}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
              <Text style={[styles.saveButtonText, { color: colors.white }]}>{t('common_save')}</Text>
            </>
          )}
        </TouchableOpacity>

        <Modal
          visible={showLanguageModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLanguageModal(false)}
        >
          <View style={styles.languageOverlay}>
            <View style={[styles.languageModal, { backgroundColor: colors.background }]}>
              <Text style={[styles.languageModalTitle, { color: colors.text }]}>{t('profile_language')}</Text>
              {LANGUAGES.map((language) => (
                <TouchableOpacity
                  key={language.key}
                  style={[
                    styles.languageOption,
                    lang === language.key && { backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => {
                    setLanguage(language.key);
                    setShowLanguageModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      { color: colors.text },
                      lang === language.key && { color: colors.primary, fontWeight: typography.weights.bold },
                    ]}
                  >
                    {language.label}
                  </Text>
                  {lang === language.key && <Ionicons name="checkmark" size={22} color={colors.primary} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.languageModalClose, { borderColor: colors.border }]}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={[styles.languageModalCloseText, { color: colors.primary }]}>{t('common_close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  sectionCard: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: typography.sizes.md,
    marginBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { fontSize: typography.sizes.md, marginLeft: spacing.md },
  menuRight: { flexDirection: 'row', alignItems: 'center' },
  menuValue: { fontSize: typography.sizes.md, marginRight: spacing.xs },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  saveButtonText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, marginLeft: spacing.sm },
  languageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  languageModal: { width: '100%', maxWidth: 400, borderRadius: borderRadius.lg, padding: spacing.lg },
  languageModalTitle: {
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
  languageOptionText: { fontSize: typography.sizes.md },
  languageModalClose: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  languageModalCloseText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
});
