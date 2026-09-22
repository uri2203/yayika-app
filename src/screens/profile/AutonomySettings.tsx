import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Card from '../../components/Card';

interface SettingItem {
  key: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  type: 'toggle' | 'navigate';
  defaultValue?: boolean;
}

const SETTINGS: SettingItem[] = [
  {
    key: 'notifications',
    titleKey: 'onboard_notif_push',
    descriptionKey: 'onboard_notif_push_desc',
    icon: 'notifications',
    type: 'toggle',
    defaultValue: true,
  },
  {
    key: 'email_digest',
    titleKey: 'onboard_notif_email',
    descriptionKey: 'onboard_notif_email_desc',
    icon: 'mail',
    type: 'toggle',
    defaultValue: false,
  },
  {
    key: 'language',
    titleKey: 'profile_language',
    descriptionKey: 'settings_app',
    icon: 'globe',
    type: 'navigate',
  },
  {
    key: 'appearance',
    titleKey: 'settings_appearance',
    descriptionKey: 'settings_dark_mode',
    icon: 'color-palette',
    type: 'navigate',
  },
  {
    key: 'support',
    titleKey: 'profile_support',
    descriptionKey: 'profile_help',
    icon: 'help-circle',
    type: 'navigate',
  },
  {
    key: 'legal',
    titleKey: 'legal_title',
    descriptionKey: 'legal_terms',
    icon: 'document-text',
    type: 'navigate',
  },
];

export default function AutonomySettings({ navigation }: any) {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const colors = currentColors;

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    notifications: true,
    email_digest: false,
  });

  const handleToggle = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNavigate = (key: string) => {
    switch (key) {
      case 'language':
        navigation.navigate('Settings');
        break;
      case 'appearance':
        navigation.navigate('Settings');
        break;
      case 'support':
        navigation.navigate('Support');
        break;
      case 'legal':
        navigation.navigate('Legal');
        break;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile_settings')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: colors.subtleText }]}>
          {t('settings_app')}
        </Text>

        {SETTINGS.map((item) => (
          <Card key={item.key} style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => item.type === 'navigate' && handleNavigate(item.key)}
              activeOpacity={item.type === 'navigate' ? 0.7 : 1}
              disabled={item.type === 'toggle'}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name={item.icon as any} size={20} color={colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t(item.titleKey)}
                </Text>
                <Text style={[styles.settingDesc, { color: colors.subtleText }]}>
                  {t(item.descriptionKey)}
                </Text>
              </View>
              {item.type === 'toggle' ? (
                <Switch
                  value={toggles[item.key] ?? item.defaultValue ?? false}
                  onValueChange={() => handleToggle(item.key)}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={toggles[item.key] ? colors.primary : colors.subtleText}
                />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.subtleText} />
              )}
            </TouchableOpacity>
          </Card>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.subtleText, marginTop: spacing.lg }]}>
          {t('profile_support')}
        </Text>

        <Card style={styles.settingCard}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('Support')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.successBg }]}>
              <Ionicons name="chatbubble-ellipses" size={20} color={colors.success} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                {t('support_contact')}
              </Text>
              <Text style={[styles.settingDesc, { color: colors.subtleText }]}>
                {t('support_contact_title')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subtleText} />
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  settingCard: {
    marginBottom: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  settingDesc: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
