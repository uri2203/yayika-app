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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { typography, spacing, borderRadius } from '../../config/theme';
import Button from '../../components/Button';
const logoImg = require('../../../assets/Logo yayika.png');

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const { currentColors } = useTheme();
  const colors = currentColors;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      justifyContent: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    logoImage: {
      width: 100,
      height: 100,
      marginBottom: spacing.md,
    },
    logo: {
      fontSize: 40,
      fontWeight: typography.weights.bold,
      color: colors.primary,
    },
    subtitle: {
      fontSize: typography.sizes.md,
      color: colors.subtleText,
      marginTop: spacing.xs,
    },
    form: {
      marginBottom: spacing.xl,
    },
    label: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    input: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: typography.sizes.md,
      color: colors.text,
      marginBottom: spacing.md,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      marginBottom: spacing.lg,
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: typography.sizes.md,
      color: colors.text,
    },
    eyeIcon: {
      paddingHorizontal: spacing.md,
    },
    loginButton: {
      marginBottom: spacing.md,
    },
    forgotButton: {
      alignItems: 'center',
    },
    forgotText: {
      color: colors.primary,
      fontSize: typography.sizes.sm,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerText: {
      color: colors.subtleText,
      fontSize: typography.sizes.md,
    },
    footerLink: {
      color: colors.primary,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
    },
  });

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common_error'), t('auth_fill_email_password'));
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) Alert.alert(t('common_error'), String(error));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image source={logoImg} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.logo}>Yayika</Text>
            <Text style={styles.subtitle}>{t('auth_tagline')}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>{t('auth_email')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth_email_placeholder')}
              placeholderTextColor={colors.subtleText}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

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
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={colors.subtleText}
                />
              </TouchableOpacity>
            </View>

            <Button
              title={t('auth_login')}
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>{t('auth_forgot')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth_no_account')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>{t('auth_register_link')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
