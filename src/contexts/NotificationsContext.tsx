import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { aiSmartPush } from '../config/api';

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
  sendSmartPush: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
  expoPushToken: null,
  hasPermission: false,
  sendSmartPush: async () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const { user, progress } = useAuth();
  const { lang } = useLanguage();

  const sendSmartPush = useCallback(async () => {
    if (!user) return;
    try {
      const res = await aiSmartPush({
        user_id: user.id,
        streak_days: progress?.streak_days,
        lang,
      });
      if (res.notification) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: res.notification.title,
            body: res.notification.body,
            data: res.notification.data ?? {},
          },
          trigger: null,
        });
      }
    } catch (err) {
      console.warn('Smart push failed:', err);
    }
  }, [user, progress, lang]);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        setHasPermission(true);
        saveTokenToSupabase(token);
        sendSmartPush();
      }
    });

    const notificationListener = Notifications.addNotificationReceivedListener(() => {});
    const responseListener = Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [user, sendSmartPush]);

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
    <NotificationsContext.Provider value={{ expoPushToken, hasPermission, sendSmartPush }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
