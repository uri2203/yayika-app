import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationsContextType {
  expoPushToken: string | null;
  hasPermission: boolean;
}

const NotificationsContext = createContext<NotificationsContextType>({
  expoPushToken: null,
  hasPermission: false,
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        setHasPermission(true);
        saveTokenToSupabase(token);
      }
    });

    const notificationListener = Notifications.addNotificationReceivedListener(() => {});
    const responseListener = Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [user]);

  async function saveTokenToSupabase(token: string) {
    if (!user) return;
    await supabase.from('push_tokens').upsert(
      { user_id: user.id, expo_push_token: token, platform: Platform.OS },
      { onConflict: 'user_id' }
    );
  }

  async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Yayika',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) throw new Error('Project ID not found');
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      return token;
    } catch (e) {
      return null;
    }
  }

  return (
    <NotificationsContext.Provider value={{ expoPushToken, hasPermission }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
