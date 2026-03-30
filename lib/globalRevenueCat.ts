/**
 * globalRevenueCat.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Universal RevenueCat singleton wrapper for MySeedBook Catalogue.
 *
 * Subscription Tiers (standalone — not combined):
 *   essential → Unlimited seeds, weather integration, cloud sync
 *               $7.99/month  |  $63.99/year
 *   voice     → Replaces Essential — everything in Essential PLUS
 *               voice notes & AI voice entry (OpenAI Whisper)
 *               $9.99/month  |  $79.99/year  (upgrade from Essential)
 *
 * RevenueCat dashboard setup:
 *   1. Create entitlements:  "essential"  and  "voice"
 *   2. Create products in App Store Connect & Google Play (see PRODUCT_IDS below)
 *   3. Attach products to entitlements
 *   4. Create two offerings: "default" (essential) and "voice"
 *
 * Requirements:
 *   npm install react-native-purchases
 *   Add EXPO_PUBLIC_REVENUECAT_IOS_KEY and EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
 *   to your .env.local file.
 */

import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanType = 'monthly' | 'yearly' | null;

/**
 * Subscription tier hierarchy — standalone tiers, not stacked.
 *  free      → no active subscription (3 seeds, 2 suppliers limit)
 *  essential → $7.99/mo | $63.99/yr  — Unlimited seeds, weather, cloud sync
 *  voice     → $9.99/mo | $79.99/yr  — Everything in Essential + voice notes + AI voice entry
 *              Users upgrade FROM essential TO voice; they do not pay both.
 */
export type SubscriptionTier = 'free' | 'essential' | 'voice';

export interface SubscriptionInfo {
  /** Highest active tier for this user */
  tier: SubscriptionTier;
  /** true when tier is essential or voice */
  isPremium: boolean;
  /** true when the voice entitlement is active */
  isVoice: boolean;
  /** Billing period of the primary active subscription */
  planType: PlanType;
  /** ISO string of the next renewal / expiry date, or null */
  renewalDate: string | null;
  /** Raw RevenueCat CustomerInfo for advanced usage */
  raw: CustomerInfo | null;
}

export interface GlobalRevenueCatConfig {
  iosApiKey: string;
  androidApiKey: string;
  essentialEntitlementId?: string;
  voiceEntitlementId?: string;
}

// ─── Entitlement & Product ID Constants ───────────────────────────────────────

/** RevenueCat entitlement IDs — must match your dashboard exactly. */
export const ENTITLEMENT_ESSENTIAL = 'essential';
export const ENTITLEMENT_VOICE = 'voice';

/**
 * Store product identifiers — create these in App Store Connect & Google Play,
 * then attach to the matching entitlements in the RevenueCat dashboard.
 *
 * iOS App Store Connect products:
 *   com.myseedbook.catalogue.essential.month    — $7.99/month
 *   com.myseedbook.catalogue.essential.year     — $63.99/year  (saves 33%)
 *   com.myseedbook.catalogue.voice.monthly      — $9.99/month  (upgrade, replaces Essential)
 *   com.myseedbook.catalogue.voice.yearly       — $79.99/year  (upgrade, replaces Essential, saves 33%)
 *
 * Google Play Console subscription IDs:
 *   myseedbook_essential_month    — $7.99/month
 *   myseedbook_essential_year     — $63.99/year  (saves 33%)
 *   myseedbook_voice_monthly      — $9.99/month  (upgrade, replaces Essential)
 *   myseedbook_voice_yearly       — $79.99/year  (upgrade, replaces Essential, saves 33%)
 */
export const PRODUCT_IDS = {
  ios: {
    essentialMonthly: 'com.myseedbook.catalogue.essential.month',
    essentialYearly:  'com.myseedbook.catalogue.essential.year',
    voiceMonthly:     'com.myseedbook.catalogue.voice.monthly',
    voiceYearly:      'com.myseedbook.catalogue.voice.yearly',
  },
  android: {
    essentialMonthly: 'myseedbook_essential_month',
    essentialYearly:  'myseedbook_essential_year',
    voiceMonthly:     'myseedbook_voice_monthly',
    voiceYearly:      'myseedbook_voice_yearly',
  },
} as const;

// ─── Singleton ────────────────────────────────────────────────────────────────

class GlobalRevenueCat {
  private static instance: GlobalRevenueCat;
  private initialized = false;
  private offeringsMisconfigured = false;
  private essentialEntitlementId = ENTITLEMENT_ESSENTIAL;
  private voiceEntitlementId = ENTITLEMENT_VOICE;

  static getInstance(): GlobalRevenueCat {
    if (!GlobalRevenueCat.instance) {
      GlobalRevenueCat.instance = new GlobalRevenueCat();
    }
    return GlobalRevenueCat.instance;
  }

