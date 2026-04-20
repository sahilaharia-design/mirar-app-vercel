import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

/**
 * Requests push notification permission and stores the Expo push token
 * in the push_tokens table. Fire-and-forget — never blocks auth flow.
 *
 * Requires a real device (not simulator) and, for production builds,
 * an EAS projectId in app.json under expo.extra.eas.projectId.
 */
export async function registerPushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;

    if (existing !== 'granted') {
      const { status: requested } = await Notifications.requestPermissionsAsync();
      status = requested;
    }

    if (status !== 'granted') return; // user declined — silent fail

    // projectId required for Expo push service in production builds
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      undefined;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    const platform = Platform.OS as 'ios' | 'android';

    await supabase
      .from('push_tokens')
      .upsert({ user_id: userId, token, platform }, { onConflict: 'user_id,token' });
  } catch (err) {
    // Non-fatal — push notifications are optional
    console.warn('[Mirar] Push token registration failed:', err);
  }
}
