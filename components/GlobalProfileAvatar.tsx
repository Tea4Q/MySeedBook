/**
 * GlobalProfileAvatar.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable circular avatar component.
 * Shows the user's avatar_url image, or their initials if no image is set.
 * Optional onPress opens an action sheet to choose gallery or camera.
 *
 * Copy this file into any Expo app alongside globalProfileManager.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { Camera } from 'lucide-react-native';
import { globalProfileManager } from '@/lib/globalProfileManager';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GlobalProfileAvatarProps {
  /** Supabase user ID — required for upload */
  userId?: string | null;
  /** Current avatar URL (from profiles.avatar_url) */
  avatarUrl?: string | null;
  /** Display name or email for initials fallback */
  displayName?: string | null;
  /** Avatar diameter in pixels */
  size?: number;
  /** Allow tapping to change avatar. Requires userId. */
  editable?: boolean;
  /** Called with the new public URL after a successful upload */
  onAvatarChange?: (newUrl: string) => void;
  /** Extra style overrides on the outer container */
  style?: object;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GlobalProfileAvatar({
  userId,
  avatarUrl,
  displayName,
  size = 72,
  editable = false,
  onAvatarChange,
  style,
}: GlobalProfileAvatarProps) {
  const [uploading, setUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);

  const initials = React.useMemo(() => {
    if (!displayName) return '?';
    return displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }, [displayName]);

  const displayUri = localUri ?? avatarUrl;

  const handlePress = () => {
    if (!editable || !userId) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library', 'Remove Photo'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) uploadFrom('camera');
          if (idx === 2) uploadFrom('gallery');
          if (idx === 3) removeAvatar();
        }
      );
    } else {
      Alert.alert('Profile Photo', 'Choose an option', [
        { text: 'Take Photo', onPress: () => uploadFrom('camera') },
        { text: 'Choose from Library', onPress: () => uploadFrom('gallery') },
        { text: 'Remove Photo', style: 'destructive', onPress: removeAvatar },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const uploadFrom = async (source: 'camera' | 'gallery') => {
    if (!userId) return;
    setUploading(true);
    try {
      const newUrl = await globalProfileManager.pickAndUploadAvatar(userId, source);
      if (newUrl) {
        setLocalUri(newUrl);
        onAvatarChange?.(newUrl);
      }
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!userId) return;
    setUploading(true);
    try {
      await globalProfileManager.removeAvatar(userId);
      setLocalUri(null);
      onAvatarChange?.('');
    } finally {
      setUploading(false);
    }
  };

  const borderRadius = size / 2;
  const badgeSize = Math.max(20, size * 0.28);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        { width: size, height: size, borderRadius },
        pressed && editable ? { opacity: 0.8 } : undefined,
        style,
      ]}
      disabled={!editable}
      accessibilityLabel={editable ? 'Change profile photo' : 'Profile photo'}
      accessibilityRole="button"
    >
      {displayUri ? (
        <Image
          source={{ uri: displayUri }}
          style={[styles.image, { width: size, height: size, borderRadius }]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.initialsContainer,
            { width: size, height: size, borderRadius, backgroundColor: '#336633' },
          ]}
        >
          <Text
            style={[styles.initials, { fontSize: size * 0.35 }]}
            numberOfLines={1}
          >
            {initials}
          </Text>
        </View>
      )}

      {/* Overlay while uploading */}
      {uploading && (
        <View style={[styles.overlay, { borderRadius }]}>
          <ActivityIndicator color="#fff" />
        </View>
      )}

      {/* Camera badge when editable */}
      {editable && !uploading && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        >
          <Camera size={badgeSize * 0.56} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    // borderRadius set dynamically
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    backgroundColor: '#336633',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
