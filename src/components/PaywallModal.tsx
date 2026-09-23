import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../hooks/useSubscription';

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
  const { plan, loading: planLoading, isPremium } = useSubscription();
  const colors = currentColors;
  const planKey = plan.toLowerCase();
  const requiredKey = requiredPlan.toLowerCase();
  const alreadyOwned = isPremium && (planKey === requiredKey || planKey === 'diamante');

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.iconContainer, { backgroundColor: colors.rose + '15' }]}>
            <Ionicons name="lock-closed" size={32} color={colors.rose} />
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>
            {t('paywall_title')}
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('paywall_subtitle', { feature: featureName, plan: requiredPlan })}
          </Text>

          <View style={styles.features}>
            <FeatureRow icon="checkmark-circle" text={t('paywall_feature_1')} color={colors.rose} textColor={colors.text} />
            <FeatureRow icon="checkmark-circle" text={t('paywall_feature_2')} color={colors.rose} textColor={colors.text} />
            <FeatureRow icon="checkmark-circle" text={t('paywall_feature_3')} color={colors.rose} textColor={colors.text} />
            <FeatureRow icon="checkmark-circle" text={t('paywall_feature_4')} color={colors.rose} textColor={colors.text} />
          </View>

          {alreadyOwned ? (
            <View style={[styles.upgradeBtn, { backgroundColor: colors.success }]}>
              <Text style={[styles.upgradeBtnText, { color: colors.white }]}>
                {t('paywall_feature_1')}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: colors.rose, opacity: planLoading ? 0.6 : 1 }]}
              onPress={onUpgrade}
              disabled={planLoading}
            >
              <Text style={[styles.upgradeBtnText, { color: colors.white }]}>
                {t('paywall_upgrade', { plan: requiredPlan })}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.laterBtn} onPress={onClose}>
            <Text style={[styles.laterBtnText, { color: colors.textSecondary }]}>
              {t('paywall_later')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function FeatureRow({ icon, text, color, textColor }: { icon: string; text: string; color: string; textColor: string }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={[styles.featureText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, borderWidth: 1 },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  iconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  features: { marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  featureText: { fontSize: 14, flex: 1 },
  upgradeBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  upgradeBtnText: { fontSize: 16, fontWeight: '600' },
  laterBtn: { alignItems: 'center', padding: 8 },
  laterBtnText: { fontSize: 14 },
});
