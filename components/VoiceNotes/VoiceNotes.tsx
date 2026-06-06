import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Mic, MicOff, Play, Pause, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';

import { transcribeAudio } from '@/lib/voice/transcription';
import { Audio, AVPlaybackStatus } from 'expo-av';

interface VoiceNotesProps {
  onTextExtracted: (text: string) => void;
  placeholder?: string;
  maxDuration?: number; // in seconds
  allowPlayback?: boolean;
}

export default function VoiceNotes({
  onTextExtracted,
  placeholder = "Tap to record a voice note",
  maxDuration = 30,
  allowPlayback = true,
}: VoiceNotesProps) {
  const { colors } = useTheme();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingUriRef = useRef<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      // Inline cleanup using refs directly to avoid stale-closure dependency
      const rec = recordingRef.current;
      if (rec) {
        recordingRef.current = null;
        rec.stopAndUnloadAsync().catch(() => {});
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant microphone permission to record voice notes.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting audio permission:', error);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording(); // Auto-stop at max duration
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      const recording = recordingRef.current;
      if (!recording) return;

      // Null the ref immediately so concurrent calls hit the guard above
      recordingRef.current = null;
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingUriRef.current = uri ?? null;

      if (uri) {
        setHasRecording(true);
        
        // Reset audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });

        await transcribeRecording(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to process recording.');
    }
  };

  const transcribeRecording = async (uri: string) => {
    setIsProcessing(true);
    try {
      const text = await transcribeAudio(uri);
      setTranscriptionText(text);
      onTextExtracted(text);
    } catch (error: any) {
      console.error('Transcription failed:', error);
      const message: string = error?.message || 'Could not convert speech to text.';
      Alert.alert('Transcription Failed', message);
    } finally {
      setIsProcessing(false);
    }
  };

  const playRecording = async () => {
    try {
      const uri = recordingUriRef.current;
      if (!uri) return;

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });

    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Error', 'Failed to play recording.');
    }
  };

  const pauseRecording = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  };

  const deleteRecording = () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this voice note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setHasRecording(false);
            setTranscriptionText('');
            setRecordingTime(0);
            if (soundRef.current) {
              soundRef.current.unloadAsync();
              soundRef.current = null;
            }
            recordingRef.current = null;
            recordingUriRef.current = null;
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const recordButtonColor = isRecording ? colors.error : colors.primary;
  const recordButtonIcon = isRecording ? MicOff : Mic;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Recording Status */}
      {(isRecording || hasRecording) && (
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            {isRecording && (
              <View style={[styles.recordingIndicator, { backgroundColor: colors.error }]} />
            )}
            <Text style={[styles.timeText, { color: colors.text }]}>
              {formatTime(recordingTime)}
            </Text>
          </View>
          
          {hasRecording && allowPlayback && (
            <View style={styles.playbackControls}>
              <Pressable
                style={[styles.playButton, { backgroundColor: colors.primary }]}
                onPress={isPlaying ? pauseRecording : playRecording}
              >
                {isPlaying ? (
                  <Pause size={16} color={colors.background} />
                ) : (
                  <Play size={16} color={colors.background} />
                )}
              </Pressable>
              
              <Pressable
                style={[styles.deleteButton, { backgroundColor: colors.error }]}
                onPress={deleteRecording}
              >
                <Trash2 size={16} color={colors.background} />
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Main Record Button */}
      <Pressable
        style={[styles.recordButton, { backgroundColor: recordButtonColor }]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color={colors.background} />
        ) : (
          React.createElement(recordButtonIcon, {
            size: 24,
            color: colors.background,
          })
        )}
      </Pressable>

      {/* Instructions */}
      <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
        {isRecording 
          ? 'Recording... Tap to stop' 
          : isProcessing 
          ? 'Processing recording...'
          : hasRecording 
          ? 'Recording ready'
          : placeholder
        }
      </Text>

      {/* Transcription */}
      {transcriptionText && (
        <View style={[styles.transcriptionContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.transcriptionLabel, { color: colors.textSecondary }]}>
            Transcription:
          </Text>
          <Text style={[styles.transcriptionText, { color: colors.text }]}>
            {transcriptionText}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  playbackControls: {
    flexDirection: 'row',
    gap: 8,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionText: {
    fontSize: 12,
    textAlign: 'center',
  },
  transcriptionContainer: {
    width: '100%',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  transcriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  transcriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});