import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { Bell, Sun, Moon, LogOut, MessageSquare, Crown, Leaf, CreditCard, RefreshCw, Trash2, ChevronRight } from 'lucide-react-native';
import Constants from 'expo-constants';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { router } from 'expo-router';
import { useGlobalSubscription } from '@/lib/globalSubscriptionManager';
import { globalProfileManager, ProfileData } from '@/lib/globalProfileManager';
import GlobalProfileAvatar from '@/components/GlobalProfileAvatar';
import GlobalSubscriptionModal from '@/components/GlobalSubscriptionModal';
import GlobalAccountDeletionModal from '@/components/GlobalAccountDeletionModal';

export default function SettingsScreen() {
  const { theme, colors, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const {
    isPremium,
    planLabel,
    renewalDate,
    isEligibleForRefund,
    openManageSubscriptions,
    requestRefund,
    isResubscribeBlocked,
  } = useGlobalSubscription();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const appVersion = Constants.expoConfig?.version ?? '1.3.0';

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    const data = await globalProfileManager.getProfile(user.id);
    setProfile(data);
  }, [user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleThemeChange = (selectedTheme: 'light' | 'dark') => {
    setTheme(selectedTheme);
  };

  const handleSignOut = async () => {
    const confirmSignOut = async () => {
      try {
        setIsSigningOut(true);
        await signOut();
      } catch (err) {
        console.error('Sign out error:', err);
        if (Platform.OS === 'web') {
          window.alert('Failed to sign out. Please try again.');
        } else {
          Alert.alert('Error', 'Failed to sign out. Please try again.');
        }
      } finally {
        setIsSigningOut(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        await confirmSignOut();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: confirmSignOut },
      ]);
    }
  };

  const textSecondary = colors.text + '99';
  const errorColor = '#EF4444';

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════
            SECTION 1 — PROFILE
        ══════════════════════════════════════════════ */}
        <View style={[styles.sectionGroupHeader, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionGroupLabel, { color: textSecondary }]}>PROFILE</Text>
        </View>

        {/* Avatar + name row — tap to go to full profile screen */}
        <Pressable
          style={({ pressed }) => [
            styles.profileRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => router.push('/global-profile' as any)}
          android_ripple={{ color: colors.primary + '18' }}
        >
          <GlobalProfileAvatar
            userId={user?.id}
            avatarUrl={profile?.avatar_url}
            displayName={profile?.display_name ?? user?.email}
            size={56}
            editable={false}
          />
          <View style={styles.profileRowText}>
            <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
              {profile?.display_name ?? user?.email?.split('@')[0] ?? 'My Profile'}
            </Text>
            <Text style={[styles.profileEmail, { color: textSecondary }]} numberOfLines={1}>
              {user?.email ?? ''}
            </Text>
          </View>
          <ChevronRight size={18} color={textSecondary} />
        </Pressable>

        {/* Subscription card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Status row */}
          <View style={styles.subStatusRow}>
            {isPremium ? (
              <Crown size={22} color={colors.primary} />
            ) : (
              <Leaf size={22} color={textSecondary} />
            )}
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.subStatusTitle, { color: colors.text }]}>
                {isPremium ? planLabel : 'Free Plan'}
              </Text>
              {isPremium && renewalDate && (
                <Text style={[styles.subStatusSub, { color: textSecondary }]}>
                  Renews {new Date(renewalDate).toLocaleDateString()}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.tierBadge,
                { backgroundColor: isPremium ? colors.primary + '22' : colors.border },
              ]}
            >
              <Text style={[styles.tierBadgeText, { color: isPremium ? colors.primary : textSecondary }]}>
                {isPremium ? 'PREMIUM' : 'FREE'}
              </Text>
            </View>
          </View>

          {/* Upgrade button — shown only when free and not blocked */}
          {!isPremium && !isResubscribeBlocked && (
            <Pressable
              style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowUpgradeModal(true)}
            >
              <Crown size={16} color="#fff" />
              <Text style={styles.upgradeBtnText}>View Garden Plans</Text>
            </Pressable>
          )}

          {/* Resubscribe blocked */}
          {!isPremium && isResubscribeBlocked && (
            <View style={[styles.blockedBanner, { backgroundColor: colors.border }]}>
              <Text style={[styles.blockedText, { color: textSecondary }]}>
                New subscriptions available after account cooldown period ends.
              </Text>
            </View>
          )}

          {/* Manage / Refund — shown only when premium */}
          {isPremium && (
            <View style={styles.subActions}>
              <Pressable
                style={[styles.subActionBtn, { borderColor: colors.border }]}
                onPress={openManageSubscriptions}
              >
                <CreditCard size={16} color={colors.primary} />
                <Text style={[styles.subActionText, { color: colors.primary }]}>Manage</Text>
              </Pressable>

              {isEligibleForRefund && (
                <Pressable
                  style={[styles.subActionBtn, { borderColor: colors.border }]}
                  onPress={requestRefund}
                >
                  <RefreshCw size={16} color={textSecondary} />
                  <Text style={[styles.subActionText, { color: textSecondary }]}>Request Refund</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Delete account */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            style={({ pressed }) => [styles.dangerRow, pressed && { opacity: 0.7 }]}
            onPress={() => setShowDeleteModal(true)}
          >
            <Trash2 size={20} color={errorColor} />
            <Text style={[styles.dangerText, { color: errorColor }]}>Delete Account</Text>
          </Pressable>
        </View>

        {/* ══════════════════════════════════════════════
            SECTION 2 — APP SETTINGS
        ══════════════════════════════════════════════ */}
        <View style={[styles.sectionGroupHeader, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionGroupLabel, { color: textSecondary }]}>APP SETTINGS</Text>
        </View>

        {/* Appearance */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Appearance</Text>

          <View style={styles.themeToggleRow}>
            <Pressable
              style={[
                styles.themeOption,
                { borderColor: theme === 'light' ? colors.primary : colors.border },
                theme === 'light' && { backgroundColor: colors.primary + '18' },
              ]}
              onPress={() => handleThemeChange('light')}
            >
              <Sun size={20} color={theme === 'light' ? colors.primary : textSecondary} />
              <Text style={[styles.themeOptionText, { color: theme === 'light' ? colors.primary : colors.text }]}>
                Light
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.themeOption,
                { borderColor: theme === 'dark' ? colors.primary : colors.border },
                theme === 'dark' && { backgroundColor: colors.primary + '18' },
              ]}
              onPress={() => handleThemeChange('dark')}
            >
              <Moon size={20} color={theme === 'dark' ? colors.primary : textSecondary} />
              <Text style={[styles.themeOptionText, { color: theme === 'dark' ? colors.primary : colors.text }]}>
                Dark
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Notifications (coming soon) */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: 0.6 }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={20} color={textSecondary} />
              <Text style={[styles.settingLabel, { color: textSecondary }]}>Planting Reminders</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={[styles.comingSoonText, { color: textSecondary }]}>Coming Soon</Text>
            </View>
          </View>
        </View>

        {/* Help & Support */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Help & Support</Text>
          <Pressable
            style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/feedback')}
            android_ripple={{ color: colors.primary + '20' }}
          >
            <View style={styles.settingLeft}>
              <MessageSquare size={20} color={colors.primary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Send Feedback</Text>
            </View>
            <ChevronRight size={16} color={textSecondary} />
          </Pressable>
        </View>

        {/* About */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>About</Text>
          <Text style={[styles.versionText, { color: textSecondary }]}>
            Version {appVersion}
          </Text>
        </View>

        {/* Sign Out */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 32 }]}>
          <Pressable
            style={({ pressed }) => [styles.settingRow, pressed && { opacity: 0.7 }]}
            onPress={handleSignOut}
            disabled={isSigningOut}
            android_ripple={{ color: errorColor + '20' }}
          >
            <View style={styles.settingLeft}>
              <LogOut size={20} color={errorColor} />
              <Text style={[styles.settingLabel, { color: errorColor }]}>Sign Out</Text>
            </View>
            {isSigningOut && <ActivityIndicator size="small" color={errorColor} />}
          </Pressable>
        </View>
      </ScrollView>

      {/* Modals */}
      <GlobalSubscriptionModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
      <GlobalAccountDeletionModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionGroupHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 6,
  },
  sectionGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  profileRowText: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 1,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  subStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  subStatusSub: {
    fontSize: 12,
    marginTop: 1,
  },
  tierBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 12,
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  blockedBanner: {
    borderRadius: 8,
    padding: 10,
  },
  blockedText: {
    fontSize: 13,
    lineHeight: 18,
  },
  subActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  subActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 9,
    paddingVertical: 9,
  },
  subActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  dangerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  themeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
  },
  comingSoonBadge: {
    borderRadius: 6,
    backgroundColor: 'rgba(128,128,128,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  comingSoonText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  versionText: {
    fontSize: 14,
  },
});
