/**
 * globalRevenueCat.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Universal RevenueCat singleton wrapper.
 * Copy this file into any Expo / React Native app that uses RevenueCat.
 *
 * Requirements:
 *   npm install react-native-purchases
 *   Add EXPO_PUBLIC_REVENUECAT_IOS_KEY and EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
 *   to your .env file and config/env.ts.
 *
 * Usage:
 *   import { globalRevenueCat } from '@/lib/globalRevenueCat';
 *   await globalRevenueCat.initialize(userId);
 *   const info = await globalRevenueCat.getCustomerInfo();
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanType = 'monthly' | 'annual' | null;

export interface SubscriptionInfo {
  isPremium: boolean;
  planType: PlanType;
  /** ISO string of the next renewal / expiry date, or null */
  renewalDate: string | null;
  /** Raw RevenueCat CustomerInfo for advanced usage */
  raw: CustomerInfo | null;
}

export interface GlobalRevenueCatConfig {
  /** RevenueCat API key for iOS (from dashboard → App Store Connect) */
  iosApiKey: string;
  /** RevenueCat API key for Android (from dashboard → Google Play) */
  androidApiKey: string;
  /** The RevenueCat entitlement identifier you created in the dashboard */
  entitlementId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default entitlement identifier. Override via config. */
const DEFAULT_ENTITLEMENT = 'premium';

// ─── Singleton ────────────────────────────────────────────────────────────────

class GlobalRevenueCat {
  private static instance: GlobalRevenueCat;
  private initialized = false;
  private entitlementId = DEFAULT_ENTITLEMENT;

  static getInstance(): GlobalRevenueCat {
    if (!GlobalRevenueCat.instance) {
      GlobalRevenueCat.instance = new GlobalRevenueCat();
    }
    return GlobalRevenueCat.instance;
  }

  /**
   * Initialize RevenueCat. Call this once after the user is authenticated.
   * Pass the Supabase user ID so RevenueCat links purchases to your users.
   */
  async initialize(
    userId: string | null,
    config?: Partial<GlobalRevenueCatConfig>
  ): Promise<void> {
    if (this.initialized) {
      // If user changed (sign-out / sign-in), re-login
      if (userId) {
        try {
          await Purchases.logIn(userId);
        } catch {
          // Non-fatal
        }
      }
      return;
    }

    const iosKey =
      config?.iosApiKey ??
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ??
      '';
    const androidKey =
      config?.androidApiKey ??
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ??
      '';

    if (config?.entitlementId) {
      this.entitlementId = config.entitlementId;
    }

    const apiKey = Platform.select({ ios: iosKey, android: androidKey, default: androidKey });

    if (!apiKey) {
      console.warn(
        '[GlobalRevenueCat] No API key found. Set EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY.'
      );
      return;
    }

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    Purchases.configure({ apiKey });

    if (userId) {
      try {
        await Purchases.logIn(userId);
      } catch (err) {
        console.warn('[GlobalRevenueCat] logIn failed:', err);
      }
    }

    this.initialized = true;
    console.log('[GlobalRevenueCat] Initialized');
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
   * Returns a normalized SubscriptionInfo — safe to call frequently.
   */
  async getCustomerInfo(): Promise<SubscriptionInfo> {
    if (!this.initialized) {
      return { isPremium: false, planType: null, renewalDate: null, raw: null };
    }
    try {
      const info = await Purchases.getCustomerInfo();
      return this.parseCustomerInfo(info);
    } catch (err) {
      console.warn('[GlobalRevenueCat] getCustomerInfo error:', err);
      return { isPremium: false, planType: null, renewalDate: null, raw: null };
    }
  }

  /** Fetch available offerings from RevenueCat dashboard. */
  async getOfferings(): Promise<PurchasesOfferings | null> {
    if (!this.initialized) return null;
    try {
      return await Purchases.getOfferings();
    } catch (err) {
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
      console.log(
        '[GlobalRevenueCat] purchasePackage result:',
        JSON.stringify({
          isPremium: parsed.isPremium,
          activeEntitlements: Object.keys(customerInfo.entitlements.active),
          entitlementId: this.entitlementId,
        })
      );
    }
    return parsed;
  }

  /**
   * Restore previous purchases (required by App Store guidelines).
   * Returns updated SubscriptionInfo.
   */
  async restorePurchases(): Promise<SubscriptionInfo> {
    if (!this.initialized) {
      return { isPremium: false, planType: null, renewalDate: null, raw: null };
    }
    try {
      const info = await Purchases.restorePurchases();
      return this.parseCustomerInfo(info);
    } catch (err) {
      console.warn('[GlobalRevenueCat] restorePurchases error:', err);
      return { isPremium: false, planType: null, renewalDate: null, raw: null };
    }
  }

  get isReady(): boolean {
    return this.initialized;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private parseCustomerInfo(info: CustomerInfo): SubscriptionInfo {
    const entitlement = info.entitlements.active[this.entitlementId];

    if (!entitlement) {
      return { isPremium: false, planType: null, renewalDate: null, raw: info };
    }

    const productId = entitlement.productIdentifier?.toLowerCase() ?? '';
    let planType: PlanType = null;
    if (productId.includes('monthly')) planType = 'monthly';
    else if (productId.includes('annual') || productId.includes('yearly')) planType = 'annual';

    const renewalDate =
      entitlement.expirationDate ?? null;

    return { isPremium: true, planType, renewalDate, raw: info };
  }
}

export const globalRevenueCat = GlobalRevenueCat.getInstance();
