import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import Card from '../../components/Card';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const userName = user?.user_metadata?.name || 'Guerrera';
  const userEmail = user?.email || '';

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Estás segura?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', onPress: signOut, style: 'destructive' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Configuración</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="moon-outline" size={22} color={colors.primary} />
              <Text style={styles.menuText}>Modo oscuro</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="language-outline" size={22} color={colors.primary} />
              <Text style={styles.menuText}>Idioma</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuValue}>Español</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
            </View>
          </TouchableOpacity>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Soporte</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
              <Text style={styles.menuText}>Centro de ayuda</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="document-text-outline" size={22} color={colors.primary} />
              <Text style={styles.menuText}>Términos y condiciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="shield-outline" size={22} color={colors.primary} />
              <Text style={styles.menuText}>Política de privacidad</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
          </TouchableOpacity>
        </Card>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Yayika v1.0.0</Text>
      </ScrollView>
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  userName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  userEmail: {
    fontSize: typography.sizes.md,
    color: colors.subtleText,
    marginTop: spacing.xs,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.subtleText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    marginLeft: spacing.md,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    fontSize: typography.sizes.md,
    color: colors.subtleText,
    marginRight: spacing.xs,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius.md,
  },
  signOutText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.error,
    marginLeft: spacing.sm,
  },
  version: {
    textAlign: 'center',
    color: colors.subtleText,
    fontSize: typography.sizes.xs,
    marginTop: spacing.lg,
  },
});
