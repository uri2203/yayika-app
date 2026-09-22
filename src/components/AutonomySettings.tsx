import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { typography, spacing, borderRadius } from '../config/theme';

const AUTONOMY_STORAGE_KEY = 'yayika_autonomy_settings';

const AI_PERSONALITIES = [
  { id: 'empatica', labelEs: 'Laura empática', labelEn: 'Empathetic Laura', icon: 'heart' },
  { id: 'directa', labelEs: 'Laura directa', labelEn: 'Direct Laura', icon: 'flash' },
  { id: 'divertida', labelEs: 'Laura divertida', labelEn: 'Fun Laura', icon: 'happy' },
] as const;

type AIPersonality = typeof AI_PERSONALITIES[number]['id'];

interface AutonomySettings {
  shareCycle: boolean;
  shareMood: boolean;
  shareSymptoms: boolean;
  shareEnergy: boolean;
  shareWithAI: boolean;
  shareWithCircles: boolean;
  shareAnonymous: boolean;
  notifFrequency: 'daily' | 'weekly' | 'never';
  invisibleMode: boolean;
  aiPersonality: AIPersonality;
}

const DEFAULT_SETTINGS: AutonomySettings = {
  shareCycle: true,
  shareMood: true,
  shareSymptoms: true,
  shareEnergy: true,
  shareWithAI: true,
  shareWithCircles: false,
  shareAnonymous: true,
  notifFrequency: 'daily',
  invisibleMode: false,
  aiPersonality: 'empatica',
};

interface AutonomySettingsProps {
  visible: boolean;
  onClose: () => void;
}

