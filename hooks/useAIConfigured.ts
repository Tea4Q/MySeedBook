import { useCallback, useEffect, useState } from 'react';
import { AIConfig } from '@/config/ai';
import { isAIConfigurationReady } from '@/config/aiStorage';

/**
 * Returns whether the user has a verified AI configuration.
 * `isConfigured` is `null` while the initial check is in progress.
 */
export function useAIConfigured() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  const recheck = useCallback(async () => {
    const config = await AIConfig.refreshFromStorage();
    setIsConfigured(isAIConfigurationReady(config));
  }, []);

  useEffect(() => { recheck(); }, [recheck]);

  return { isConfigured, recheck };
}
