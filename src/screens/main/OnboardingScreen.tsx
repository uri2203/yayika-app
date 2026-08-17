import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiOnboarding } from '../../config/api';

const TOTAL_STEPS = 4;

const GOALS = ['financial', 'cycle', 'wellness', 'growth'] as const;
const CYCLE_PHASES = ['menstrual', 'follicular', 'ovulation', 'luteal'] as const;
const INCOME_RANGES = ['range_1', 'range_2', 'range_3', 'range_4'] as const;
const FINANCE_GOALS = ['save', 'invert', 'deuda', 'negociar'] as const;

const PHASE_COLORS: Record<string, string> = {
  menstrual: '#EDE7F6',
  follicular: '#FCE4EC',
  ovulation: '#FFF9C4',
  luteal: '#FFF3E0',
};

const PHASE_ICONS: Record<string, string> = {
  menstrual: '🌙',
  follicular: '🌸',
  ovulation: '☀️',
  luteal: '🍂',
};

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [selectedIncome, setSelectedIncome] = useState<string>('');
  const [selectedFinanceGoals, setSelectedFinanceGoals] = useState<string[]>([]);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  };

  const toggleFinanceGoal = (goal: string) => {
    setSelectedFinanceGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return selectedGoals.length > 0;
      case 2:
        return selectedPhase !== '';
      case 3:
        return selectedIncome !== '';
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      await aiOnboarding({
        lang,
        goals: selectedGoals,
        cycle_phase: selectedPhase,
        income_range: selectedIncome,
        notifications: { push: pushEnabled, email: emailEnabled },
      });
      navigation.navigate('Home');
    } catch (err) {
      Alert.alert(t('common_error'), t('onboard_error'));
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>
      <Text style={styles.stepLabel}>
        {t('onboard_step')} {step}/{TOTAL_STEPS}
      </Text>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>🎯</Text>
      <Text style={styles.stepTitle}>{t('onboard_goals_title')}</Text>
      <Text style={styles.stepSubtitle}>{t('onboard_goals_subtitle')}</Text>
      {GOALS.map((goal) => {
        const selected = selectedGoals.includes(goal);
        return (
          <TouchableOpacity
            key={goal}
            style={[styles.optionCard, selected && styles.optionCardSelected]}
            onPress={() => toggleGoal(goal)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
              {selected && <Ionicons name="checkmark" size={16} color={colors.white} />}
            </View>
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
              {t(`onboard_goals_${goal}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>🌙</Text>
      <Text style={styles.stepTitle}>{t('onboard_cycle_title')}</Text>
      <Text style={styles.stepSubtitle}>{t('onboard_cycle_subtitle')}</Text>
      <View style={styles.phaseGrid}>
        {CYCLE_PHASES.map((phase) => {
          const selected = selectedPhase === phase;
          return (
            <TouchableOpacity
              key={phase}
              style={[
                styles.phaseOption,
                { backgroundColor: PHASE_COLORS[phase] },
                selected && styles.phaseOptionSelected,
              ]}
              onPress={() => setSelectedPhase(phase)}
              activeOpacity={0.7}
            >
              <Text style={styles.phaseEmoji}>{PHASE_ICONS[phase]}</Text>
              <Text style={[styles.phaseLabel, selected && styles.phaseLabelSelected]}>
                {t(`onboard_cycle_${phase}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>💰</Text>
      <Text style={styles.stepTitle}>{t('onboard_finance_title')}</Text>
      <Text style={styles.stepSubtitle}>{t('onboard_finance_subtitle')}</Text>
      {INCOME_RANGES.map((range) => {
        const selected = selectedIncome === range;
        return (
          <TouchableOpacity
            key={range}
            style={[styles.optionCard, selected && styles.optionCardSelected]}
            onPress={() => setSelectedIncome(range)}
            activeOpacity={0.7}
          >
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected && <View style={styles.radioDot} />}
            </View>
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
              {t(`onboard_finance_${range}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
      <Text style={[styles.stepSubtitle, { marginTop: spacing.lg }]}>
        {t('onboard_finance_goals')}
      </Text>
      {FINANCE_GOALS.map((goal) => {
        const selected = selectedFinanceGoals.includes(goal);
        return (
          <TouchableOpacity
            key={goal}
            style={[styles.optionCard, selected && styles.optionCardSelected]}
            onPress={() => toggleFinanceGoal(goal)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
              {selected && <Ionicons name="checkmark" size={16} color={colors.white} />}
            </View>
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
              {t(`onboard_finance_goal_${goal}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepEmoji}>🔔</Text>
      <Text style={styles.stepTitle}>{t('onboard_notif_title')}</Text>
      <Text style={styles.stepSubtitle}>{t('onboard_notif_subtitle')}</Text>

      <View style={styles.notifCard}>
        <View style={styles.notifInfo}>
          <Ionicons name="notifications" size={22} color={colors.primary} />
          <View style={styles.notifTextBlock}>
            <Text style={styles.notifLabel}>{t('onboard_notif_push')}</Text>
            <Text style={styles.notifDesc}>{t('onboard_notif_push_desc')}</Text>
          </View>
        </View>
        <Switch
          value={pushEnabled}
          onValueChange={setPushEnabled}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={pushEnabled ? colors.primary : colors.subtleText}
        />
      </View>

      <View style={styles.notifCard}>
        <View style={styles.notifInfo}>
          <Ionicons name="mail" size={22} color={colors.gold} />
          <View style={styles.notifTextBlock}>
            <Text style={styles.notifLabel}>{t('onboard_notif_email')}</Text>
            <Text style={styles.notifDesc}>{t('onboard_notif_email_desc')}</Text>
          </View>
        </View>
        <Switch
          value={emailEnabled}
          onValueChange={setEmailEnabled}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={emailEnabled ? colors.primary : colors.subtleText}
        />
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  const isLastStep = step === TOTAL_STEPS;

  return (
    <SafeAreaView style={styles.container}>
      {renderProgressBar()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentStep()}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={colors.subtleText} />
            <Text style={styles.backText}>{t('onboard_back')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed() && styles.nextButtonDisabled,
            isLastStep && styles.finishButton,
          ]}
          onPress={handleNext}
          disabled={!canProceed() || loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.nextText}>
                {isLastStep ? t('onboard_finish') : t('onboard_next')}
              </Text>
              {!isLastStep && (
                <Ionicons name="chevron-forward" size={20} color={colors.white} />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
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
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  stepLabel: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    textAlign: 'center',
  },
  stepContent: {
    paddingTop: spacing.lg,
  },
  stepEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  stepTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.subtleText,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0EBF8',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  phaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  phaseOption: {
    width: '48%',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  phaseOptionSelected: {
    borderColor: colors.primary,
  },
  phaseEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  phaseLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
    textAlign: 'center',
  },
  phaseLabelSelected: {
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  notifInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  notifTextBlock: {
    marginLeft: spacing.md,
    flex: 1,
  },
  notifLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  notifDesc: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.subtleText,
    marginLeft: spacing.xs,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginLeft: 'auto',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  finishButton: {
    backgroundColor: colors.turquoise,
  },
  nextText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginRight: spacing.xs,
  },
});
