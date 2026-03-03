/**
 * GlobalSubscriptionModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Universal RevenueCat-powered paywall modal.
 * Works on iOS, Android, and Web (graceful stub on web).
 * Copy this file into any Expo app alongside globalSubscriptionManager.ts.
 *
 * Props:
 *   visible  - controls modal visibility
 *   onClose  - called when user dismisses the modal
 *   feature  - optional feature name shown in the hero header
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Crown, Check, X, Star, Leaf, Image as ImageIcon, BarChart2, Database, Headphones, RefreshCw } from 'lucide-react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { useTheme } from '@/lib/theme';
import { useGlobalSubscription } from '@/lib/globalSubscriptionManager';
import { globalRevenueCat } from '@/lib/globalRevenueCat';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GlobalSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
}

// ─── Feature list ─────────────────────────────────────────────────────────────

const PREMIUM_FEATURES = [
  { icon: Leaf, title: 'Unlimited Seeds', desc: 'Add as many seeds as you want' },
  { icon: Star, title: 'Unlimited Suppliers', desc: 'No limit on supplier records' },
  { icon: ImageIcon, title: 'Unlimited Photos', desc: 'Attach photos to every entry' },
  { icon: BarChart2, title: 'Advanced Calendar', desc: 'Full planting calendar features' },
  { icon: Database, title: 'Data Export', desc: 'Export your data any time' },
  { icon: Headphones, title: 'Priority Support', desc: 'Get help faster' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function GlobalSubscriptionModal({
  visible,
  onClose,
  feature,
}: GlobalSubscriptionModalProps) {
  const { colors } = useTheme();
  const { purchase, restore, refresh, offerings, isLoading, isResubscribeBlocked, resubscribeAllowedFrom } =
    useGlobalSubscription();

  const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [offersError, setOffersError] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Populate packages whenever offerings arrive from context
  useEffect(() => {
    if (!visible) return;
    if (offerings?.current?.availablePackages?.length) {
      const pkgs = offerings.current.availablePackages;
      setPackages(pkgs);
      setOffersError(false);
      if (!selectedId) {
        const annual = pkgs.find((p) =>
          p.packageType === 'ANNUAL' ||
          p.product.identifier.toLowerCase().includes('yearly') ||
          p.product.identifier.toLowerCase().includes('annual')
        );
        setSelectedId(annual?.identifier ?? pkgs[0]?.identifier ?? null);
      }
    }
  }, [visible, offerings, selectedId]);

  // Once the context finishes loading, check if we still have no packages
  useEffect(() => {
    if (!visible) return;
    if (!isLoading && packages.length === 0) {
      setOffersError(true);
    }
  }, [visible, isLoading, packages.length]);

  const handleRetry = useCallback(async () => {
    setOffersError(false);
    setRetrying(true);
    try {
      const off = await globalRevenueCat.getOfferings();
      if (off?.current?.availablePackages?.length) {
        const pkgs = off.current.availablePackages;
        setPackages(pkgs);
        const annual = pkgs.find((p) =>
          p.packageType === 'ANNUAL' ||
          p.product.identifier.toLowerCase().includes('yearly') ||
          p.product.identifier.toLowerCase().includes('annual')
        );
        setSelectedId(annual?.identifier ?? pkgs[0]?.identifier ?? null);
      } else {
        setOffersError(true);
      }
    } catch {
      setOffersError(true);
    } finally {
      setRetrying(false);
    }
  }, []);

  const handlePurchase = async () => {
    const pkg = packages.find((p) => p.identifier === selectedId);
    if (!pkg) return;
    setLoadingPackageId(pkg.identifier);
    try {
      const success = await purchase(pkg);
      if (success) {
        await refresh();
        onClose();
        Alert.alert(
          '🌱 Welcome to Premium!',
          'Thank you for upgrading! You now have full access to all premium features.'
        );
      }
    } finally {
      setLoadingPackageId(null);
    }
  };

  const handleRestore = async () => {
    setLoadingPackageId('restore');
    const restored = await restore();
    setLoadingPackageId(null);
    if (restored) {
      Alert.alert('✅ Restored', 'Your premium subscription has been restored!', [
        { text: 'OK', onPress: onClose },
      ]);
    } else {
      Alert.alert('No Purchase Found', 'We could not find a previous purchase to restore.');
    }
  };

  const textSecondary = colors.text + '99';

  const renderPrice = (pkg: PurchasesPackage) => {
    const price = pkg.product.priceString;
    const isAnnual =
      pkg.packageType === 'ANNUAL' ||
      pkg.product.identifier.toLowerCase().includes('yearly') ||
      pkg.product.identifier.toLowerCase().includes('annual');
    return isAnnual ? `${price} / year` : `${price} / month`;
  };

  const renderSaving = (pkg: PurchasesPackage) => {
    const isAnnual =
      pkg.packageType === 'ANNUAL' ||
      pkg.product.identifier.toLowerCase().includes('yearly') ||
      pkg.product.identifier.toLowerCase().includes('annual');
    if (!isAnnual) return null;
    // Try to find monthly price for comparison
    const monthly = packages.find(
      (p) =>
        p.packageType === 'MONTHLY' ||
        p.product.identifier.toLowerCase().includes('monthly')
    );
    if (!monthly) return null;
    const annualEquivMonthly = pkg.product.price / 12;
    const saving = Math.round((1 - annualEquivMonthly / monthly.product.price) * 100);
    if (saving > 0) return `Save ${saving}%`;
    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Close button */}
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={16}>
          <X size={22} color={colors.text} />
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <Crown size={48} color={colors.primary} />
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              {feature ? `Unlock ${feature}` : 'Upgrade to Premium'}
            </Text>
            <Text style={[styles.heroSub, { color: textSecondary }]}>
              Full access to every feature — unlimited seeds, suppliers, and more.
            </Text>
          </View>

          {/* Resubscribe block */}
          {isResubscribeBlocked && (
            <View style={[styles.blockedBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.blockedText, { color: colors.text }]}>
                You recently deleted your account. New subscriptions are available from{' '}
                {resubscribeAllowedFrom
                  ? new Date(resubscribeAllowedFrom).toLocaleDateString()
                  : 'soon'}
                .
              </Text>
            </View>
          )}

          {/* Package selector */}
          {(isLoading || retrying) && packages.length === 0 ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.loadingText, { color: textSecondary }]}>
                Loading plans…
              </Text>
            </View>
          ) : offersError || (!isLoading && !retrying && packages.length === 0) ? (
            <View style={styles.loadingRow}>
              <Text style={[styles.loadingText, { color: textSecondary, textAlign: 'center', marginBottom: 12 }]}>
                Unable to load subscription plans.{'\n'}Please check your connection and try again.
              </Text>
              <Pressable
                style={[styles.retryBtn, { borderColor: colors.primary }]}
                onPress={handleRetry}
              >
                <RefreshCw size={16} color={colors.primary} />
                <Text style={[styles.retryBtnText, { color: colors.primary }]}>Try Again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.plans}>
              {packages.map((pkg) => {
                const isSelected = pkg.identifier === selectedId;
                const saving = renderSaving(pkg);
                return (
                  <Pressable
                    key={pkg.identifier}
                    style={[
                      styles.planCard,
                      { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: colors.surface },
                      isSelected && { borderWidth: 2 },
                    ]}
                    onPress={() => setSelectedId(pkg.identifier)}
                  >
                    <View style={styles.planLeft}>
                      <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border }]}>
                        {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                      </View>
                      <View>
                        <Text style={[styles.planName, { color: colors.text }]}>
                          {pkg.product.title || (pkg.packageType === 'ANNUAL' ? 'Annual' : 'Monthly')}
                        </Text>
                        <Text style={[styles.planPrice, { color: textSecondary }]}>
                          {renderPrice(pkg)}
                        </Text>
                      </View>
                    </View>
                    {saving && (
                      <View style={[styles.savingBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.savingText}>{saving}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Feature list */}
          <View style={[styles.featureList, { backgroundColor: colors.surface }]}>
            {PREMIUM_FEATURES.map(({ icon: Icon, title, desc }) => (
              <View key={title} style={styles.featureRow}>
                <Check size={18} color={colors.primary} strokeWidth={2.5} />
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
                  <Text style={[styles.featureDesc, { color: textSecondary }]}>{desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* CTA */}
          <Pressable
            style={[
              styles.ctaBtn,
              { backgroundColor: isResubscribeBlocked || !selectedId ? colors.border : colors.primary },
            ]}
            onPress={handlePurchase}
            disabled={
              isResubscribeBlocked ||
              !selectedId ||
              loadingPackageId !== null
            }
          >
            {loadingPackageId && loadingPackageId !== 'restore' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>
                {isResubscribeBlocked ? 'Not Available Yet' : 'Start Premium'}
              </Text>
            )}
          </Pressable>

          {/* Restore */}
          <Pressable style={styles.restoreBtn} onPress={handleRestore} disabled={loadingPackageId !== null}>
            {loadingPackageId === 'restore' ? (
              <ActivityIndicator size="small" color={textSecondary} />
            ) : (
              <Text style={[styles.restoreText, { color: textSecondary }]}>
                Restore Previous Purchase
              </Text>
            )}
          </Pressable>

          <Text style={[styles.legal, { color: textSecondary }]}>
            Payment charged to your {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} account.{'\n'}
            Subscription renews automatically. Cancel any time.{'\n'}
            Refunds available within {Platform.OS === 'ios' ? '15 days (annual) / 7 days (monthly)' : '15 days (annual) / 7 days (monthly)'}
            {' '}via {Platform.OS === 'ios' ? 'reportaproblem.apple.com' : 'Google Play'}.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  scroll: { padding: 24, paddingTop: 56 },
  hero: { alignItems: 'center', marginBottom: 24, gap: 8 },
  heroTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  heroSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  blockedBanner: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  blockedText: { fontSize: 14, lineHeight: 20 },
  loadingRow: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 80, paddingVertical: 16 },
  loadingText: { fontSize: 14 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  retryBtnText: { fontSize: 14, fontWeight: '600' },
  plans: { gap: 10, marginBottom: 20 },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  planName: { fontSize: 16, fontWeight: '600' },
  planPrice: { fontSize: 13, marginTop: 2 },
  savingBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  savingText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  featureList: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '600' },
  featureDesc: { fontSize: 12, marginTop: 1 },
  ctaBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  restoreBtn: { alignItems: 'center', paddingVertical: 10, marginBottom: 12 },
  restoreText: { fontSize: 14 },
  legal: { fontSize: 11, textAlign: 'center', lineHeight: 17, marginBottom: 24 },
});
