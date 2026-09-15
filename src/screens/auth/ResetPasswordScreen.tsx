import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { typography, spacing, borderRadius } from '../../config/theme';
import Button from '../../components/Button';

export default function ResetPasswordScreen({ navigation }: any) {
  const { t } = useLanguage();
  const { currentColors } = useTheme();
  const colors = currentColors;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setReady(true);
      }
    });
  }, []);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert(t('common_error'), t('auth_password_min_length'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common_error'), t('auth_passwords_dont_match'));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      Alert.alert(t('common_error'), error.message);
    } else {
      Alert.alert(t('auth_reset_success'), t('auth_reset_success'), [
        { text: t('auth_reset_go_login'), onPress: () => navigation.navigate('Login') },
      ]);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg },
    backButton: { marginTop: spacing.sm, marginBottom: spacing.md, width: 40 },
    header: { alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.lg },
    title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text, marginTop: spacing.md, textAlign: 'center' },
    subtitle: { fontSize: typography.sizes.md, color: colors.subtleText, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22 },
    form: { marginBottom: spacing.xl },
    label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.text, marginBottom: spacing.xs },
    passwordContainer: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
      borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, marginBottom: spacing.md,
    },
    passwordInput: { flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: typography.sizes.md, color: colors.text },
    eyeIcon: { paddingHorizontal: spacing.md },
    inputError: { borderColor: '#EF4444' },
    errorText: { color: '#EF4444', fontSize: typography.sizes.xs, marginTop: -spacing.sm, marginBottom: spacing.md },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Ionicons name="lock-closed-outline" size={56} color={colors.primary} />
            <Text style={styles.title}>{t('auth_reset_new_password_title')}</Text>
            <Text style={styles.subtitle}>{t('auth_reset_new_password_desc')}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>{t('auth_new_password')}</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={colors.subtleText}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.subtleText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>{t('auth_confirm_password')}</Text>
            <View style={[styles.passwordContainer, confirmPassword && newPassword !== confirmPassword && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={colors.subtleText}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
            {confirmPassword && newPassword !== confirmPassword && (
              <Text style={styles.errorText}>{t('auth_passwords_dont_match')}</Text>
            )}

            <Button
              title={t('auth_reset_new_password_title')}
              onPress={handleUpdatePassword}
              loading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
