import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { createCircle } from '../../config/api';

const EMOJIS = ['💜', '🚀', '💪', '💰', '👶', '✨', '🌸', '🔥', '🎯', '📚', '🥗', '🧘', '💼', '🎨', '🌙'];
const CATEGORIES = ['emprendimiento', 'bienestar', 'finanzas', 'general'];

export default function CreateCircleScreen({ navigation }: any) {
  const { currentColors } = useTheme();
  const colors = currentColors;
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('💜');
  const [category, setCategory] = useState('general');
  const [maxMembers, setMaxMembers] = useState('20');
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingTop: spacing.md, marginBottom: spacing.lg,
    },
    backBtn: { padding: spacing.xs },
    title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text },
    section: { marginBottom: spacing.lg },
    label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.text, marginBottom: spacing.xs },
    input: {
      backgroundColor: colors.white, borderRadius: borderRadius.md, paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm, fontSize: typography.sizes.md, color: colors.text,
      borderWidth: 1, borderColor: colors.border,
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    emojiItem: {
      width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
      backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border,
    },
    emojiItemActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    categoryChip: {
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      borderRadius: borderRadius.full, backgroundColor: colors.white,
      borderWidth: 1, borderColor: colors.border,
    },
    categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    categoryText: { fontSize: typography.sizes.sm, color: colors.text },
    categoryTextActive: { color: colors.white },
    toggleRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md,
    },
    toggleLabel: { fontSize: typography.sizes.md, color: colors.text },
    toggle: {
      width: 50, height: 28, borderRadius: 14, padding: 2,
    },
    toggleOn: { backgroundColor: colors.primary, justifyContent: 'flex-end' },
    toggleOff: { backgroundColor: colors.border, justifyContent: 'flex-start' },
    toggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white },
    saveBtn: {
      backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md,
      alignItems: 'center', marginTop: spacing.lg,
    },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.white },
  });

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('', t('circles_name_required') || 'Ingresa un nombre para el círculo');
      return;
    }
    try {
      setSaving(true);
      await createCircle({
        name: name.trim(),
        description: description.trim() || undefined,
        emoji,
        category,
        max_members: parseInt(maxMembers) || 20,
        is_private: isPrivate,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert(t('common_error'), err instanceof Error ? err.message : t('common_unknown_error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('circles_create') || 'Crear Círculo'}</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('circles_name') || 'Nombre'}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('circles_name_placeholder') || 'Ej: Mamás Emprendedoras'}
            placeholderTextColor={colors.subtleText}
            maxLength={50}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('circles_description') || 'Descripción'}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('circles_description_placeholder') || '¿De qué trata este círculo?'}
            placeholderTextColor={colors.subtleText}
            multiline
            maxLength={200}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('circles_emoji') || 'Emoji'}</Text>
          <View style={styles.emojiGrid}>
            {EMOJIS.map(e => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiItem, emoji === e && styles.emojiItemActive]}
                onPress={() => setEmoji(e)}
              >
                <Text style={{ fontSize: 20 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('circles_category') || 'Categoría'}</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                  {t('circles_cat_' + cat) || cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('circles_max_members') || 'Máx. miembros'}</Text>
          <TextInput
            style={styles.input}
            value={maxMembers}
            onChangeText={setMaxMembers}
            keyboardType="numeric"
            placeholder="20"
            placeholderTextColor={colors.subtleText}
          />
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIsPrivate(!isPrivate)}
          >
            <Text style={styles.toggleLabel}>{t('circles_private') || 'Círculo privado'}</Text>
            <View style={[styles.toggle, isPrivate ? styles.toggleOn : styles.toggleOff]}>
              <View style={styles.toggleDot} />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleCreate}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>{t('circles_create_btn') || 'Crear Círculo'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
