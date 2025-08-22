import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import ImageCapture from '../../components/ImageCapture';

export default function CreateProfileScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // This function should match the updateProfile logic in auth.tsx
  const handleCreateProfile = async () => {
    if (!username) {
      Alert.alert('Username is required');
      return;
    }
    setIsLoading(true);
    try {
      const updates = {
        id: user?.id,
        username,
        website,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      };
      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Profile created/updated!');
        router.replace('/(tabs)');
      }
    } catch (err) {
      const message = typeof err === 'object' && err && 'message' in err ? (err as any).message : 'Unknown error';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      {/* Close button at the top right */}
      <Pressable
        style={({ pressed }) => [
          {
            position: 'absolute',
            top: 32,
            right: 24,
            zIndex: 10,
            padding: 8,
            borderRadius: 16,
            backgroundColor: pressed ? colors.surface : colors.background,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
  onPress={() => router.replace('/(tabs)')}
        accessibilityLabel="Close"
      >
        <Text style={{ fontSize: 20, color: colors.text }}>✕</Text>
      </Pressable>
      <View style={styles.formContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Create Profile</Text>
         <Text style={{ marginBottom: 8, color: colors.text }}>Avatar (optional)</Text>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 96, height: 96, borderRadius: 48, alignSelf: 'center', marginBottom: 12, borderWidth: 2, borderColor: colors.primary }}
            resizeMode="cover"
          />
        ) : null}
        <ImageCapture onImageCaptured={uri => uri && setAvatarUrl(uri)} />
       
        <TextInput
          style={[styles.input, { color: colors.inputText, borderColor: colors.inputBorder }]}
          placeholder="Username"
          placeholderTextColor={colors.textSecondary}
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={[styles.input, { color: colors.inputText, borderColor: colors.inputBorder }]}
          placeholder="Website (optional)"
          placeholderTextColor={colors.textSecondary}
          value={website}
          onChangeText={setWebsite}
        />
         <Pressable
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleCreateProfile}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.primaryText }]}>Save Profile</Text>
          )}
        </Pressable>
        
       
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
