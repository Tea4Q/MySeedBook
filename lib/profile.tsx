/**
 * globalSubscriptionManager.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * React context + hook that surfaces RevenueCat subscription state to the UI.
 * Copy this file into any Expo / React Native app alongside globalRevenueCat.ts.
 *
 * Usage:
 *   // Wrap your app:
 *   <GlobalSubscriptionProvider>...</GlobalSubscriptionProvider>
 *
 *   // Inside any component:
 *   const { isPremium, planType, renewalDate, purchase, openManageSubscriptions } =
 *     useGlobalSubscription();
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import { globalRevenueCat, SubscriptionInfo, SubscriptionTier } from './globalRevenueCat';
import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlobalSubscriptionContextValue {
  /** True if user has an active essential or voice subscription */
  isPremium: boolean;
  /** True if user has an active voice tier subscription */
  isVoice: boolean;
  /** Subscription tier: 'free' | 'essential' | 'voice' */
  tier: SubscriptionTier;
  /** 'monthly' | 'yearly' | null */
  planType: SubscriptionInfo['planType'];
  /** ISO date string of next renewal, or null */
  renewalDate: string | null;
  /** Friendly display label, e.g. "Essential Monthly" */
  planLabel: string;
  /** True while fetching subscription state */
  isLoading: boolean;
  /** Current RevenueCat offerings. Null until loaded. */
  offerings: PurchasesOfferings | null;
  /** Whether the user is within the refund eligibility window */
  isEligibleForRefund: boolean;
  /** Whether the user is blocked from resubscribing (30-day cooldown) */
  isResubscribeBlocked: boolean;
  /** Date when resubscribe block lifts, or null */
  resubscribeAllowedFrom: string | null;
  /** Purchase a RevenueCat package */
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Restore purchases (required by App Store & Google Play) */
  restore: () => Promise<boolean>;
  /** Refresh subscription state from RevenueCat */
  refresh: () => Promise<void>;
  /** Open platform subscription management page */
  openManageSubscriptions: () => Promise<void>;
  /** Deep-link to platform refund page if within window */
  requestRefund: () => Promise<void>;
}

// ─── Default values ───────────────────────────────────────────────────────────

const defaultValue: GlobalSubscriptionContextValue = {
  isPremium: false,
  isVoice: false,
  tier: 'free',
  planType: null,
  renewalDate: null,
  planLabel: 'Free',
  isLoading: true,
  offerings: null,
  isEligibleForRefund: false,
  isResubscribeBlocked: false,
  resubscribeAllowedFrom: null,
  purchase: async () => false,
  restore: async () => false,
  refresh: async () => {},
  openManageSubscriptions: async () => {},
  requestRefund: async () => {},
};

// ─── Context ──────────────────────────────────────────────────────────────────

const GlobalSubscriptionContext =
  createContext<GlobalSubscriptionContextValue>(defaultValue);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface GlobalSubscriptionProviderProps {
  children: React.ReactNode;
  /** Authenticated user ID (Supabase UUID). Pass null for guests. */
  userId: string | null;
}

