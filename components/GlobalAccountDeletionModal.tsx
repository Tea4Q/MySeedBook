/**
 * GlobalAccountDeletionModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * GDPR-compliant 4-step account deletion modal.
 * Copy this file into any Expo / Supabase app alongside globalAccountDeletion.ts.
 *
 * Steps:
 *   1. Subscription check — blocks if user has an active paid subscription
 *   2. Password re-authentication
 *   3. Scrollable warning (what is deleted vs retained, immediate access loss)
 *   4. Type "DELETE" to confirm — triggers full deletion workflow
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AlertTriangle, CheckCircle, CreditCard, Lock, Trash2, X, XCircle } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { globalAccountDeletion } from '@/lib/globalAccountDeletion';
import { useGlobalSubscription } from '@/lib/globalSubscriptionManager';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GlobalAccountDeletionModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3 | 4;

// ─── Retained / deleted data lists ────────────────────────────────────────────

const DELETED_DATA = [
  'Email address',
  'Display name',
  'Profile photo',
  'Device identifiers',
  'Personal preferences',
];

const RETAINED_DATA = [
  'Transaction history (tax compliance)',
  'Fraud prevention logs',
  'Aggregated analytics',
  'Legal records',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function GlobalAccountDeletionModal({
  visible,
  onClose,
}: GlobalAccountDeletionModalProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isPremium, planType, openManageSubscriptions } = useGlobalSubscription();

  const [step, setStep] = useState<Step>(1);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      setStep(isPremium ? 1 : 2);
      setPassword('');
      setPasswordError('');
      setConfirmText('');
      setLoading(false);
    }
  }, [visible, isPremium]);

  const textSecondary = colors.text + '99';
  const errorColor = '#EF4444';
  const warningColor = '#F59E0B';

  // ─── Step 2: password auth ─────────────────────────────────────────────────

  const handlePasswordConfirm = async () => {
    if (!password.trim()) {
      setPasswordError('Please enter your password.');
      return;
    }
    setPasswordError('');
    setLoading(true);
    try {
      await globalAccountDeletion.reauthenticate(user?.email ?? '', password);
      setStep(3);
    } catch (err: any) {
      setPasswordError(err.message ?? 'Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 4: final deletion ────────────────────────────────────────────────

  const handleFinalDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setLoading(true);
    try {
      const result = await globalAccountDeletion.deleteAccount(
        user?.id ?? '',
        user?.email ?? '',
        password,
        planType ?? 'free'
      );

      if (!result.success) {
        if (result.reason === 'active_subscription') {
          setStep(1);
          Alert.alert('Active Subscription', result.message);
        } else {
          Alert.alert('Deletion Failed', result.message);
        }
        return;
      }

      // Success — auth.tsx will detect the sign-out and navigate to /auth
      // Show a brief farewell message first
      Alert.alert(
        'Account Deleted',
        'Your account has been deleted. You have been signed out immediately. Thank you for using MySeedBook.',
        [{ text: 'OK', onPress: onClose }]
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Step renderer ─────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconCircle, { backgroundColor: warningColor + '22' }]}>
        <CreditCard size={32} color={warningColor} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Active Subscription</Text>
      <Text style={[styles.stepBody, { color: textSecondary }]}>
        You currently have an active{' '}
        <Text style={{ fontWeight: '700', color: colors.text }}>
          {planType === 'annual' ? 'Annual' : 'Monthly'} Premium
        </Text>{' '}
        subscription.
        {'\n\n'}
        You must <Text style={{ fontWeight: '700', color: errorColor }}>cancel your subscription first</Text> before deleting your account. Deleting your account does{' '}
        <Text style={{ fontWeight: '700' }}>not</Text> cancel your subscription — this prevents billing chaos.
        {'\n\n'}
        After cancelling, return here to complete account deletion.
      </Text>
      <Pressable
        style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        onPress={openManageSubscriptions}
      >
        <Text style={styles.primaryBtnText}>Manage Subscription</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={onClose}>
        <Text style={[styles.secondaryBtnText, { color: textSecondary }]}>Not Now</Text>
      </Pressable>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primary + '22' }]}>
        <Lock size={32} color={colors.primary} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Confirm Your Identity</Text>
      <Text style={[styles.stepBody, { color: textSecondary }]}>
        Enter your password to confirm it&apos;s you before we proceed.
      </Text>
      <View style={[styles.inputWrap, { borderColor: passwordError ? errorColor : colors.border, backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Your password"
          placeholderTextColor={textSecondary}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
          autoComplete="current-password"
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handlePasswordConfirm}
        />
        <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={12}>
          <Text style={{ color: textSecondary, fontSize: 13 }}>
            {showPassword ? 'Hide' : 'Show'}
          </Text>
        </Pressable>
      </View>
      {!!passwordError && (
        <Text style={[styles.errorText, { color: errorColor }]}>{passwordError}</Text>
      )}
      <Pressable
        style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
        onPress={handlePasswordConfirm}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Confirm</Text>
        )}
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={onClose} disabled={loading}>
        <Text style={[styles.secondaryBtnText, { color: textSecondary }]}>Cancel</Text>
      </Pressable>
    </View>
  );

  const renderStep3 = () => (
    <>
      <View style={[styles.iconCircle, { backgroundColor: errorColor + '22', alignSelf: 'center', marginBottom: 12 }]}>
        <AlertTriangle size={32} color={errorColor} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.text, textAlign: 'center', marginBottom: 4 }]}>
        Before You Go
      </Text>
      <Text style={[styles.stepBody, { color: textSecondary, textAlign: 'center', marginBottom: 16 }]}>
        Please read this carefully. This action is permanent.
      </Text>

      {/* Immediate access loss */}
      <View style={[styles.alertBox, { backgroundColor: errorColor + '18', borderColor: errorColor + '44' }]}>
        <XCircle size={18} color={errorColor} />
        <Text style={[styles.alertText, { color: errorColor }]}>
          <Text style={{ fontWeight: '700' }}>Immediate access loss</Text> — you will be signed out the moment you confirm. All app access is revoked instantly and permanently.
        </Text>
      </View>

      {/* What is deleted */}
      <Text style={[styles.listHeader, { color: colors.text }]}>What will be deleted:</Text>
      {DELETED_DATA.map((item) => (
        <View key={item} style={styles.listRow}>
          <Trash2 size={14} color={errorColor} />
          <Text style={[styles.listItem, { color: textSecondary }]}>{item}</Text>
        </View>
      ))}

      {/* What is retained */}
      <Text style={[styles.listHeader, { color: colors.text, marginTop: 12 }]}>
        What is retained (legal requirement):
      </Text>
      {RETAINED_DATA.map((item) => (
        <View key={item} style={styles.listRow}>
          <CheckCircle size={14} color={colors.primary} />
          <Text style={[styles.listItem, { color: textSecondary }]}>{item}</Text>
        </View>
      ))}

      {/* Resubscribe cooldown */}
      <View style={[styles.alertBox, { backgroundColor: warningColor + '18', borderColor: warningColor + '44', marginTop: 12 }]}>
        <AlertTriangle size={18} color={warningColor} />
        <Text style={[styles.alertText, { color: colors.text }]}>
          You will not be able to create a new subscription for{' '}
          <Text style={{ fontWeight: '700' }}>30 days</Text> after deletion.
        </Text>
      </View>

      <Pressable
        style={[styles.primaryBtn, { backgroundColor: errorColor, marginTop: 20 }]}
        onPress={() => setStep(4)}
      >
        <Text style={styles.primaryBtnText}>I Understand — Continue</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={onClose}>
        <Text style={[styles.secondaryBtnText, { color: textSecondary }]}>Cancel</Text>
      </Pressable>
    </>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <View style={[styles.iconCircle, { backgroundColor: errorColor + '22' }]}>
        <Trash2 size={32} color={errorColor} />
      </View>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Final Confirmation</Text>
      <Text style={[styles.stepBody, { color: textSecondary }]}>
        Type{' '}
        <Text style={{ fontWeight: '800', color: errorColor, letterSpacing: 1 }}>DELETE</Text>
        {' '}below and press the button to permanently delete your account.
      </Text>
      <View style={[
        styles.inputWrap,
        { borderColor: confirmText === 'DELETE' ? errorColor : colors.border, backgroundColor: colors.surface }
      ]}>
        <TextInput
          style={[styles.input, { color: colors.text, letterSpacing: 1 }]}
          placeholder="Type DELETE to confirm"
          placeholderTextColor={textSecondary}
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
          returnKeyType="done"
        />
      </View>
      <Pressable
        style={[
          styles.primaryBtn,
          {
            backgroundColor: confirmText === 'DELETE' && !loading ? errorColor : colors.border,
          },
        ]}
        onPress={handleFinalDelete}
        disabled={confirmText !== 'DELETE' || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Delete My Account</Text>
        )}
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={() => setStep(3)} disabled={loading}>
        <Text style={[styles.secondaryBtnText, { color: textSecondary }]}>Go Back</Text>
      </Pressable>
    </View>
  );

  // ─── Step labels ───────────────────────────────────────────────────────────

  const steps: Step[] = isPremium ? [1, 2, 3, 4] : [2, 3, 4];
  const currentStepIndex = steps.indexOf(step);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Delete Account</Text>
            <Pressable onPress={onClose} hitSlop={16}>
              <X size={22} color={colors.text} />
            </Pressable>
          </View>

          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor:
                        i <= currentStepIndex ? errorColor : colors.border,
                    },
                  ]}
                />
                {i < steps.length - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      { backgroundColor: i < currentStepIndex ? errorColor : colors.border },
                    ]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepLine: { flex: 1, height: 2, marginHorizontal: 4 },
  scrollContent: { padding: 24, paddingBottom: 48 },
  stepContent: { alignItems: 'center' },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  stepBody: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 4,
    width: '100%',
    marginBottom: 8,
  },
  input: { flex: 1, fontSize: 16, marginRight: 8 },
  errorText: { fontSize: 13, marginBottom: 12, alignSelf: 'flex-start' },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    width: '100%',
  },
  alertText: { flex: 1, fontSize: 14, lineHeight: 20 },
  listHeader: { fontSize: 15, fontWeight: '700', marginBottom: 8, alignSelf: 'flex-start' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5, width: '100%' },
  listItem: { fontSize: 14, flex: 1 },
  primaryBtn: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { paddingVertical: 12, alignItems: 'center', width: '100%' },
  secondaryBtnText: { fontSize: 15 },
});
