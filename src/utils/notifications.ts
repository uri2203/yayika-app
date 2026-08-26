import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '../config/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Yayika',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      console.warn('EAS projectId not found in app config');
      return null;
    }
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token;
  } catch (e) {
    console.warn('Failed to get push token:', e);
    return null;
  }
}

export async function registerPushToken(userId: string, token: string): Promise<void> {
  try {
    await supabase.from('push_tokens').upsert(
      { user_id: userId, expo_push_token: token, platform: Platform.OS },
      { onConflict: 'user_id' }
    );
  } catch (e) {
    console.warn('Failed to register push token:', e);
  }
}

export function addNotificationListeners(
  onReceived?: (notification: Notifications.Notification) => void,
  onResponse?: (response: Notifications.NotificationResponse) => void
): { remove: () => void }[] {
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => onReceived?.(notification)
  );
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => onResponse?.(response)
  );
  return [notificationListener, responseListener];
}

export async function setupNotifications(userId: string): Promise<{
  token: string | null;
  listeners: ReturnType<typeof Notifications.addNotificationReceivedListener>[];
}> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return { token: null, listeners: [] };

  const token = await getExpoPushToken();
  if (!token) return { token: null, listeners: [] };

  await registerPushToken(userId, token);

  const notificationListener = Notifications.addNotificationReceivedListener(() => {});
  const responseListener = Notifications.addNotificationResponseReceivedListener(() => {});

  return {
    token,
    listeners: [notificationListener, responseListener],
  };
}
