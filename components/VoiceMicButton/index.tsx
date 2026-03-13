import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Mic, MicOff } from 'lucide-react-native';
import { useGlobalSubscription } from '../../lib/globalSubscriptionManager';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import PremiumModal from '../PremiumModal';

interface VoiceMicButtonProps {
  onTranscript: (text: string) => void;
  /** Visual size variant: 'sm' | 'md' (default) | 'lg' */
  size?: 'sm' | 'md' | 'lg';
  style?: object;
}

/**
 * Premium-gated voice input button.
 *
 * - First tap: starts recording (pulsing red mic).
 * - Second tap: stops recording and begins Whisper transcription.
 * - On success: fires `onTranscript(text)` and returns to idle.
 * - Non-premium users see the PremiumModal paywall instead.
 */
export function VoiceMicButton({ onTranscript, size = 'md', style }: VoiceMicButtonProps) {
  const { isPremium } = useGlobalSubscription();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { status, transcript, error, startRecording, stopAndTranscribe, reset } =
    useVoiceInput();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation while recording
  useEffect(() => {
    if (status === 'recording') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
    pulseAnim.setValue(1);
  }, [status, pulseAnim]);

  // Fire callback once transcription is ready, then reset
  useEffect(() => {
    if (status === 'success' && transcript) {
      onTranscript(transcript);
      reset();
    }
  }, [status, transcript, onTranscript, reset]);

  const handlePress = async () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    if (status === 'recording') {
      await stopAndTranscribe();
    } else {
      await startRecording();
    }
  };

  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 30 : 22;
  const buttonSize = size === 'sm' ? 38 : size === 'lg' ? 58 : 48;
  const isRecording = status === 'recording';
  const isTranscribing = status === 'transcribing';

  return (
    <>
      <View style={[styles.container, style]}>
        <Animated.View
          style={isRecording ? { transform: [{ scale: pulseAnim }] } : undefined}
        >
          <Pressable
            onPress={handlePress}
            disabled={isTranscribing}
            style={[
              styles.button,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
                backgroundColor: isRecording ? '#ef4444' : '#2f9e44',
              },
              isTranscribing && styles.disabled,
            ]}
            accessibilityLabel={isRecording ? 'Stop recording' : 'Start voice input'}
            accessibilityRole="button"
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : isRecording ? (
              <MicOff size={iconSize} color="#fff" />
            ) : (
              <Mic size={iconSize} color="#fff" />
            )}
          </Pressable>
        </Animated.View>

        <Text style={styles.label}>
          {isTranscribing
            ? 'Transcribing…'
            : isRecording
            ? 'Tap to stop'
            : isPremium
            ? 'Voice input'
            : 'Voice (Premium)'}
        </Text>

        {status === 'error' && error ? (
          <Text style={styles.errorText} numberOfLines={2}>
            {error}
          </Text>
        ) : null}
      </View>

      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  disabled: {
    opacity: 0.7,
  },
  label: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 10,
    color: '#ef4444',
    textAlign: 'center',
    maxWidth: 110,
  },
});

export default VoiceMicButton;
