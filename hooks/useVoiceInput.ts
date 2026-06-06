import { useState, useRef } from 'react';
import { Platform } from 'react-native';
import { transcribeAudio } from '../lib/voice/transcription';

// expo-av is loaded lazily so that a missing native module doesn't crash the
// entire JS bundle when running in an APK that predates the expo-av install.
function getAudio(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-av').Audio;
  } catch {
    return null;
  }
}

export type VoiceInputStatus =
  | 'idle'
  | 'permission_denied'
  | 'recording'
  | 'transcribing'
  | 'success'
  | 'error';

export interface UseVoiceInputResult {
  status: VoiceInputStatus;
  transcript: string | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopAndTranscribe: () => Promise<void>;
  reset: () => void;
}

export function useVoiceInput(): UseVoiceInputResult {
  const [status, setStatus] = useState<VoiceInputStatus>('idle');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<any>(null);

  const startRecording = async () => {
    if (Platform.OS === 'web') {
      setError('Voice input is not supported on web.');
      setStatus('error');
      return;
    }

    const Audio = getAudio();
    if (!Audio) {
      setError('Voice recording requires a native build. Run npx expo run:android to enable it.');
      setStatus('error');
      return;
    }

    try {
      setError(null);
      setTranscript(null);

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setStatus('permission_denied');
        setError('Microphone permission is required for voice input.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setStatus('recording');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start recording.';
      setStatus('error');
      setError(message);
    }
  };

  const stopAndTranscribe = async () => {
    if (!recordingRef.current) return;

    const Audio = getAudio();

    try {
      setStatus('transcribing');
      await recordingRef.current.stopAndUnloadAsync();
      if (Audio) await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error('Recording URI unavailable.');

      const text = await transcribeAudio(uri);
      setTranscript(text);
      setStatus('success');
    } catch (err: unknown) {
      recordingRef.current = null;
      const message = err instanceof Error ? err.message : 'Transcription failed.';
      setStatus('error');
      setError(message);
    }
  };

  const reset = () => {
    setStatus('idle');
    setTranscript(null);
    setError(null);
  };

  return { status, transcript, error, startRecording, stopAndTranscribe, reset };
}
