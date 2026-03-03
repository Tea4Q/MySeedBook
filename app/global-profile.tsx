/**
 * global-profile.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-screen Profile sub-screen.
 * Accessible from the Settings tab avatar / name tap.
 *
 * Shows:
 *   - Large editable avatar
 *   - Display name (inline edit)
 *   - Account tier badge (Free / Premium)
 *   - Plan type & renewal date (if Premium)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Check, Crown, Edit2, Leaf } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { useGlobalSubscription } from '@/lib/globalSubscriptionManager';
import { globalProfileManager, ProfileData } from '@/lib/globalProfileManager';
import GlobalProfileAvatar from '@/components/GlobalProfileAvatar';

export default function GlobalProfileScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isPremium, planLabel, renewalDate } = useGlobalSubscription();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const nameRef = useRef<TextInput>(null);

  // ─── Load profile ──────────────────────────────────────────────────────────

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const data = await globalProfileManager.getProfile(user.id);
    setProfile(data);
    setNameInput(data?.display_name ?? '');
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ─── Save name ─────────────────────────────────────────────────────────────

  const handleSaveName = async () => {
    if (!user?.id || !nameInput.trim()) return;
    setSavingName(true);
    const ok = await globalProfileManager.updateDisplayName(user.id, nameInput);
    setSavingName(false);
    if (ok) {
      setProfile((prev) => prev ? { ...prev, display_name: nameInput.trim() } : prev);
      setIsEditingName(false);
    } else {
      Alert.alert('Error', 'Could not save your name. Please try again.');
    }
  };

  // ─── Avatar change ─────────────────────────────────────────────────────────

  const handleAvatarChange = (newUrl: string) => {
    setProfile((prev) => prev ? { ...prev, avatar_url: newUrl || null } : prev);
  };

  const textSecondary = colors.text + '99';

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Nav bar */}
        <View style={[styles.navBar, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={16} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: colors.text }]}>Profile</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <GlobalProfileAvatar
              userId={user?.id}
              avatarUrl={profile?.avatar_url}
              displayName={profile?.display_name ?? user?.email}
              size={110}
              editable
              onAvatarChange={handleAvatarChange}
            />
          </View>

          {/* Display name */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: textSecondary }]}>Display Name</Text>

            {isEditingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  ref={nameRef}
                  style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Enter your name"
                  placeholderTextColor={textSecondary}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                  maxLength={60}
                />
                <Pressable
                  style={[styles.saveNameBtn, { backgroundColor: colors.primary, opacity: savingName ? 0.7 : 1 }]}
                  onPress={handleSaveName}
                  disabled={savingName}
                >
                  {savingName ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Check size={18} color="#fff" />
                  )}
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.nameRow} onPress={() => { setIsEditingName(true); setTimeout(() => nameRef.current?.focus(), 50); }}>
                <Text style={[styles.nameText, { color: profile?.display_name ? colors.text : textSecondary }]}>
                  {profile?.display_name || 'Tap to add name'}
                </Text>
                <Edit2 size={16} color={textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Email (read-only) */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: textSecondary }]}>Email</Text>
            <Text style={[styles.cardValue, { color: colors.text }]} numberOfLines={1}>
              {user?.email ?? '—'}
            </Text>
          </View>

          {/* Subscription status */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: textSecondary }]}>Subscription</Text>
            <View style={styles.tierRow}>
              {isPremium ? (
                <Crown size={20} color={colors.primary} />
              ) : (
                <Leaf size={20} color={textSecondary} />
              )}
              <Text style={[styles.tierText, { color: colors.text }]}>{planLabel}</Text>
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

            {isPremium && renewalDate && (
              <Text style={[styles.renewalText, { color: textSecondary }]}>
                Next renewal: {new Date(renewalDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  navTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: 20, gap: 14, paddingBottom: 48 },
  avatarSection: { alignItems: 'center', paddingVertical: 12 },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 6,
  },
  cardLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.7 },
  cardValue: { fontSize: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameText: { fontSize: 16, flex: 1, marginRight: 8 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  saveNameBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierText: { fontSize: 16, fontWeight: '600', flex: 1 },
  tierBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tierBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  renewalText: { fontSize: 13, marginTop: 4 },
});
