/**
 * Transcribes a recorded audio file using the OpenAI Whisper API.
 * Uses the API key stored in SecureStore by the user (via AI Settings panel).
 */
import * as SecureStore from 'expo-secure-store';
import { AI_STORAGE_KEYS } from '@/config/ai';

export async function transcribeAudio(fileUri: string): Promise<string> {
  const apiKey = await SecureStore.getItemAsync(AI_STORAGE_KEYS.apiKey);
  if (!apiKey) {
    throw new Error(
      'Voice transcription requires an API key. Go to the AI tab → Settings and enter your OpenAI API key.'
    );
  }

  const formData = new FormData();
  // React Native's fetch polyfill resolves file:// URIs from FormData objects
  formData.append('file', {
    uri: fileUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Transcription API error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  return (result.text ?? '').trim();
}
