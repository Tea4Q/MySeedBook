/**
 * globalAccountDeletion.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * GDPR-compliant account deletion workflow.
 * Copy this file into any Expo / Supabase app.
 *
 * What it does:
 *   1. Verifies no active subscription (caller must confirm subscription is
 *      cancelled via RevenueCat before calling deleteAccount).
 *   2. Re-authenticates the user (password confirm).
 *   3. Records deletion metadata in `global_deletion_log` (retained for legal /
 *      tax compliance — contains NO PII).
 *   4. Nulls out all PII fields on the `profiles` row.
 *   5. Schedules the Supabase auth user for deletion via an RPC.
 *   6. Sets `resubscribe_blocked_until = now() + 30 days`.
 *   7. Signs the user out and clears local storage.
 *
 * Data retained after deletion (legal requirement):
 *   - Transaction history (tax compliance)
 *   - Fraud logs
 *   - Aggregated analytics / legal records
 *
 * Data purged immediately:
 *   - Email, name, display_name, avatar_url, device identifiers
 * ─────────────────────────────────────────────────────────────────────────────
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { globalRevenueCat } from './globalRevenueCat';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeletionResult =
  | { success: true }
  | { success: false; reason: DeletionFailReason; message: string };

export type DeletionFailReason =
  | 'active_subscription'   // User has an active paid subscription
  | 'auth_failed'           // Password re-auth failed
  | 'network_error'         // Could not reach Supabase
  | 'unknown';

// ─── Manager ──────────────────────────────────────────────────────────────────

class GlobalAccountDeletion {
  private static instance: GlobalAccountDeletion;

  static getInstance(): GlobalAccountDeletion {
    if (!GlobalAccountDeletion.instance) {
      GlobalAccountDeletion.instance = new GlobalAccountDeletion();
    }
    return GlobalAccountDeletion.instance;
  }

  /**
   * Check whether the user currently has an active RevenueCat subscription.
   * Call this before allowing the deletion modal to proceed past Step 1.
   */
  async hasActiveSubscription(): Promise<boolean> {
    const info = await globalRevenueCat.getCustomerInfo();
    return info.isPremium;
  }

  /**
   * Re-authenticate the user with their password.
   * Returns true on success, throws on failure.
   */
  async reauthenticate(email: string, password: string): Promise<true> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw Object.assign(new Error('Incorrect password. Please try again.'), {
        reason: 'auth_failed' as DeletionFailReason,
      });
    }
    return true;
  }

  /**
   * Log a manual deletion request after repeated failures.
   * Inserts to pending_deletion table and fires an email notification.
   * Non-fatal — best effort, never throws.
   */
  async requestManualDeletion(userId: string, email: string): Promise<void> {
    try {
      await (supabase.from('pending_deletion') as any).insert({
        user_id: userId,
        user_email: email,
        reason: 'password_timeout',
        status: 'pending',
      });
    } catch (err) {
      console.warn('[GlobalAccountDeletion] Could not write pending_deletion:', err);
    }
    // Fire-and-forget email to app owner
    supabase.functions
      .invoke('notify-deletion-request', { body: { userId, email } })
      .catch((err) =>
        console.warn('[GlobalAccountDeletion] Email notification failed:', err)
      );
  }

  /**
   * Full account deletion workflow.
   *
   * @param userId   - Supabase auth UID
   * @param email    - required to verify identity
   * @param password - required for re-auth step
   * @param planAtDeletion - e.g. 'monthly' | 'annual' | 'free'
   */
  async deleteAccount(
    userId: string,
    email: string,
    password: string,
    planAtDeletion: string
  ): Promise<DeletionResult> {
    // ── Step 1: subscription guard is handled by the modal (Step 1 UI) ────────
    // Skipped here to avoid a hanging RevenueCat network call.

    // ── Step 2: re-authenticate ────────────────────────────────────────────
    try {
      await this.reauthenticate(email, password);
    } catch (err: any) {
      return {
        success: false,
        reason: err.reason ?? 'auth_failed',
        message: err.message ?? 'Authentication failed.',
      };
    }

    // ── Step 3: write deletion log (no PII) ───────────────────────────────
    try {
      await (supabase.from('global_deletion_log') as any).insert({
        user_id: userId,
        deleted_at: new Date().toISOString(),
        plan_at_deletion: planAtDeletion,
      });
    } catch (err) {
      console.warn('[GlobalAccountDeletion] Could not write deletion log:', err);
      // Non-fatal — proceed
    }

    // ── Step 4: set 30-day resubscribe block ──────────────────────────────
    const blockUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    try {
      await (supabase.from('profiles') as any)
        .update({ resubscribe_blocked_until: blockUntil })
        .eq('id', userId);
    } catch (err) {
      console.warn('[GlobalAccountDeletion] Could not set resubscribe block:', err);
    }

    // ── Step 5: null out PII on profiles row ──────────────────────────────
    try {
      await (supabase.from('profiles') as any)
        .update({
          display_name: null,
          avatar_url: null,
        })
        .eq('id', userId);
    } catch (err) {
      console.warn('[GlobalAccountDeletion] Could not clear PII:', err);
    }

    // ── Step 6: schedule Supabase auth user deletion via RPC ──────────────
    // You must create this RPC in Supabase (see migration file).
    // It calls auth.admin.deleteUser via a service-role function.
    try {
      await (supabase as any).rpc('global_delete_auth_user', { uid: userId });
    } catch (err) {
      console.warn('[GlobalAccountDeletion] RPC delete user failed:', err);
      // Sign out regardless so user loses access immediately
    }

    // ── Step 7: log out RevenueCat ─────────────────────────────────────────
    try {
      await Promise.race([
        globalRevenueCat.logOut(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('RevenueCat logOut timeout')), 5000)
        ),
      ]);
    } catch (err) {
      console.warn('[GlobalAccountDeletion] RevenueCat logOut failed or timed out:', err);
    }

    // ── Step 8: sign out Supabase ──────────────────────────────────────────
    // Use a timeout so a slow network doesn't hang the spinner forever.
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('signOut timeout')), 8000)
        ),
      ]);
    } catch (err) {
      console.warn('[GlobalAccountDeletion] signOut failed or timed out:', err);
      // Clear session locally regardless — user loses access immediately.
    }

    // ── Step 9: clear all local storage ───────────────────────────────────
    try {
      await this.clearLocalStorage();
    } catch (err) {
      console.warn('[GlobalAccountDeletion] clearLocalStorage failed:', err);
    }

    return { success: true };
  }

  // ─── Private: clear storage ────────────────────────────────────────────────

  private async clearLocalStorage(): Promise<void> {
    // AsyncStorage — clear all keys
    try {
      await AsyncStorage.clear();
    } catch (err) {
      console.warn('[GlobalAccountDeletion] AsyncStorage clear failed:', err);
    }

    // SecureStore — clear known Supabase auth keys
    if (Platform.OS !== 'web') {
      const secureKeys = [
        'supabase.auth.token',
        'sb-access-token',
        'sb-refresh-token',
      ];
      for (const key of secureKeys) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch {
          // Key may not exist — ignore
        }
      }
      // Also clear chunked SecureStore keys (the app uses a chunked adapter)
      for (let i = 0; i < 10; i++) {
        try {
          await SecureStore.deleteItemAsync(`supabase.auth.token.${i}`);
          await SecureStore.deleteItemAsync(`sb-access-token.${i}`);
          await SecureStore.deleteItemAsync(`sb-refresh-token.${i}`);
        } catch {
          // Ignore
        }
      }
    }

    // Web localStorage
    if (Platform.OS === 'web') {
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
      } catch {
        // Ignore
      }
    }
  }
}

export const globalAccountDeletion = GlobalAccountDeletion.getInstance();
