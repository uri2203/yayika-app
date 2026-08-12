import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import Navigation from './src/navigation';
import LoadingSpinner from './src/components/LoadingSpinner';
import { colors } from './src/config/theme';

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    setTimeout(() => setAppReady(true), 500);
  }, []);

  if (!appReady) {
    return (
      <View style={styles.splash}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Navigation />
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.primary,
  },
});
