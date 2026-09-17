import React, { useState } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { typography, spacing, borderRadius } from '../../config/theme';
import Button from '../../components/Button';

const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const getPasswordStrength = (pw: string): { label: string; color: string; width: string } => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: t('auth_strength_weak'), color: '#EF4444', width: '20%' };
  if (score <= 2) return { label: t('auth_strength_fair'), color: '#F59E0B', width: '40%' };
  if (score <= 3) return { label: t('auth_strength_good'), color: '#3B82F6', width: '60%' };
  if (score <= 4) return { label: t('auth_strength_strong'), color: '#10B981', width: '80%' };
  return { label: t('auth_strength_very_strong'), color: '#059669', width: '100%' };
};

export default function RegisterScreen({ navigation }: any) {
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const { currentColors } = useTheme();
  const colors = currentColors;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg },
    backButton: { marginTop: spacing.sm, marginBottom: spacing.md, width: 40 },
    header: { marginBottom: spacing.xl },
    title: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: colors.text },
    subtitle: { fontSize: typography.sizes.md, color: colors.subtleText, marginTop: spacing.xs },
    form: { marginBottom: spacing.xl },
    label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.text, marginBottom: spacing.xs },
    input: {
      backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
      borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
      fontSize: typography.sizes.md, color: colors.text, marginBottom: spacing.md,
    },
    inputError: { borderColor: '#EF4444' },
    errorText: { color: '#EF4444', fontSize: typography.sizes.xs, marginTop: -spacing.sm, marginBottom: spacing.md },
    passwordContainer: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
      borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, marginBottom: spacing.sm,
    },
    passwordInput: { flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: typography.sizes.md, color: colors.text },
    eyeIcon: { paddingHorizontal: spacing.md },
    strengthBar: { height: 4, borderRadius: 2, marginBottom: spacing.xs },
    strengthLabel: { fontSize: typography.sizes.xs, color: colors.subtleText, marginBottom: spacing.md },
    registerButton: { marginBottom: spacing.md },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { color: colors.subtleText, fontSize: typography.sizes.md },
    footerLink: { color: colors.primary, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  });

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert(t('common_error'), t('auth_fill_all_fields'));
      return;
    }
    if (!email.trim() || !validateEmail(email)) {
      Alert.alert(t('common_error'), t('auth_invalid_email'));
      return;
    }
    if (password.length < 8) {
      Alert.alert(t('common_error'), t('auth_password_min_length'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('common_error'), t('auth_passwords_dont_match'));
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim().toLowerCase(), password, name.trim());
    setLoading(false);
    if (error) {
      Alert.alert(t('common_error'), error || t('common_error'));
    } else {
      Alert.alert(t('auth_welcome'), t('auth_account_created'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{t('auth_register')}</Text>
            <Text style={styles.subtitle}>{t('auth_register_subtitle')}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>{t('auth_name')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth_name_placeholder')}
              placeholderTextColor={colors.subtleText}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>{t('auth_email')}</Text>
            <TextInput
              style={[styles.input, email && !validateEmail(email) && styles.inputError]}
              placeholder={t('auth_email_placeholder')}
              placeholderTextColor={colors.subtleText}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {email && !validateEmail(email) && (
              <Text style={styles.errorText}>{t('auth_invalid_email')}</Text>
            )}

            <Text style={styles.label}>{t('auth_password')}</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={colors.subtleText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.subtleText} />
              </TouchableOpacity>
            </View>
            {password.length > 0 && (
              <>
                <View style={[styles.strengthBar, { width: strength.width, backgroundColor: strength.color }]} />
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </>
            )}

            <Text style={styles.label}>{t('auth_confirm_password')}</Text>
            <View style={[styles.passwordContainer, confirmPassword && password !== confirmPassword && { borderColor: '#EF4444' }]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={colors.subtleText}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.subtleText} />
              </TouchableOpacity>
            </View>
            {confirmPassword && password !== confirmPassword && (
              <Text style={styles.errorText}>{t('auth_passwords_dont_match')}</Text>
            )}

            <Button
              title={t('auth_register')}
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth_has_account')} </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.footerLink}>{t('auth_login_link')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
