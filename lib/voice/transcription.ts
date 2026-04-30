/**
 * Transcribes a recorded audio file using the OpenAI Whisper API.
 * Requires EXPO_PUBLIC_OPENAI_API_KEY in your .env.local file.
 */
export async function transcribeAudio(fileUri: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Voice transcription is not configured. Add EXPO_PUBLIC_OPENAI_API_KEY to your .env.local file.'
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
