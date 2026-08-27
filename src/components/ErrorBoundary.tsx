import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { typography, spacing } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  t?: (key: string, params?: Record<string, string | number>) => string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps & { colors: typeof import('../config/theme').colors },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { colors: typeof import('../config/theme').colors }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  }

  private handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    const t = this.props.t || ((key: string) => key);
    if (this.state.hasError) {
      return (
        <View style={[styles.container, { backgroundColor: this.props.colors.background }]}>
          <Text style={[styles.title, { color: this.props.colors.text }]}>{t('common_something_went_wrong')}</Text>
          <Text style={[styles.message, { color: this.props.colors.subtleText }]}>{this.state.message}</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: this.props.colors.primary }]} onPress={this.handleReset}>
            <Text style={[styles.buttonText, { color: this.props.colors.white }]}>{t('common_try_again')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const colors = currentColors;

  return <ErrorBoundaryClass colors={colors} t={t}>{children}</ErrorBoundaryClass>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});