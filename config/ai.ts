// AI Service Configuration
import { Platform } from 'react-native';
import OpenAI from 'openai';
import { premiumManager } from '@/utils/premiumManager';
import { supabase } from '@/lib/supabase';
import {
  AI_STORAGE_KEYS,
  inferAIProvider,
  isAIConfigurationReady,
  loadAIConfiguration,
  normalizeAIBaseUrl,
  normalizeAIModel,
  type AIConfigurationErrorCode,
  type ResolvedAIConfiguration,
  updateAIConfigurationVerification,
} from './aiStorage';

// Storage keys for AI credentials.
// API key is kept in SecureStore (encrypted); base URL is non-sensitive so AsyncStorage is fine.
export { AI_STORAGE_KEYS };

export type { AIConfigurationErrorCode, ResolvedAIConfiguration } from './aiStorage';

export interface AIConnectionResult {
  ok: boolean;
  code?: AIConfigurationErrorCode;
  message: string;
}

type AIChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

interface AIChatCompletionRequest {
  messages: AIChatCompletionMessage[];
  model?: string | null;
  temperature?: number;
  max_tokens?: number;
  apiKey?: string | null;
  baseUrl?: string | null;
}

type OpenAIErrorShape = {
  status?: number;
  message?: string;
  code?: string;
  error?: {
    message?: string;
    code?: string;
    type?: string;
  };
};

const AI_PING_MESSAGE = [{ role: 'user' as const, content: 'ping' }];

function buildClientSignature(config: Pick<ResolvedAIConfiguration, 'apiKey' | 'baseUrl' | 'model' | 'provider'>): string | null {
  if (!config.apiKey) {
    return null;
  }

  return JSON.stringify({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
    provider: config.provider,
  });
}

function sanitizeOpenAIError(error: unknown): AIConnectionResult {
  const candidate = error as OpenAIErrorShape;
  const status = candidate.status;
  const message = (candidate.error?.message ?? candidate.message ?? '').toLowerCase();
  const code = (candidate.error?.code ?? candidate.code ?? '').toLowerCase();

  if (status === 401 || message.includes('401') || code.includes('invalid_api_key')) {
    return {
      ok: false,
      code: 'unauthorized',
      message: 'Your AI provider rejected the saved API key. Update it in AI Settings and try again.',
    };
  }

  if (status === 429 || message.includes('rate limit')) {
    return {
      ok: false,
      code: 'rate_limited',
      message: 'The AI provider is rate limiting requests right now. Please wait a moment and try again.',
    };
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return {
      ok: false,
      code: 'network_error',
      message: 'The AI provider could not be reached. Check your connection or provider URL and try again.',
    };
  }

  return {
    ok: false,
    code: 'provider_error',
    message: 'The AI provider could not verify the saved configuration. Review the provider URL and API key in AI Settings.',
  };
}

function shouldUseWebOpenAIRelay(
  config: Pick<ResolvedAIConfiguration, 'baseUrl' | 'provider'> | { baseUrl?: string | null; provider?: 'openai' | 'custom' }
): boolean {
  return Platform.OS === 'web' && !normalizeAIBaseUrl(config.baseUrl ?? null) && (config.provider ?? 'openai') === 'openai';
}

// OpenAI Configuration
export class AIConfig {
  private static openai: OpenAI | null = null;
  private static clientSignature: string | null = null;
  private static runtimeConfig: ResolvedAIConfiguration | null = null;

  /**
   * Initialize the AI client.
   * @param apiKey  OpenAI API key (or your backend's key)
   * @param baseUrl Optional base URL for OpenAI-compatible backends
   *               (e.g. http://localhost:11434/v1 for Ollama,
   *                     http://localhost:1234/v1 for LM Studio)
   */
  static initialize(apiKey: string, baseUrl?: string, model?: string | null) {
    const normalizedKey = apiKey.trim();
    const normalizedBaseUrl = normalizeAIBaseUrl(baseUrl);
    const normalizedModel = normalizeAIModel(model);

    this.runtimeConfig = {
      ...(this.runtimeConfig ?? {
        provider: inferAIProvider(normalizedBaseUrl),
        baseUrl: null,
        model: null,
        verificationStatus: 'unverified',
        verifiedAt: null,
        lastErrorCode: null,
        apiKey: null,
        hasApiKey: false,
      }),
      provider: inferAIProvider(normalizedBaseUrl),
      baseUrl: normalizedBaseUrl,
      model: normalizedModel,
      apiKey: normalizedKey || null,
      hasApiKey: !!normalizedKey,
    };
    this.invalidateClient();
  }