  /**
   * Initialize RevenueCat. Call once after the user is authenticated.
   * Pass the Supabase user ID so RevenueCat links purchases to accounts.
   */
  async initialize(
    userId: string | null,
    config?: Partial<GlobalRevenueCatConfig>
  ): Promise<void> {
    if (this.initialized) {
      if (userId) {
        try {
          await Purchases.logIn(userId);
        } catch {
          // Non-fatal
        }
      }
      return;
    }

    const iosKey = config?.iosApiKey ?? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
    const androidKey = config?.androidApiKey ?? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

    if (config?.essentialEntitlementId) this.essentialEntitlementId = config.essentialEntitlementId;
    if (config?.voiceEntitlementId) this.voiceEntitlementId = config.voiceEntitlementId;

    const apiKey = Platform.select({ ios: iosKey, android: androidKey, default: androidKey });

    if (!apiKey) {
      console.warn('[GlobalRevenueCat] No API key found. Set EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY in .env.local');
      return;
    }

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    try {
      Purchases.configure({ apiKey });
    } catch (err: any) {
      const message = String(err?.message ?? err ?? '').toLowerCase();
      const isExpoGoStoreError =
        message.includes('native store is not available when running inside expo go') ||
        message.includes('invalid api key');

      if (isExpoGoStoreError) {
        console.warn(
          '[GlobalRevenueCat] RevenueCat is disabled in Expo Go with native store keys. Use a development build, or use RevenueCat Test Store keys for Expo Go testing.'
        );
        return;
      }

      throw err;
    }

    if (userId) {
      try {
        await Purchases.logIn(userId);
      } catch (err) {
        console.warn('[GlobalRevenueCat] logIn failed:', err);
      }
    }

    this.initialized = true;
    this.offeringsMisconfigured = false;
    console.log('[GlobalRevenueCat] Initialized (essential + voice tiers)');
  }

  /** Log out the current user (call on sign-out). */
  async logOut(): Promise<void> {
    if (!this.initialized) return;
    try {
      await Purchases.logOut();
    } catch (err) {
      console.warn('[GlobalRevenueCat] logOut error:', err);
    }
  }

  /**
   * Fetch current customer subscription info.
   * Checks both "essential" and "voice" entitlements.
   */
  async getCustomerInfo(): Promise<SubscriptionInfo> {
    if (!this.initialized) {
      return this.emptyInfo(null);
    }
    try {
      const info = await Purchases.getCustomerInfo();
      return this.parseCustomerInfo(info);
    } catch (err) {
      console.warn('[GlobalRevenueCat] getCustomerInfo error:', err);
      return this.emptyInfo(null);
    }
  }

  /** Fetch all available offerings from RevenueCat dashboard. */
  async getOfferings(): Promise<PurchasesOfferings | null> {
    if (!this.initialized || this.offeringsMisconfigured) return null;
    try {
      return await Purchases.getOfferings();
    } catch (err: any) {
      const message = String(err?.message ?? err ?? '').toLowerCase();
      const isConfigError =
        message.includes('there are no play store products registered') ||
        message.includes('why-are-offerings-empty') ||
        message.includes('configurationerror');

      if (isConfigError) {
        this.offeringsMisconfigured = true;
        console.warn('[GlobalRevenueCat] Offerings unavailable due to dashboard/store mapping configuration. Skipping further offerings fetch attempts until next initialize().');
      }
      console.warn('[GlobalRevenueCat] getOfferings error:', err);
      return null;
    }
  }

  /**
   * Purchase a package.
   * Returns updated SubscriptionInfo on success, throws on failure.
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<SubscriptionInfo> {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const parsed = this.parseCustomerInfo(customerInfo);
    if (__DEV__) {
      console.log('[GlobalRevenueCat] purchasePackage result:', JSON.stringify({
        tier: parsed.tier,
        isPremium: parsed.isPremium,
        isVoice: parsed.isVoice,
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
      }));
    }
    return parsed;
  }

  /**
   * Restore previous purchases (required by App Store & Play Store guidelines).
   * Returns updated SubscriptionInfo.
   */
  async restorePurchases(): Promise<SubscriptionInfo> {
    if (!this.initialized) {
      return this.emptyInfo(null);
    }
    try {
      const info = await Purchases.restorePurchases();
      return this.parseCustomerInfo(info);
    } catch (err) {
      console.warn('[GlobalRevenueCat] restorePurchases error:', err);
      return this.emptyInfo(null);
    }
  }

  get isReady(): boolean {
    return this.initialized;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private emptyInfo(raw: CustomerInfo | null): SubscriptionInfo {
    return { tier: 'free', isPremium: false, isVoice: false, planType: null, renewalDate: null, raw };
  }

  private parseCustomerInfo(info: CustomerInfo): SubscriptionInfo {
    const voiceEnt = info.entitlements.active[this.voiceEntitlementId];
    const essentialEnt = info.entitlements.active[this.essentialEntitlementId];

    const tier: SubscriptionTier = voiceEnt ? 'voice' : essentialEnt ? 'essential' : 'free';

    if (tier === 'free') {
      return this.emptyInfo(info);
    }

    const activeEnt = (voiceEnt ?? essentialEnt)!;
    const productId = activeEnt.productIdentifier?.toLowerCase() ?? '';
    let planType: PlanType = null;
    if (productId.includes('monthly') || productId.includes('.month') || productId.includes('_month')) {
      planType = 'monthly';
    } else if (
      productId.includes('yearly') ||
      productId.includes('annual') ||
      productId.includes('.year') ||
      productId.includes('_year')
    ) {
      planType = 'yearly';
    }

    return {
      tier,
      isPremium: true,
      isVoice: tier === 'voice',
      planType,
      renewalDate: activeEnt.expirationDate ?? null,
      raw: info,
    };
  }
}

export const globalRevenueCat = GlobalRevenueCat.getInstance();
