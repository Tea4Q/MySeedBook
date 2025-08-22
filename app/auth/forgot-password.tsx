import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlerecoverPassword = async () => {
    if (!email) {
      setError('Email address is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await forgotPassword(email);
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  if (emailSent) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={[styles.successIconContainer, { backgroundColor: `${colors.success}20` }]}>
            <CheckCircle size={64} color={colors.success} />
          </View>
          
          <Text style={[styles.successTitle, { color: colors.text }]}>
            Check Your Email
          </Text>
          
          <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
            {`We've sent a password reset link to \n`}
            <Text style={[styles.emailText, { color: colors.primary }]}>{email}</Text>
          </Text>
          
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            {`Click the link in the email to reset your password. If you don't see the email, check your spam folder.`}
          </Text>
          
          <Pressable
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={handleBackToLogin}
          >
            <Text style={[styles.backButtonText, { color: colors.primaryText }]}>
              Back to Login
            </Text>
          </Pressable>
          
          <Pressable
            style={[styles.resendButton, { backgroundColor: colors.surface }]}
            onPress={() => {
              setEmailSent(false);
              setEmail('');
            }}
          >
            <Text style={[styles.resendButtonText, { color: colors.primary }]}>
              Try Different Email
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Floating Back Button */}
      <Pressable 
        onPress={handleBackToLogin} 
        style={[styles.floatingBackButton, { backgroundColor: colors.surface }]}
      >
        <ArrowLeft size={24} color={colors.text} />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Forgot Password?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {"Don't worry! Enter your email address and we'll send you a link to reset your password."}
          </Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20`, borderColor: `${colors.error}40` }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
            <Mail size={20} color={colors.primary} />
            <TextInput
              style={[styles.input, { color: colors.inputText }]}
              placeholder="Enter your email address"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <Pressable
            style={[
              styles.resetButton,
              { backgroundColor: colors.primary },
              isLoading && styles.resetButtonDisabled,
            ]}
            onPress={handlerecoverPassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={[styles.resetButtonText, { color: colors.primaryText }]}>
                Send Reset Link
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingBackButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1000,
    padding: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 80, // Space for floating back button
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formContainer: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  resetButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Success state styles
  successIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emailText: {
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
