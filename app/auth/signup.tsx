import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { Mail, Lock, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError(null);
      await signUp(email, password);
      // Note: User will need to verify their email before signing in
      router.replace('/auth/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.logoContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop' }}
          style={styles.logo}
        />
        <Text style={[styles.logoText, { color: colors.text }]}>Q-Tea Seed Catalogue</Text>
      </View>

      <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Start your gardening journey today</Text>

        {error && (
          <View style={[styles.errorContainer, { 
            backgroundColor: `rgba(220, 38, 38, 0.1)`,
            borderColor: `rgba(220, 38, 38, 0.2)`
          }]}>
            <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
          </View>
        )}

        <View style={[styles.inputContainer, { 
          backgroundColor: colors.inputBackground,
          borderColor: colors.border
        }]}>
          <Mail size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={[styles.inputContainer, { 
          backgroundColor: colors.inputBackground,
          borderColor: colors.border
        }]}>
          <Lock size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={[styles.inputContainer, { 
          backgroundColor: colors.inputBackground,
          borderColor: colors.border
        }]}>
          <Lock size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!isLoading}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          By signing up, you agree to our{' '}
          <Text style={[styles.termsLink, { color: colors.primary }]}>Terms of Service</Text> and{' '}
          <Text style={[styles.termsLink, { color: colors.primary }]}>Privacy Policy</Text>
        </Text>

        <Pressable 
          style={[styles.signupButton, { backgroundColor: colors.primary }, isLoading && styles.signupButtonDisabled]}
          onPress={handleSignup}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.signupButtonText, { color: colors.surface }]}>Create Account</Text>
          )}
        </Pressable>

        <View style={styles.loginPrompt}>
          <Text style={[styles.loginPromptText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <Pressable onPress={() => router.push('/auth/login')}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  formContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 32,
    flex: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  termsText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '600',
  },
  signupButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPromptText: {
    fontSize: 16,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});