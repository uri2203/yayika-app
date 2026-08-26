import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
}

export default function EmptyState({ icon, message }: EmptyStateProps) {
  const { currentColors } = useTheme();
  const colors = currentColors;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xxl,
    },
    message: {
      marginTop: spacing.md,
      fontSize: typography.sizes.md,
      color: colors.subtleText,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={56} color={colors.subtleText} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}