export default function AutonomySettings({ visible, onClose }: AutonomySettingsProps) {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const colors = currentColors;

  const [settings, setSettings] = useState<AutonomySettings>(DEFAULT_SETTINGS);
  const [showAIPersonality, setShowAIPersonality] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(AUTONOMY_STORAGE_KEY);
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch {}
  };

  const saveSettings = useCallback(async (newSettings: AutonomySettings) => {
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(AUTONOMY_STORAGE_KEY, JSON.stringify(newSettings));
    } catch {}
  }, []);

  const toggleShare = (key: keyof Pick<AutonomySettings, 'shareCycle' | 'shareMood' | 'shareSymptoms' | 'shareEnergy'>) => {
    saveSettings({ ...settings, [key]: !settings[key] });
  };

  const toggleWho = (key: keyof Pick<AutonomySettings, 'shareWithAI' | 'shareWithCircles' | 'shareAnonymous'>) => {
    saveSettings({ ...settings, [key]: !settings[key] });
  };

  const setFrequency = (freq: 'daily' | 'weekly' | 'never') => {
    saveSettings({ ...settings, notifFrequency: freq });
  };

  const toggleInvisible = () => {
    saveSettings({ ...settings, invisibleMode: !settings.invisibleMode });
  };

  const selectPersonality = (id: AIPersonality) => {
    saveSettings({ ...settings, aiPersonality: id });
    setShowAIPersonality(false);
  };

  const handleDeleteData = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await AsyncStorage.removeItem(AUTONOMY_STORAGE_KEY);
      setSettings(DEFAULT_SETTINGS);
      setShowDeleteConfirm(false);
      Alert.alert(t('common_success'), 'Datos eliminados');
    } catch {}
  };

  const handleExport = () => {
    Alert.alert(t('autonomy_export'), 'Función próximamente disponible');
  };

  const frequencyOptions: { value: 'daily' | 'weekly' | 'never'; labelEs: string; labelEn: string }[] = [
    { value: 'daily', labelEs: 'Diario', labelEn: 'Daily' },
    { value: 'weekly', labelEs: 'Semanal', labelEn: 'Weekly' },
    { value: 'never', labelEs: 'Nunca', labelEn: 'Never' },
  ];

  const currentPersonality = AI_PERSONALITIES.find(p => p.id === settings.aiPersonality);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="lock-closed" size={20} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t('autonomy_title')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.subtleText} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* What to share */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Qué compartir</Text>

              {[
                { key: 'shareCycle' as const, label: 'Ciclo' },
                { key: 'shareMood' as const, label: 'Humor' },
                { key: 'shareSymptoms' as const, label: 'Síntomas' },
                { key: 'shareEnergy' as const, label: 'Energía' },
              ].map((item) => (
                <View key={item.key} style={[styles.row, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
                  <Switch
                    value={settings[item.key]}
                    onValueChange={() => toggleShare(item.key)}
                    trackColor={{ false: colors.border, true: colors.primary + '40' }}
                    thumbColor={settings[item.key] ? colors.primary : colors.subtleText}
                  />
                </View>
              ))}
            </View>

            {/* Who to share with */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Con quién</Text>

              {[
                { key: 'shareWithAI' as const, label: 'Solo IA' },
                { key: 'shareWithCircles' as const, label: 'Círculos' },
                { key: 'shareAnonymous' as const, label: 'Anónimo' },
              ].map((item) => (
                <View key={item.key} style={[styles.row, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
                  <Switch
                    value={settings[item.key]}
                    onValueChange={() => toggleWho(item.key)}
                    trackColor={{ false: colors.border, true: colors.primary + '40' }}
                    thumbColor={settings[item.key] ? colors.primary : colors.subtleText}
                  />
                </View>
              ))}
            </View>

            {/* Notification frequency */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Frecuencia</Text>
              <View style={styles.frequencyRow}>
                {frequencyOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.frequencyOption,
                      {
                        backgroundColor: settings.notifFrequency === opt.value ? colors.primary : colors.white,
                        borderColor: settings.notifFrequency === opt.value ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setFrequency(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.frequencyText,
                        { color: settings.notifFrequency === opt.value ? colors.white : colors.text },
                      ]}
                    >
                      {opt.labelEs}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Invisible mode */}
            <View style={styles.section}>
              <View style={[styles.row, { borderBottomColor: 'transparent' }]}>
                <View style={styles.invisibleInfo}>
                  <Ionicons name="eye-off" size={20} color={colors.subtleText} />
                  <View>
                    <Text style={[styles.rowLabel, { color: colors.text }]}>{t('autonomy_invisible')}</Text>
                    <Text style={[styles.rowSublabel, { color: colors.subtleText }]}>
                      Oculta de rankings, anónima en círculos
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.invisibleMode}
                  onValueChange={toggleInvisible}
                  trackColor={{ false: colors.border, true: colors.primary + '40' }}
                  thumbColor={settings.invisibleMode ? colors.primary : colors.subtleText}
                />
              </View>
            </View>

            {/* AI Personality */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('autonomy_ai_personality')}</Text>
              <TouchableOpacity
                style={[styles.personalityRow, { backgroundColor: colors.white, borderColor: colors.border }]}
                onPress={() => setShowAIPersonality(true)}
                activeOpacity={0.7}
              >
                <View style={styles.personalityLeft}>
                  <Ionicons name={currentPersonality?.icon as any || 'person'} size={20} color={colors.primary} />
                  <Text style={[styles.personalityLabel, { color: colors.text }]}>
                    {currentPersonality?.labelEs || 'Laura empática'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.subtleText} />
              </TouchableOpacity>
            </View>

            {/* Data management */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('autonomy_data')}</Text>

              <TouchableOpacity
                style={[styles.dataButton, { backgroundColor: colors.white, borderColor: colors.border }]}
                onPress={handleExport}
                activeOpacity={0.7}
              >
                <Ionicons name="download" size={20} color={colors.primary} />
                <Text style={[styles.dataButtonText, { color: colors.text }]}>
                  {t('autonomy_export')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dataButton, { backgroundColor: '#FEE2E2', borderColor: colors.error }]}
                onPress={handleDeleteData}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={20} color={colors.error} />
                <Text style={[styles.dataButtonText, { color: colors.error }]}>
                  {t('autonomy_delete')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* AI Personality Modal */}
          <Modal visible={showAIPersonality} transparent animationType="fade" onRequestClose={() => setShowAIPersonality(false)}>
            <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
              <View style={[styles.personalityModal, { backgroundColor: colors.white }]}>
                <Text style={[styles.personalityModalTitle, { color: colors.text }]}>
                  {t('autonomy_ai_personality')}
                </Text>
                {AI_PERSONALITIES.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.personalityOption,
                      {
                        backgroundColor: settings.aiPersonality === p.id ? colors.primary + '15' : 'transparent',
                        borderColor: settings.aiPersonality === p.id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => selectPersonality(p.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={p.icon as any} size={22} color={colors.primary} />
                    <Text style={[styles.personalityOptionLabel, { color: colors.text }]}>
                      {p.labelEs}
                    </Text>
                    {settings.aiPersonality === p.id && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.personalityCloseBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setShowAIPersonality(false)}
                >
                  <Text style={[styles.personalityCloseText, { color: colors.white }]}>
                    {t('common_close')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
            <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
              <View style={[styles.deleteModal, { backgroundColor: colors.white }]}>
                <Ionicons name="warning" size={40} color={colors.error} />
                <Text style={[styles.deleteTitle, { color: colors.text }]}>
                  {t('autonomy_delete')}
                </Text>
                <Text style={[styles.deleteDesc, { color: colors.subtleText }]}>
                  Esta acción eliminará todos tus datos de autonomía. No se puede deshacer.
                </Text>
                <View style={styles.deleteButtons}>
                  <TouchableOpacity
                    style={[styles.deleteCancelBtn, { backgroundColor: colors.border }]}
                    onPress={() => setShowDeleteConfirm(false)}
                  >
                    <Text style={[styles.deleteCancelText, { color: colors.text }]}>
                      {t('common_cancel')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteConfirmBtn, { backgroundColor: colors.error }]}
                    onPress={confirmDelete}
                  >
                    <Text style={[styles.deleteConfirmText, { color: colors.white }]}>
                      {t('autonomy_delete')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
  },
  rowLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  rowSublabel: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  frequencyText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  invisibleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  personalityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  personalityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  personalityLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  dataButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
  personalityModal: {
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  personalityModalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  personalityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  personalityOptionLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  personalityCloseBtn: {
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  personalityCloseText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  deleteModal: {
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  deleteTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  deleteDesc: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  deleteButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  deleteCancelText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  deleteConfirmText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
