/**
 * globalProfileManager.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Universal profile avatar & display-name manager.
 * Uses expo-image-picker + expo-camera + Supabase Storage.
 * Copy this file into any Expo app that uses Supabase.
 *
 * Supabase requirements:
 *   - A `profiles` table with columns: id (uuid), avatar_url (text), display_name (text)
 *   - A Storage bucket named `avatars` (public read, auth write)
 *   - RLS: users can only update their own profile row
 *
 * Usage:
 *   import { globalProfileManager } from '@/lib/globalProfileManager';
 *   const url = await globalProfileManager.pickAndUploadAvatar(userId);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';
import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileData {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  resubscribe_blocked_until: string | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

/** Max size (px) for uploaded avatars — keeps storage usage low */
const AVATAR_MAX_PX = 400;
/** JPEG quality 0–1 */
const AVATAR_QUALITY = 0.85;
/** Supabase storage bucket name */
const BUCKET = 'avatars';

// ─── Manager ──────────────────────────────────────────────────────────────────

class GlobalProfileManager {
  private static instance: GlobalProfileManager;

  static getInstance(): GlobalProfileManager {
    if (!GlobalProfileManager.instance) {
      GlobalProfileManager.instance = new GlobalProfileManager();
    }
    return GlobalProfileManager.instance;
  }

  // ─── Fetch profile ─────────────────────────────────────────────────────────

  async getProfile(userId: string): Promise<ProfileData | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, resubscribe_blocked_until')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('[GlobalProfileManager] getProfile error:', error.message);
      return null;
    }
    return data as ProfileData;
  }

  // ─── Update display name ───────────────────────────────────────────────────

  async updateDisplayName(userId: string, displayName: string): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, display_name: displayName.trim() });

    if (error) {
      console.warn('[GlobalProfileManager] updateDisplayName error:', error.message);
      return false;
    }
    return true;
  }

  // ─── Avatar: pick from gallery ─────────────────────────────────────────────

  async pickFromGallery(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library in Settings.'
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: AVATAR_QUALITY,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return null;
    return result.assets[0].uri;
  }

  // ─── Avatar: take photo ────────────────────────────────────────────────────

  async takePhoto(): Promise<string | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow camera access in Settings.'
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: AVATAR_QUALITY,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return null;
    return result.assets[0].uri;
  }

  // ─── Full pick + upload flow ───────────────────────────────────────────────

  /**
   * Show action sheet → let user pick gallery or camera → resize → upload to
   * Supabase Storage → update profiles.avatar_url → return public URL.
   * Returns null if cancelled or failed.
   */
  async pickAndUploadAvatar(
    userId: string,
    source: 'gallery' | 'camera'
  ): Promise<string | null> {
    const uri =
      source === 'gallery'
        ? await this.pickFromGallery()
        : await this.takePhoto();

    if (!uri) return null;

    return await this.uploadAvatar(userId, uri);
  }

  // ─── Upload ────────────────────────────────────────────────────────────────

  async uploadAvatar(userId: string, localUri: string): Promise<string | null> {
    try {
      // Resize + compress
      const resized = await ImageManipulator.manipulateAsync(
        localUri,
        [{ resize: { width: AVATAR_MAX_PX, height: AVATAR_MAX_PX } }],
        { compress: AVATAR_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Convert to blob for upload
      const response = await fetch(resized.uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);

      const filePath = `${userId}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, uint8, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.warn('[GlobalProfileManager] upload error:', uploadError.message);
        Alert.alert('Upload Failed', 'Could not upload your photo. Please try again.');
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`; // cache-bust

      // Persist to profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ id: userId, avatar_url: publicUrl });

      if (updateError) {
        console.warn('[GlobalProfileManager] profile update error:', updateError.message);
      }

      return publicUrl;
    } catch (err: any) {
      console.error('[GlobalProfileManager] uploadAvatar error:', err);
      Alert.alert('Upload Failed', err?.message ?? 'Please try again.');
      return null;
    }
  }

  // ─── Remove avatar ─────────────────────────────────────────────────────────

  async removeAvatar(userId: string): Promise<boolean> {
    try {
      await supabase.storage.from(BUCKET).remove([`${userId}/avatar.jpg`]);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);
      return !error;
    } catch {
      return false;
    }
  }
}

export const globalProfileManager = GlobalProfileManager.getInstance();
