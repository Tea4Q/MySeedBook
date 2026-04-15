/**
 * GlobalSubscriptionModal.tsx
 * Multi-tier paywall (v1.3.0 — Apple submission build):
 *  - Essential: $7.99/month or $63.99/year  (purchasable)
 *  - Voice & AI Entry: Coming in v1.3.1     (non-purchasable, shown as Coming Soon)
 *  - Advanced AI: Coming soon               (non-purchasable)
 *
 * NOTE: Voice & AI tier is intentionally shown as "Coming in v1.3.1" here.
 * To re-enable it, convert the voice <View> card back to a <Pressable> card
 * and restore the selectedTier state guard (see v1.3.1 branch).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Check,
  Cloud,
  Leaf,
  Mic,
  RefreshCw,
  Sprout,
  Volume2,
  X,
  Sparkles,
} from 'lucide-react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { useTheme } from '@/lib/theme';
import { useGlobalSubscription } from '@/lib/globalSubscriptionManager';
import { globalRevenueCat } from '@/lib/globalRevenueCat';
import { PRICING, PRICING_COPY } from '@/lib/pricingCopy';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'expo-router';

type TierId = 'essential' | 'voice' | 'advanced_ai';
type BillingId = 'monthly' | 'yearly';

interface GlobalSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
}

const PRIVACY_URL = 'https://sites.google.com/view/chandraskinner/home/privacy';
const TERMS_URL = 'https://sites.google.com/view/chandraskinner/home/terms';
const DELETE_RESTORE_URL = 'https://sites.google.com/view/chandraskinner/home/delete-restore-purchases';

const TIER_META: Record<Exclude<TierId, 'advanced_ai'>, {
  title: string;
  subtitle: string;
  monthlyFallback: string;
  yearlyFallback: string;
  features: string[];
}> = {
  essential: {
    title: 'Essential',
    subtitle: 'Unlimited seeds + weather + cloud sync',
    monthlyFallback: PRICING.essential.monthlyDisplay,
    yearlyFallback: PRICING.essential.yearlyDisplay,
    features: [
      'Unlimited seeds',
      'Weather integration',
      'Cloud sync across devices',
      'Unlimited suppliers and photos',
    ],
  },
  voice: {
    title: 'Voice & AI Entry',
    subtitle: 'Everything in Essential + voice features',
    monthlyFallback: PRICING.voice.monthlyDisplay,
    yearlyFallback: PRICING.voice.yearlyDisplay,
    features: [
      'Voice notes',
      'AI voice transcription entry',
      'Hands-free add/edit workflow',
      'Everything in Essential included',
    ],
  },
};

const ADVANCED_AI_FEATURES = [
  'AI crop recommendations',
  'Predictive planting assistant',
  'Smart disease detection insights',
  'Coming soon notice and waitlist updates',
];

function getTierFromPackage(pkg: PurchasesPackage): Exclude<TierId, 'advanced_ai'> | null {
  const id = pkg.product.identifier.toLowerCase();
  if (id.includes('voice')) return 'voice';
  if (id.includes('essential')) return 'essential';
  return null;
}

function getBillingFromPackage(pkg: PurchasesPackage): BillingId {
  const id = pkg.product.identifier.toLowerCase();
  if (pkg.packageType === 'ANNUAL' || id.includes('yearly') || id.includes('annual')) {
    return 'yearly';
  }
  return 'monthly';
}

export default function GlobalSubscriptionModal({
  visible,
  onClose,
  feature,
}: GlobalSubscriptionModalProps) {
  const { colors } = useTheme();
  const { isGuest } = useAuth();
  const router = useRouter();
  const {
    purchase,
    restore,
    refresh,
    offerings,
    isLoading,
    tier,
    isResubscribeBlocked,
    resubscribeAllowedFrom,
  } = useGlobalSubscription();

  const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [offersError, setOffersError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Exclude<TierId, 'advanced_ai'>>('essential');
  const [selectedBilling, setSelectedBilling] = useState<BillingId>('monthly');

  useEffect(() => {
    if (!visible) return;

    const all = offerings?.all ?? {};
    const fromAllOfferings = Object.values(all).flatMap((off) => off.availablePackages ?? []);

    if (fromAllOfferings.length > 0) {
      const uniqueByIdentifier = new Map<string, PurchasesPackage>();
      fromAllOfferings.forEach((p) => uniqueByIdentifier.set(p.identifier, p));
      setPackages(Array.from(uniqueByIdentifier.values()));
      setOffersError(false);
    }
  }, [visible, offerings]);

  useEffect(() => {
    if (!visible) return;
    if (offerings && !isLoading && !retrying && packages.length === 0) {
      setOffersError(true);
    }
  }, [visible, offerings, isLoading, retrying, packages.length]);

  useEffect(() => {
    // Only essential is selectable in this build; voice tier is Coming in v1.3.1
    if (tier === 'essential') {
      setSelectedTier('essential');
    }
  }, [tier]);

  const pkgLookup = useMemo(() => {
    const lookup = new Map<string, PurchasesPackage>();
    for (const pkg of packages) {
      const pkgTier = getTierFromPackage(pkg);
      if (!pkgTier) continue;
      const billing = getBillingFromPackage(pkg);
      lookup.set(`${pkgTier}:${billing}`, pkg);
    }
    return lookup;
  }, [packages]);

  const selectedPackage = pkgLookup.get(`${selectedTier}:${selectedBilling}`) ?? null;

  const handleRetry = useCallback(async () => {
    setOffersError(false);
    setRetrying(true);
    try {
      const off = await globalRevenueCat.getOfferings();
      const all = off?.all ?? {};
      const allPackages = Object.values(all).flatMap((o) => o.availablePackages ?? []);
      if (allPackages.length > 0) {
        const uniqueByIdentifier = new Map<string, PurchasesPackage>();
        allPackages.forEach((p) => uniqueByIdentifier.set(p.identifier, p));
        setPackages(Array.from(uniqueByIdentifier.values()));
      } else {
        setOffersError(true);
      }
    } catch {
      setOffersError(true);
    } finally {
      setRetrying(false);
    }
  }, []);

  useEffect(() => {
    if (!visible || offerings || packages.length > 0 || isLoading || retrying || offersError) {
      return;
    }
    void handleRetry();
  }, [visible, offerings, packages.length, isLoading, retrying, offersError, handleRetry]);

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert(
        'Unable to Connect to Store',
        'Plan details could not be loaded. Please check your internet connection and tap "Try Again" to reload.'
      );
      return;
    }

    setLoadingPackageId(selectedPackage.identifier);
    try {
      const success = await purchase(selectedPackage);
      if (success) {
        await refresh();
        onClose();
        Alert.alert('Upgrade Complete', 'Your subscription has been updated successfully.');
      }
    } finally {
      setLoadingPackageId(null);
    }
  };

  const handleRestore = async () => {
    setLoadingPackageId('restore');
    try {
      const restored = await restore();
      setLoadingPackageId(null);
      if (restored) {
        Alert.alert('Restored', 'Your purchases were restored.', [{ text: 'OK', onPress: onClose }]);
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases were found for this account.');
      }
    } catch (err: any) {
      setLoadingPackageId(null);
      Alert.alert('No Purchases Found', 'No previous purchases were found for this account.');
    }
  };

  const openExternal = async (url: string, label: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable To Open Link', `Could not open ${label}.`);
    }
  };

  const textSecondary = colors.textSecondary || `${colors.text}99`;

  const tierPrice = (tierId: Exclude<TierId, 'advanced_ai'>, billing: BillingId) => {
    const pkg = pkgLookup.get(`${tierId}:${billing}`);
    if (pkg) {
      return `${pkg.product.priceString} / ${billing === 'yearly' ? 'year' : 'month'}`;
    }
    return billing === 'yearly'
      ? TIER_META[tierId].yearlyFallback
      : TIER_META[tierId].monthlyFallback;
  };

  // ─── Guest gate: prompt account creation before RevenueCat paywall ─────────
  if (isGuest) {
    const textSecondaryGuest = colors.textSecondary || `${colors.text}99`;
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={16}>
            <X size={22} color={colors.text} />
          </Pressable>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
                <Sprout size={26} color={colors.primaryText} />
              </View>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                Create a Free Account
              </Text>
              <Text style={[styles.heroSub, { color: textSecondaryGuest }]}>
                You need a free account to subscribe. Creating one takes 30 seconds and gives you 10 free seeds and 3 free suppliers to start.
              </Text>
            </View>

            <View style={[styles.tierCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {[
                '10 free seeds',
                '3 free suppliers',
                'Cloud sync across devices',
                'Upgrade to Essential anytime for unlimited access',
              ].map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Check size={16} color={colors.primary} />
                  <Text style={[styles.featureText, { color: textSecondaryGuest }]}>{f}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
              onPress={() => { onClose(); router.push('/auth'); }}
            >
              <Text style={[styles.ctaText, { color: colors.primaryText }]}>Create Free Account</Text>
            </Pressable>

            <Pressable style={styles.restoreBtn} onPress={onClose}>
              <Text style={[styles.restoreText, { color: textSecondaryGuest }]}>Continue as Guest</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    );
  }
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={16}>
          <X size={22} color={colors.text} />
        </Pressable>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}> 
              <Sprout size={26} color={colors.primaryText} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}> 
              {feature ? `Upgrade for ${feature}` : PRICING_COPY.planChooserTitle}
            </Text>
            <Text style={[styles.heroSub, { color: textSecondary }]}> 
              {PRICING_COPY.modalHeroSub}
            </Text>
          </View>

          <View style={[styles.billingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable
              style={[
                styles.billingBtn,
                selectedBilling === 'monthly' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedBilling('monthly')}
            >
              <Text
                style={[
                  styles.billingText,
                  { color: selectedBilling === 'monthly' ? colors.primaryText : colors.text },
                ]}
              >
                Monthly
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.billingBtn,
                selectedBilling === 'yearly' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedBilling('yearly')}
            >
              <Text
                style={[
                  styles.billingText,
                  { color: selectedBilling === 'yearly' ? colors.primaryText : colors.text },
                ]}
              >
                Yearly
              </Text>
            </Pressable>
          </View>

          {isResubscribeBlocked && (
            <View style={[styles.blockedBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Text style={[styles.blockedText, { color: colors.text }]}> 
                You recently deleted your account. New subscriptions are available from{' '}
                {resubscribeAllowedFrom ? new Date(resubscribeAllowedFrom).toLocaleDateString() : 'soon'}.
              </Text>
            </View>
          )}

          {(isLoading || retrying) && packages.length === 0 ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.loadingText, { color: textSecondary }]}>Loading plan data...</Text>
            </View>
          ) : offersError ? (
            <View style={styles.loadingRow}>
              <Text style={[styles.loadingText, { color: textSecondary, textAlign: 'center', marginBottom: 12 }]}>
                Unable to load live store plans. You can still review pricing below.
              </Text>
              <Pressable style={[styles.retryBtn, { borderColor: colors.primary }]} onPress={handleRetry}>
                <RefreshCw size={16} color={colors.primary} />
                <Text style={[styles.retryBtnText, { color: colors.primary }]}>Try Again</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.tierList}>
            <Pressable
              style={[
                styles.tierCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selectedTier === 'essential' && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => setSelectedTier('essential')}
            >
              <View style={styles.tierHeader}>
                <View style={[styles.tierIconBadge, { backgroundColor: `${colors.primary}22` }]}> 
                  <Leaf size={18} color={colors.primary} />
                </View>
                <View style={styles.tierHeadTextWrap}>
                  <Text style={[styles.tierTitle, { color: colors.text }]}>{TIER_META.essential.title}</Text>
                  <Text style={[styles.tierSub, { color: textSecondary }]}>{TIER_META.essential.subtitle}</Text>
                </View>
                <Text style={[styles.tierPrice, { color: colors.text }]}>{tierPrice('essential', selectedBilling)}</Text>
              </View>
              {TIER_META.essential.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Check size={16} color={colors.primary} />
                  <Text style={[styles.featureText, { color: textSecondary }]}>{f}</Text>
                </View>
              ))}
            </Pressable>

            {/* Voice & AI tier — Coming in v1.3.1. Non-interactive, matches Advanced AI card pattern. */}
            <View style={[styles.tierCard, { backgroundColor: colors.surface, borderColor: `${colors.border}AA` }]}>
              <View style={styles.tierHeader}>
                <View style={[styles.tierIconBadge, { backgroundColor: `${colors.warning}22` }]}>
                  <Mic size={18} color={colors.warning} />
                </View>
                <View style={styles.tierHeadTextWrap}>
                  <Text style={[styles.tierTitle, { color: colors.text }]}>{TIER_META.voice.title}</Text>
                  <Text style={[styles.tierSub, { color: textSecondary }]}>{TIER_META.voice.subtitle}</Text>
                </View>
                <View style={[styles.comingSoonBadge, { backgroundColor: `${colors.warning}22`, borderColor: colors.warning }]}>
                  <Text style={[styles.comingSoonText, { color: colors.warning }]}>{PRICING.voice.comingSoonLabel}</Text>
                </View>
              </View>
              {TIER_META.voice.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Cloud size={16} color={colors.warning} />
                  <Text style={[styles.featureText, { color: textSecondary }]}>{f}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.tierCard, { backgroundColor: colors.surface, borderColor: `${colors.border}AA` }]}>
              <View style={styles.tierHeader}>
                <View style={[styles.tierIconBadge, { backgroundColor: `${colors.warning}22` }]}> 
                  <Sparkles size={18} color={colors.warning} />
                </View>
                <View style={styles.tierHeadTextWrap}>
                  <Text style={[styles.tierTitle, { color: colors.text }]}>Advanced AI</Text>
                  <Text style={[styles.tierSub, { color: textSecondary }]}>Next generation AI tools for gardeners</Text>
                </View>
                <View style={[styles.comingSoonBadge, { backgroundColor: `${colors.warning}22`, borderColor: colors.warning }]}>
                  <Text style={[styles.comingSoonText, { color: colors.warning }]}>Coming Soon</Text>
                </View>
              </View>
              {ADVANCED_AI_FEATURES.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Cloud size={16} color={colors.warning} />
                  <Text style={[styles.featureText, { color: textSecondary }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          <Pressable
            style={[
              styles.ctaBtn,
              { backgroundColor: isResubscribeBlocked ? colors.border : colors.primary },
            ]}
            onPress={handlePurchase}
            disabled={isResubscribeBlocked || isLoading || retrying || loadingPackageId !== null}
          >
            {(loadingPackageId && loadingPackageId !== 'restore') || isLoading || retrying ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={[styles.ctaText, { color: colors.primaryText }]}>
                {isResubscribeBlocked ? 'Not Available Yet' : 'Continue with Essential'}
              </Text>
            )}
          </Pressable>

          <Pressable style={styles.restoreBtn} onPress={handleRestore} disabled={loadingPackageId !== null}>
            {loadingPackageId === 'restore' ? (
              <ActivityIndicator size="small" color={textSecondary} />
            ) : (
              <Text style={[styles.restoreText, { color: textSecondary }]}>Restore Purchases</Text>
            )}
          </Pressable>

          <View style={styles.linkRow}>
            <Pressable onPress={() => openExternal(PRIVACY_URL, 'Privacy Policy')}>
              <Text style={[styles.linkText, { color: colors.primary }]}>Privacy</Text>
            </Pressable>
            <Text style={[styles.linkDivider, { color: textSecondary }]}>•</Text>
            <Pressable onPress={() => openExternal(TERMS_URL, 'Terms of Service')}>
              <Text style={[styles.linkText, { color: colors.primary }]}>Terms</Text>
            </Pressable>
            <Text style={[styles.linkDivider, { color: textSecondary }]}>•</Text>
            <Pressable onPress={() => openExternal(DELETE_RESTORE_URL, 'Delete and Restore Purchases Statement')}>
              <Text style={[styles.linkText, { color: colors.primary }]}>Delete & Restore</Text>
            </Pressable>
          </View>

          <View style={styles.voiceCostNoteWrap}>
            <Volume2 size={14} color={textSecondary} />
            <Text style={[styles.legal, { color: textSecondary }]}>
              Voice & AI entry features are coming in v1.3.1. Subscribe to Essential now and upgrade when it launches.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    padding: 8,
  },
  scroll: { padding: 20, paddingTop: 54, paddingBottom: 28 },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  heroSub: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  billingRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 6,
    marginBottom: 14,
  },
  billingBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  billingText: { fontSize: 14, fontWeight: '700' },
  blockedBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  blockedText: { fontSize: 13, lineHeight: 19 },
  loadingRow: {
    minHeight: 72,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loadingText: { fontSize: 13 },
  retryBtn: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryBtnText: { fontSize: 13, fontWeight: '600' },
  tierList: { gap: 10, marginBottom: 14 },
  tierCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 9,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tierIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierHeadTextWrap: { flex: 1 },
  tierTitle: { fontSize: 16, fontWeight: '700' },
  tierSub: { fontSize: 12, marginTop: 1 },
  tierPrice: { fontSize: 13, fontWeight: '700' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 12, flex: 1 },
  comingSoonBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  comingSoonText: { fontSize: 11, fontWeight: '700' },
  ctaBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  ctaText: { fontSize: 16, fontWeight: '700' },
  restoreBtn: { alignItems: 'center', paddingVertical: 10 },
  restoreText: { fontSize: 14, textDecorationLine: 'underline' },
  linkRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  linkDivider: { fontSize: 12 },
  voiceCostNoteWrap: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 8,
  },
  legal: {
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    flexShrink: 1,
  },
});