  static getClient(): OpenAI | null {
    if (!this.runtimeConfig?.apiKey) {
      return null;
    }

    const nextSignature = buildClientSignature(this.runtimeConfig);
    if (!nextSignature) {
      return null;
    }

    if (!this.openai || this.clientSignature !== nextSignature) {
      this.openai = new OpenAI({
        apiKey: this.runtimeConfig.apiKey,
        ...(this.runtimeConfig.baseUrl ? { baseURL: this.runtimeConfig.baseUrl } : {}),
        dangerouslyAllowBrowser: true,
      });
      this.clientSignature = nextSignature;
    }

    return this.openai;
  }

  static isConfigured(): boolean {
    return !!this.runtimeConfig && isAIConfigurationReady(this.runtimeConfig);
  }

  static getBaseUrl(): string | null {
    return this.runtimeConfig?.baseUrl ?? null;
  }

  static getRuntimeConfig(): ResolvedAIConfiguration | null {
    return this.runtimeConfig;
  }

  static invalidateClient() {
    this.openai = null;
    this.clientSignature = null;
  }

  static async refreshFromStorage(): Promise<ResolvedAIConfiguration> {
    const storedConfiguration = await loadAIConfiguration();
    this.runtimeConfig = storedConfiguration;
    this.invalidateClient();
    return storedConfiguration;
  }

  static async markVerified(): Promise<ResolvedAIConfiguration> {
    const nextConfig = await updateAIConfigurationVerification('verified');
    this.runtimeConfig = nextConfig;
    this.invalidateClient();
    return nextConfig;
  }

  static async markUnverified(
    code: AIConfigurationErrorCode
  ): Promise<ResolvedAIConfiguration> {
    const status = code === 'unauthorized' ? 'rejected' : 'unverified';
    const nextConfig = await updateAIConfigurationVerification(status, code);
    this.runtimeConfig = nextConfig;
    this.invalidateClient();
    return nextConfig;
  }

  static async verifyConfiguration(input?: {
    apiKey?: string | null;
    baseUrl?: string | null;
    model?: string | null;
  }): Promise<AIConnectionResult> {
    const apiKey = input?.apiKey?.trim() ?? this.runtimeConfig?.apiKey ?? null;
    if (!apiKey) {
      return {
        ok: false,
        message: 'An API key is required before AI can be verified.',
      };
    }

    const baseUrl = normalizeAIBaseUrl(input?.baseUrl ?? this.runtimeConfig?.baseUrl ?? null);
    const model = normalizeAIModel(input?.model ?? this.runtimeConfig?.model ?? GARDEN_AI_CONFIG.model);
    const client = new OpenAI({
      apiKey,
      ...(baseUrl ? { baseURL: baseUrl } : {}),
      dangerouslyAllowBrowser: true,
    });

    try {
      const provider = inferAIProvider(baseUrl);
      if (shouldUseWebOpenAIRelay({ baseUrl, provider })) {
        await this.createChatCompletion({
          apiKey,
          baseUrl,
          model,
          max_tokens: 5,
          messages: AI_PING_MESSAGE,
        });
      } else {
        await client.chat.completions.create({
          model: model ?? GARDEN_AI_CONFIG.model,
          max_tokens: 5,
          messages: AI_PING_MESSAGE,
        });
      }
      return { ok: true, message: 'AI provider verified successfully.' };
    } catch (error) {
      return sanitizeOpenAIError(error);
    }
  }

  static sanitizeError(error: unknown): AIConnectionResult {
    return sanitizeOpenAIError(error);
  }