export function GlobalSubscriptionProvider({
  children,
  userId,
}: GlobalSubscriptionProviderProps) {
  const [info, setInfo] = useState<SubscriptionInfo>({
    tier: 'free',
    isPremium: false,
    isVoice: false,
    planType: null,
    renewalDate: null,
    raw: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isResubscribeBlocked, setIsResubscribeBlocked] = useState(false);
  const [resubscribeAllowedFrom, setResubscribeAllowedFrom] = useState<string | null>(null);
  const initRef = useRef(false);

  // ─── Init RevenueCat whenever userId changes ───────────────────────────────

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      try {
        await globalRevenueCat.initialize(userId);
        await refreshInternal();
        const off = await globalRevenueCat.getOfferings();
        setOfferings(off);

        // Check Supabase resubscribe block
        if (userId) {
          await checkResubscribeBlock(userId);
        }
      } finally {
        setIsLoading(false);
        initRef.current = true;
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const refreshInternal = async () => {
    const latest = await globalRevenueCat.getCustomerInfo();
    setInfo(latest);
  };

  const checkResubscribeBlock = async (uid: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('resubscribe_blocked_until')
        .eq('id', uid)
        .single();

      if (data?.resubscribe_blocked_until) {
        const blockUntil = new Date(data.resubscribe_blocked_until);
        if (blockUntil > new Date()) {
          setIsResubscribeBlocked(true);
          setResubscribeAllowedFrom(data.resubscribe_blocked_until);
          return;
        }
      }
      setIsResubscribeBlocked(false);
      setResubscribeAllowedFrom(null);
    } catch {
      // Non-fatal — default to unblocked
    }
  };

  const refresh = useCallback(async () => {
    await refreshInternal();
    if (userId) await checkResubscribeBlock(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const purchase = useCallback(
    async (pkg: PurchasesPackage): Promise<boolean> => {
      if (isResubscribeBlocked) {
        const date = resubscribeAllowedFrom
          ? new Date(resubscribeAllowedFrom).toLocaleDateString()
          : 'soon';
        Alert.alert(
          'Resubscribe Not Yet Available',
          `You recently deleted your account. You can resubscribe from ${date}.`
        );
        return false;
      }
      try {
        const updated = await globalRevenueCat.purchasePackage(pkg);
        setInfo(updated);
        // purchasePackage only returns (non-throw) when RevenueCat confirmed the
        // receipt (POST /v1/receipts 200). Entitlements may not be reflected in
        // the immediately-returned CustomerInfo in test/simulator environments,
        // so we treat any non-cancelled, non-error completion as success.
        // refresh() called by the modal after this will sync the real state.
        return true;
      } catch (err: any) {
        if (err?.userCancelled) return false;
        Alert.alert('Purchase Failed', err?.message ?? 'Please try again.');
        return false;
      }
    },
    [isResubscribeBlocked, resubscribeAllowedFrom]
  );

  const restore = useCallback(async (): Promise<boolean> => {
    const updated = await globalRevenueCat.restorePurchases();
    setInfo(updated);
    return updated.isPremium;
  }, []);

  const openManageSubscriptions = useCallback(async () => {
    const url = Platform.select({
      ios: 'https://apps.apple.com/account/subscriptions',
      android:
        'https://play.google.com/store/account/subscriptions',
      default: 'https://play.google.com/store/account/subscriptions',
    })!;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open subscription management page.');
    }
  }, []);

  const requestRefund = useCallback(async () => {
    if (!info.renewalDate) return;

    // Calculate purchase date from renewal date minus one billing cycle
    const renewalMs = new Date(info.renewalDate).getTime();
    const nowMs = Date.now();
    const cycleDays = info.planType === 'yearly' ? 365 : 30;
    const cycleSincePurchaseMs = renewalMs - cycleDays * 24 * 60 * 60 * 1000;
    const daysSincePurchase = (nowMs - cycleSincePurchaseMs) / (1000 * 60 * 60 * 24);
    const refundWindowDays = info.planType === 'yearly' ? 15 : 7;

    if (daysSincePurchase > refundWindowDays) {
      Alert.alert(
        'Refund Window Expired',
        `Refunds are available within ${refundWindowDays} days of purchase. Your refund window has closed.`
      );
      return;
    }

    const url = Platform.select({
      ios: 'https://reportaproblem.apple.com/',
      android:
        'https://play.google.com/store/account/subscriptions',
      default: 'https://play.google.com/store/account/subscriptions',
    })!;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open the refund page.');
    }
  }, [info]);

  // ─── Derived values ───────────────────────────────────────────────────────

  const planLabel = (() => {
    if (!info.isPremium) return 'Free';
    const billing = info.planType === 'yearly' ? 'Yearly' : 'Monthly';
    if (info.tier === 'voice') return `Voice & AI ${billing}`;
    return `Essential ${billing}`;
  })();

  const isEligibleForRefund = (() => {
    if (!info.isPremium || !info.renewalDate) return false;
    const renewalMs = new Date(info.renewalDate).getTime();
    const nowMs = Date.now();
    const cycleDays = info.planType === 'yearly' ? 365 : 30;
    const purchaseMs = renewalMs - cycleDays * 24 * 60 * 60 * 1000;
    const daysSincePurchase = (nowMs - purchaseMs) / (1000 * 60 * 60 * 24);
    const window = info.planType === 'yearly' ? 15 : 7;
    return daysSincePurchase <= window;
  })();

  return (
    <GlobalSubscriptionContext.Provider
      value={{
        isPremium: info.isPremium,
        isVoice: info.isVoice,
        tier: info.tier,
        planType: info.planType,
        renewalDate: info.renewalDate,
        planLabel,
        isLoading,
        offerings,
        isEligibleForRefund,
        isResubscribeBlocked,
        resubscribeAllowedFrom,
        purchase,
        restore,
        refresh,
        openManageSubscriptions,
        requestRefund,
      }}
    >
      {children}
    </GlobalSubscriptionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGlobalSubscription(): GlobalSubscriptionContextValue {
  const ctx = useContext(GlobalSubscriptionContext);
  if (!ctx) {
    throw new Error(
      'useGlobalSubscription must be called inside <GlobalSubscriptionProvider>'
    );
  }
  return ctx;
}
