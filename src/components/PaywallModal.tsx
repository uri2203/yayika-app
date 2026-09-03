import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  featureName: string;
  requiredPlan?: string;
}

export default function PaywallModal({ visible, onClose, onUpgrade, featureName, requiredPlan = 'Guerrera' }: PaywallModalProps) {
  const { t } = useLanguage();
  const { currentColors } = useTheme();
  const colors = currentColors;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.iconContainer, { backgroundColor: colors.rosa + '15' }]}>
            <Ionicons name="lock-closed" size={32} color={colors.rosa} />
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>
            {t('paywall_title') || 'Contenido Premium'}
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('paywall_subtitle')?.replace('{feature}', featureName) || 
             `"${featureName}" requiere un plan ${requiredPlan}.`}
          </Text>

          <View style={styles.features}>
            <FeatureRow icon="checkmark-circle" text={t('paywall_feature_1') || 'Acceso a todo el contenido'} color={colors.rosa} />
            <FeatureRow icon="checkmark-circle" text={t('paywall_feature_2') || 'Retos semanales exclusivos'} color={colors.rosa} />
            <FeatureRow icon="checkmark-circle" text={t('paywall_feature_3') || 'Círculos ilimitados'} color={colors.rosa} />
            <FeatureRow icon="checkmark-circle" text={t('paywall_feature_4') || 'Coaching con IA avanzado'} color={colors.rosa} />
          </View>

          <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: colors.rosa }]} onPress={onUpgrade}>
            <Text style={styles.upgradeBtnText}>
              {t('paywall_upgrade') || `Upgrade a ${requiredPlan}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterBtn} onPress={onClose}>
            <Text style={[styles.laterBtnText, { color: colors.textSecondary }]}>
              {t('paywall_later') || 'Quizás después'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function FeatureRow({ icon, text, color }: { icon: string; text: string; color: string }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, borderWidth: 1 },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  iconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  features: { marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  featureText: { fontSize: 14, color: '#333', flex: 1 },
  upgradeBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  upgradeBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  laterBtn: { alignItems: 'center', padding: 8 },
  laterBtnText: { fontSize: 14 },
});
