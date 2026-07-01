import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const AI_STORAGE_KEYS = {
  apiKey: 'ai_api_key',
  config: 'ai_config_v1',
} as const;

const LEGACY_AI_STORAGE_KEYS = {
  apiKey: 'ai_api_key',
  baseUrl: 'ai_base_url',
} as const;

export type AIProviderKind = 'openai' | 'custom';
export type AIVerificationStatus = 'unverified' | 'verified' | 'rejected';
export type AIConfigurationErrorCode =
  | 'unauthorized'
  | 'network_error'
  | 'rate_limited'
  | 'provider_error';

export interface StoredAIConfiguration {
  provider: AIProviderKind;
  baseUrl: string | null;
  model: string | null;
  verificationStatus: AIVerificationStatus;
  verifiedAt: string | null;
  lastErrorCode: AIConfigurationErrorCode | null;
}

export interface ResolvedAIConfiguration extends StoredAIConfiguration {
  apiKey: string | null;
  hasApiKey: boolean;
}

interface SaveAIConfigurationInput {
  apiKey: string | null;
  baseUrl?: string | null;
  model?: string | null;
  verificationStatus?: AIVerificationStatus;
  lastErrorCode?: AIConfigurationErrorCode | null;
  verifiedAt?: string | null;
}

const DEFAULT_STORED_CONFIGURATION: StoredAIConfiguration = {
  provider: 'openai',
  baseUrl: null,
  model: null,
  verificationStatus: 'unverified',
  verifiedAt: null,
  lastErrorCode: null,
};

const getWebStorage = (): Storage | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return window.localStorage;
};

const secureGet = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return getWebStorage()?.getItem(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
};

const secureSet = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
};

const secureDelete = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    getWebStorage()?.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
};

export function normalizeAIBaseUrl(baseUrl?: string | null): string | null {
  const trimmed = baseUrl?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/\/+$/, '');
}

export function normalizeAIModel(model?: string | null): string | null {
  const trimmed = model?.trim();
  return trimmed ? trimmed : null;
}

export function inferAIProvider(baseUrl?: string | null): AIProviderKind {
  return normalizeAIBaseUrl(baseUrl) ? 'custom' : 'openai';
}

function normalizeStoredConfiguration(
  config?: Partial<StoredAIConfiguration> | null
): StoredAIConfiguration {
  const baseUrl = normalizeAIBaseUrl(config?.baseUrl ?? null);
  const model = normalizeAIModel(config?.model ?? null);
  const verificationStatus = config?.verificationStatus ?? DEFAULT_STORED_CONFIGURATION.verificationStatus;

  return {
    provider: config?.provider ?? inferAIProvider(baseUrl),
    baseUrl,
    model,
    verificationStatus,
    verifiedAt: verificationStatus === 'verified' ? config?.verifiedAt ?? new Date().toISOString() : null,
    lastErrorCode: verificationStatus === 'verified' ? null : config?.lastErrorCode ?? null,
  };
}

async function migrateLegacyAIConfiguration(): Promise<void> {
  const [storedConfigRaw, secureApiKey, legacyAsyncApiKey, legacyBaseUrl] = await Promise.all([
    AsyncStorage.getItem(AI_STORAGE_KEYS.config),
    secureGet(AI_STORAGE_KEYS.apiKey),
    AsyncStorage.getItem(LEGACY_AI_STORAGE_KEYS.apiKey),
    AsyncStorage.getItem(LEGACY_AI_STORAGE_KEYS.baseUrl),
  ]);

  if (!secureApiKey && legacyAsyncApiKey) {
    await secureSet(AI_STORAGE_KEYS.apiKey, legacyAsyncApiKey);
    await AsyncStorage.removeItem(LEGACY_AI_STORAGE_KEYS.apiKey);
  }

  if (!storedConfigRaw) {
    const nextConfig = normalizeStoredConfiguration({
      baseUrl: legacyBaseUrl,
    });
    await AsyncStorage.setItem(AI_STORAGE_KEYS.config, JSON.stringify(nextConfig));
  } else {
    try {
      const parsed = JSON.parse(storedConfigRaw) as Partial<StoredAIConfiguration>;
      const normalized = normalizeStoredConfiguration(parsed);
      if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
        await AsyncStorage.setItem(AI_STORAGE_KEYS.config, JSON.stringify(normalized));
      }
    } catch {
      await AsyncStorage.setItem(
        AI_STORAGE_KEYS.config,
        JSON.stringify(normalizeStoredConfiguration({ baseUrl: legacyBaseUrl }))
      );
    }
  }

  if (legacyBaseUrl) {
    await AsyncStorage.removeItem(LEGACY_AI_STORAGE_KEYS.baseUrl);
  }
}

async function getStoredConfiguration(): Promise<StoredAIConfiguration> {
  await migrateLegacyAIConfiguration();
  const storedConfigRaw = await AsyncStorage.getItem(AI_STORAGE_KEYS.config);
  if (!storedConfigRaw) {
    return DEFAULT_STORED_CONFIGURATION;
  }

  try {
    return normalizeStoredConfiguration(JSON.parse(storedConfigRaw) as Partial<StoredAIConfiguration>);
  } catch {
    const fallback = normalizeStoredConfiguration();
    await AsyncStorage.setItem(AI_STORAGE_KEYS.config, JSON.stringify(fallback));
    return fallback;
  }
}

export async function loadAIConfiguration(): Promise<ResolvedAIConfiguration> {
  const [storedConfig, apiKey] = await Promise.all([
    getStoredConfiguration(),
    secureGet(AI_STORAGE_KEYS.apiKey),
  ]);

  return {
    ...storedConfig,
    apiKey,
    hasApiKey: !!apiKey,
  };
}

export async function saveAIConfiguration({
  apiKey,
  baseUrl,
  model,
  verificationStatus = 'unverified',
  lastErrorCode = null,
  verifiedAt,
}: SaveAIConfigurationInput): Promise<ResolvedAIConfiguration> {
  const normalizedKey = apiKey?.trim() ?? null;
  const nextConfig = normalizeStoredConfiguration({
    baseUrl,
    model,
    verificationStatus,
    lastErrorCode,
    verifiedAt,
  });

  await Promise.all([
    normalizedKey ? secureSet(AI_STORAGE_KEYS.apiKey, normalizedKey) : secureDelete(AI_STORAGE_KEYS.apiKey),
    AsyncStorage.setItem(AI_STORAGE_KEYS.config, JSON.stringify(nextConfig)),
  ]);

  return {
    ...nextConfig,
    apiKey: normalizedKey,
    hasApiKey: !!normalizedKey,
  };
}

export async function updateAIConfigurationVerification(
  verificationStatus: AIVerificationStatus,
  lastErrorCode: AIConfigurationErrorCode | null = null
): Promise<ResolvedAIConfiguration> {
  const current = await loadAIConfiguration();
  return saveAIConfiguration({
    apiKey: current.apiKey,
    baseUrl: current.baseUrl,
    model: current.model,
    verificationStatus,
    lastErrorCode,
    verifiedAt: verificationStatus === 'verified' ? new Date().toISOString() : null,
  });
}

export async function clearAIConfiguration(): Promise<void> {
  await Promise.all([
    secureDelete(AI_STORAGE_KEYS.apiKey),
    AsyncStorage.setItem(AI_STORAGE_KEYS.config, JSON.stringify(DEFAULT_STORED_CONFIGURATION)),
  ]);
}

export function isAIConfigurationReady(config: Pick<ResolvedAIConfiguration, 'apiKey' | 'verificationStatus'>): boolean {
  return !!config.apiKey && config.verificationStatus === 'verified';
}