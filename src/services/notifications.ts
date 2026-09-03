import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  
  // Save token to database
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('push_tokens').upsert(
      {
        user_id: user.id,
        token: token.data,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform' }
    );
  }

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Yayika',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return token.data;
}

export async function unregisterPushNotifications(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('push_tokens').delete().eq('user_id', user.id);
  }
}

export function addNotificationListener(
  onReceive: (notification: Notifications.Notification) => void,
  onTap: (notification: Notifications.Notification) => void
): () => void {
  const receiveSub = Notifications.addNotificationReceivedListener(onReceive);
  const tapSub = Notifications.addNotificationResponseReceivedListener(onTap);
  
  return () => {
    receiveSub.remove();
    tapSub.remove();
  };
}
