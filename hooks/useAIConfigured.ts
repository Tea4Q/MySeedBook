import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AI_STORAGE_KEYS } from '@/config/ai';

async function getAIKey(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

/**
 * Returns whether the user has saved an AI API key in SecureStore.
 * `isConfigured` is `null` while the initial check is in progress.
 */
export function useAIConfigured() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  const recheck = useCallback(async () => {
    const key = await getAIKey(AI_STORAGE_KEYS.apiKey);
    setIsConfigured(!!key);
  }, []);

  useEffect(() => { recheck(); }, [recheck]);

  return { isConfigured, recheck };
}
