import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';

const CYCLE_LENGTH = 28;

const PHASES = [
  {
    name: 'Menstrual',
    range: [1, 5],
    icon: '🌙',
    color: colors.primary,
    bgColor: '#EDE7F6',
    description: 'Descanso y reflexión',
    tip: 'Escucha a tu cuerpo. Es momento de descansar, meditar y reconectar contigo misma. Evita esfuerzos excesivos.',
  },
  {
    name: 'Folicular',
    range: [6, 13],
    icon: '🌸',
    color: colors.rose,
    bgColor: '#FCE4EC',
    description: 'Creatividad alta',
    tip: 'Tu energía sube. Es el momento ideal para iniciar proyectos, planear y ser creativa. Aprovecha esta ola.',
  },
  {
    name: 'Ovulatoria',
    range: [14, 17],
    icon: '☀️',
    color: colors.gold,
    bgColor: '#FFF9C4',
    description: 'Energía máxima',
    tip: 'Punto máximo de energía y confianza. Ideal para reuniones importantes, negociar y socializar.',
  },
  {
    name: 'Lútea',
    range: [18, 28],
    icon: '🍂',
    color: '#F57C00',
    bgColor: '#FFF3E0',
    description: 'Enfoque en detalles',
    tip: 'Organiza, revisa detalles y cierra pendientes. Cuida tu alimentación y establece rutinas reconfortantes.',
  },
];

const SYMPTOMS = [
  'Dolor',
  'Energía baja',
  'Buen ánimo',
  'Insomnio',
  'Hinchazón',
  'Ansiedad',
  'Concentración alta',
  'Cansancio',
];

function getCurrentPhase(day: number) {
  return PHASES.find((p) => day >= p.range[0] && day <= p.range[1]) || PHASES[0];
}

export default function CycleTrackerScreen({ navigation }: any) {
  const [currentDay] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const phase = getCurrentPhase(currentDay);
  const progress = currentDay / CYCLE_LENGTH;

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Rastreador de Ciclo</Text>
          <Text style={styles.subtitle}>Conoce tu cuerpo cada día</Text>
        </View>

        {/* Day Counter */}
        <View style={styles.dayCard}>
          <Text style={styles.dayLabel}>Día del ciclo</Text>
          <Text style={styles.dayNumber}>{currentDay}</Text>
          <Text style={styles.dayTotal}>de {CYCLE_LENGTH} días</Text>
        </View>

        {/* Phase Badge */}
        <View style={[styles.phaseBadge, { backgroundColor: phase.bgColor }]}>
          <Text style={styles.phaseIcon}>{phase.icon}</Text>
          <View style={styles.phaseInfo}>
            <Text style={[styles.phaseName, { color: phase.color }]}>{phase.name}</Text>
            <Text style={styles.phaseDescription}>{phase.description}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: phase.color }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressStart}>Día 1</Text>
            <Text style={styles.progressEnd}>Día {CYCLE_LENGTH}</Text>
          </View>
        </View>

        {/* Phase Cards */}
        <Text style={styles.sectionTitle}>Fases del ciclo</Text>
        {PHASES.map((p) => {
          const isActive = p.name === phase.name;
          return (
            <View
              key={p.name}
              style={[
                styles.phaseCard,
                isActive && { borderColor: p.color, borderWidth: 2 },
              ]}
            >
              <View style={[styles.phaseCardIcon, { backgroundColor: p.bgColor }]}>
                <Text style={styles.phaseCardEmoji}>{p.icon}</Text>
              </View>
              <View style={styles.phaseCardContent}>
                <Text style={[styles.phaseCardName, { color: p.color }]}>
                  {p.name} (Días {p.range[0]}-{p.range[1]})
                </Text>
                <Text style={styles.phaseCardDesc}>{p.description}</Text>
              </View>
              {isActive && (
                <View style={[styles.activeDot, { backgroundColor: p.color }]} />
              )}
            </View>
          );
        })}

        {/* Current Phase Tip */}
        <View style={[styles.tipCard, { borderLeftColor: phase.color }]}>
          <Text style={styles.tipTitle}>Consejo para tu fase {phase.name}</Text>
          <Text style={styles.tipText}>{phase.tip}</Text>
        </View>

        {/* Register Symptoms Button */}
        <TouchableOpacity
          style={styles.symptomsButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="medical" size={20} color={colors.white} />
          <Text style={styles.symptomsButtonText}>Registrar síntomas</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Symptoms Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>¿Cómo te sientes hoy?</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Selecciona los síntomas que presentas</Text>
            <View style={styles.symptomsGrid}>
              {SYMPTOMS.map((s) => {
                const selected = selectedSymptoms.includes(s);
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.symptomChip, selected && styles.symptomChipSelected]}
                    onPress={() => toggleSymptom(s)}
                  >
                    <Text style={[styles.symptomText, selected && styles.symptomTextSelected]}>
                      {selected ? '✓ ' : ''}{s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalSaveText}>Guardar registro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  header: {
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.subtleText,
    marginTop: spacing.xs,
  },
  dayCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayLabel: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  dayNumber: {
    fontSize: 64,
    fontWeight: typography.weights.bold,
    color: colors.white,
    lineHeight: 72,
  },
  dayTotal: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.xs,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  phaseIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  phaseInfo: {
    flex: 1,
  },
  phaseName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  phaseDescription: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStart: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
  },
  progressEnd: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  phaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  phaseCardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  phaseCardEmoji: {
    fontSize: 24,
  },
  phaseCardContent: {
    flex: 1,
  },
  phaseCardName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  phaseCardDesc: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    marginTop: 2,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: spacing.sm,
  },
  tipCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tipTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    lineHeight: 20,
  },
  symptomsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  symptomsButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    marginBottom: spacing.lg,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  symptomChip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  symptomChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  symptomText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  symptomTextSelected: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  modalSaveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalSaveText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
