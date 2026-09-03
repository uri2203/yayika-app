import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import Card from '../../components/Card';

interface InsurancePlan {
  id: string;
  days: number;
  priceCents: number;
  title: string;
  isShield?: boolean;
}

interface Inventory {
  freeze_days: number;
  shields: number;
}

export default function StreakInsuranceScreen({ navigation }: any) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { currentColors } = useTheme();
  const colors = currentColors;
  
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [inventory, setInventory] = useState<Inventory>({ freeze_days: 0, shields: 0 });
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load plans
      const { data: plansData } = await supabase.functions.invoke('streak-insurance', {
        body: { action: 'get_plans' },
      });
      if (plansData?.plans) setPlans(plansData.plans);

      // Load inventory
      const { data: invData } = await supabase.functions.invoke('streak-insurance', {
        body: { action: 'get_inventory', user_id: user?.id },
      });
      if (invData?.inventory) setInventory(invData.inventory);
    } catch (error) {
      console.error('Error loading insurance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const purchasePlan = async (planId: string) => {
    setPurchasing(planId);
    try {
      const { data, error } = await supabase.functions.invoke('streak-insurance', {
        body: { action: 'purchase', user_id: user?.id, plan_id: planId },
      });

      if (error) throw error;

      Alert.alert(
        t('insurance_success_title') || '¡Compra exitosa!',
        data?.message || 'Se agregó a tu inventario',
        [{ text: 'OK' }]
      );
      
      await loadData(); // Refresh inventory
    } catch (error: any) {
      Alert.alert(
        t('insurance_error_title') || 'Error',
        error.message || 'No se pudo completar la compra',
        [{ text: 'OK' }]
      );
    } finally {
      setPurchasing(null);
    }
  };

  const confirmPurchase = (plan: InsurancePlan) => {
    const price = (plan.priceCents / 100).toFixed(2);
    Alert.alert(
      t('insurance_confirm_title') || '¿Comprar?',
      `${plan.title}\n$${price} USD`,
      [
        { text: t('common_cancel') || 'Cancelar', style: 'cancel' },
        { text: t('common_buy') || 'Comprar', onPress: () => purchasePlan(plan.id) },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('insurance_title') || 'Seguro de Racha'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Inventory */}
      <Card style={styles.inventoryCard}>
        <Text style={[styles.inventoryTitle, { color: colors.text }]}>
          {t('insurance_inventory') || 'Tu Inventario'}
        </Text>
        <View style={styles.inventoryRow}>
          <View style={styles.inventoryItem}>
            <Text style={styles.inventoryIcon}>❄️</Text>
            <Text style={[styles.inventoryCount, { color: colors.text }]}>{inventory.freeze_days}</Text>
            <Text style={[styles.inventoryLabel, { color: colors.textSecondary }]}>
              {t('insurance_freeze') || 'Pausas'}
            </Text>
          </View>
          <View style={styles.inventoryItem}>
            <Text style={styles.inventoryIcon}>🛡️</Text>
            <Text style={[styles.inventoryCount, { color: colors.text }]}>{inventory.shields}</Text>
            <Text style={[styles.inventoryLabel, { color: colors.textSecondary }]}>
              {t('insurance_shields') || 'Escudos'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Plans */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t('insurance_plans') || 'Planes Disponibles'}
      </Text>
      
      {plans.map((plan) => (
        <Card key={plan.id} style={styles.planCard}>
          <View style={styles.planContent}>
            <View style={styles.planInfo}>
              <Text style={[styles.planTitle, { color: colors.text }]}>
                {plan.isShield ? '🛡️' : '❄️'} {plan.title}
              </Text>
              <Text style={[styles.planDesc, { color: colors.textSecondary }]}>
                {plan.isShield
                  ? (t('insurance_shield_desc') || 'Protege tu racha automáticamente')
                  : (t('insurance_freeze_desc') || `${plan.days} día(s) de pausa`)}
              </Text>
            </View>
            <View style={styles.planRight}>
              <Text style={[styles.planPrice, { color: colors.primary }]}>
                ${(plan.priceCents / 100).toFixed(2)}
              </Text>
              <TouchableOpacity
                style={[styles.buyButton, { backgroundColor: colors.primary }]}
                onPress={() => confirmPurchase(plan)}
                disabled={purchasing === plan.id}
              >
                {purchasing === plan.id ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.buyButtonText}>
                    {t('common_buy') || 'Comprar'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      ))}

      {/* Info */}
      <Card style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          {t('insurance_info') || 'Las pausas se usan automáticamente cuando pierdes un día de racha. Los escudos protegen tu racha actual.'}
        </Text>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  inventoryCard: { marginHorizontal: 16, marginBottom: 16 },
  inventoryTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  inventoryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  inventoryItem: { alignItems: 'center', gap: 4 },
  inventoryIcon: { fontSize: 28 },
  inventoryCount: { fontSize: 24, fontWeight: '700' },
  inventoryLabel: { fontSize: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginHorizontal: 16, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  planCard: { marginHorizontal: 16, marginBottom: 12 },
  planContent: { flexDirection: 'row', alignItems: 'center' },
  planInfo: { flex: 1 },
  planTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  planDesc: { fontSize: 12 },
  planRight: { alignItems: 'flex-end', gap: 8 },
  planPrice: { fontSize: 18, fontWeight: '700' },
  buyButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  buyButtonText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: 16, marginTop: 8, gap: 8 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
