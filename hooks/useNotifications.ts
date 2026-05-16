import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { usePremiumFeature } from './usePremiumFeature';
import type { Seed } from '../types/database';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface UseNotificationsResult {
  isEnabled: boolean;
  permissionStatus: Notifications.PermissionStatus | null;
  requestPermission: () => Promise<boolean>;
  schedulePlantingReminder: (seed: Pick<Seed, 'id' | 'seed_name' | 'indoor_sow_date'>, daysBeforeDate: number) => Promise<string | null>;
  scheduleLowStockAlert: (seed: Pick<Seed, 'id' | 'seed_name'>, currentQuantity: number, threshold: number) => Promise<string | null>;
  cancelNotification: (notificationId: string) => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const { checkFeature } = usePremiumFeature();

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setPermissionStatus(status);
      setIsEnabled(status === 'granted');
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!checkFeature('push_notifications')) return false;

    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    setPermissionStatus(status);
    const granted = status === 'granted';
    setIsEnabled(granted);

    if (granted) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('notification_preferences').upsert(
            { user_id: user.id, push_enabled: true },
            { onConflict: 'user_id' }
          );
        }
      } catch {
        // non-fatal — preference sync is best-effort
      }
    }

    return granted;
  }, [checkFeature]);

  const schedulePlantingReminder = useCallback(async (
    seed: Pick<Seed, 'id' | 'seed_name' | 'indoor_sow_date'>,
    daysBeforeDate: number
  ): Promise<string | null> => {
    if (!isEnabled || !checkFeature('push_notifications')) return null;
    if (!seed.indoor_sow_date) return null;

    const sowDate = new Date(seed.indoor_sow_date);
    const triggerDate = new Date(sowDate.getTime() - daysBeforeDate * 24 * 60 * 60 * 1000);
    if (triggerDate <= new Date()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to sow!',
        body: `${seed.seed_name} should be sown in ${daysBeforeDate} day${daysBeforeDate === 1 ? '' : 's'}.`,
        data: { seedId: seed.id, type: 'planting_reminder' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
    return id;
  }, [isEnabled, checkFeature]);

  const scheduleLowStockAlert = useCallback(async (
    seed: Pick<Seed, 'id' | 'seed_name'>,
    currentQuantity: number,
    threshold: number
  ): Promise<string | null> => {
    if (!isEnabled || !checkFeature('low_stock_alerts')) return null;
    if (currentQuantity > threshold) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Low stock',
        body: `${seed.seed_name} is running low (${currentQuantity} remaining).`,
        data: { seedId: seed.id, type: 'low_stock_alert' },
      },
      trigger: null, // immediate
    });
    return id;
  }, [isEnabled, checkFeature]);

  const cancelNotification = useCallback(async (notificationId: string): Promise<void> => {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }, []);

  return {
    isEnabled,
    permissionStatus,
    requestPermission,
    schedulePlantingReminder,
    scheduleLowStockAlert,
    cancelNotification,
  };
}
