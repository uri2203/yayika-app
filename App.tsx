import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, AppState, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { NotificationsProvider } from './src/contexts/NotificationsContext';
import Navigation from './src/navigation';
import LoadingSpinner from './src/components/LoadingSpinner';
import ErrorBoundary from './src/components/ErrorBoundary';
import { colors } from './src/config/theme';

const hideNavBar = async () => {
  if (Platform.OS !== 'android') return;
  try {
    await NavigationBar.setVisibilityAsync('hidden');
  } catch (e) {
    console.warn('NavigationBar hide error:', e);
  }
};

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    setTimeout(() => setAppReady(true), 500);
  }, []);

  useEffect(() => {
    hideNavBar();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') hideNavBar();
    });
    return () => sub.remove();
  }, []);

  if (!appReady) {
    return (
      <View style={styles.splash}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <NotificationsProvider>
              <Navigation />
              <StatusBar style="auto" />
            </NotificationsProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.primary,
  },
});
