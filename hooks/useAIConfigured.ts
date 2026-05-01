import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AI_STORAGE_KEYS } from '@/config/ai';

/**
 * Returns whether the user has saved an AI API key in SecureStore.
 * `isConfigured` is `null` while the initial check is in progress.
 */
export function useAIConfigured() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  const recheck = useCallback(async () => {
    const key = await SecureStore.getItemAsync(AI_STORAGE_KEYS.apiKey);
    setIsConfigured(!!key);
  }, []);

  useEffect(() => { recheck(); }, [recheck]);

  return { isConfigured, recheck };
}