  static async createChatCompletion({
    messages,
    model,
    temperature,
    max_tokens,
    apiKey,
    baseUrl,
  }: AIChatCompletionRequest): Promise<{ content: string }> {
    const resolvedApiKey = apiKey?.trim() ?? this.runtimeConfig?.apiKey ?? null;
    const resolvedBaseUrl = normalizeAIBaseUrl(baseUrl ?? this.runtimeConfig?.baseUrl ?? null);
    const resolvedModel = normalizeAIModel(model ?? this.runtimeConfig?.model ?? GARDEN_AI_CONFIG.model) ?? GARDEN_AI_CONFIG.model;
    const provider = inferAIProvider(resolvedBaseUrl);

    if (!resolvedApiKey) {
      throw new Error('AI client not configured');
    }

    if (shouldUseWebOpenAIRelay({ baseUrl: resolvedBaseUrl, provider })) {
      const { data, error } = await supabase.functions.invoke('ai-openai-relay', {
        body: {
          apiKey: resolvedApiKey,
          messages,
          model: resolvedModel,
          temperature,
          max_tokens,
        },
      });

      if (error) {
        throw error;
      }

      if (typeof data?.content !== 'string' || !data.content.trim()) {
        throw new Error('The AI provider returned an empty response.');
      }

      return { content: data.content };
    }

    const client = new OpenAI({
      apiKey: resolvedApiKey,
      ...(resolvedBaseUrl ? { baseURL: resolvedBaseUrl } : {}),
      dangerouslyAllowBrowser: true,
    });

    const response = await client.chat.completions.create({
      model: resolvedModel,
      messages,
      ...(typeof temperature === 'number' ? { temperature } : {}),
      ...(typeof max_tokens === 'number' ? { max_tokens } : {}),
    });

    return {
      content: response.choices[0]?.message?.content ?? '',
    };
  }
}

// Garden AI Assistant Configuration
export const GARDEN_AI_CONFIG = {
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  max_tokens: 500,
  system_prompt: `You are an expert garden advisor and plant specialist. You help gardeners with:
- Plant identification and care advice
- Growing season recommendations
- Companion planting suggestions  
- Problem diagnosis (pests, diseases, nutrient deficiencies)
- Harvest timing
- Seed starting and planting schedules
- Gardening best practices

Always provide practical, actionable advice. When discussing timing, ask for the user's location if not provided. Be encouraging and educational. If you're unsure about something specific, suggest consulting with local extension services or master gardeners.

Keep responses concise but informative. Focus on solutions and next steps.`,
};

// Voice Recognition Configuration
export const VOICE_CONFIG = {
  locale: 'en-US',
  language: 'en',
  interimResults: true,
  maxAlternatives: 3,
  timeout: 10000,
  continuous: false,
};

// Smart Shopping Configuration  
export const SHOPPING_AI_CONFIG = {
  model: 'gpt-3.5-turbo',
  temperature: 0.3, // Lower temperature for more focused recommendations
  max_tokens: 300,
  system_prompt: `You are a smart gardening shopping assistant. Analyze a user's seed inventory and gardening goals to provide personalized recommendations for:
- Seeds to buy for companion planting
- Seasonal seed purchases
- Succession planting suggestions
- Missing varieties in their collection
- Supplier recommendations based on past purchases

Consider:
- Current season and planting calendar
- Garden space optimization
- Beginner-friendly vs expert varieties
- Pest management through diversity
- Harvest scheduling

Format as JSON with: seed_name, supplier, reason, confidence (0-1), season_relevance, and price_range if known.`,
};

// Premium-integrated AI features checker
// Pass isPremium/isVoice from RevenueCat (useGlobalSubscription) as the
// source of truth. Falls back to local premiumManager when not provided.
export const getAIFeatures = async (rcIsPremium?: boolean, rcIsVoice?: boolean) => {
  await premiumManager.initialize();
  const subscription = premiumManager.getSubscription();

  // RevenueCat is canonical — if the user is premium via RC, unlock all
  // voice-tier AI features regardless of the local subscription cache.
  const voiceUnlocked = rcIsVoice ?? subscription?.features.voice_notes ?? false;
  const premiumUnlocked = rcIsPremium ?? (subscription?.isActive && subscription.tier !== 'free');

  return {
    voice_notes: (voiceUnlocked || (subscription?.features.voice_notes ?? false)) && Platform.OS !== 'web',
    ai_chat: voiceUnlocked || subscription?.features.ai_garden_assistant || false,
    smart_shopping: voiceUnlocked || subscription?.features.smart_shopping_assistant || false,
    plant_identification: (premiumUnlocked && (subscription?.features.plant_health_diagnostics ?? false)), // Phase 2
    disease_diagnosis: (premiumUnlocked && (subscription?.features.plant_health_diagnostics ?? false)), // Phase 2
    harvest_prediction: (premiumUnlocked && (subscription?.features.harvest_prediction ?? false)), // Phase 3
  };
};

// Legacy feature flags (deprecated - use getAIFeatures instead)
export const AI_FEATURES = {
  voice_notes: Platform.OS !== 'web', // Will be checked against premium at runtime
  ai_chat: true, // Will be checked against premium at runtime
  smart_shopping: true, // Will be checked against premium at runtime
  plant_identification: false, // Phase 2
  disease_diagnosis: false, // Phase 2
  harvest_prediction: false, // Phase 3
};