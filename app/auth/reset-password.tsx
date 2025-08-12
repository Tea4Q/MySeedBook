import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const { updatePassword } = useAuth();
  const params = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check if user has a valid session for password reset
    const checkSession = async () => {
      try {
        // On web, check for auth tokens in URL first
        if (Platform.OS === 'web') {
          const urlParams = new URLSearchParams(window.location.search);
          const accessToken = urlParams.get('access_token');
          const refreshToken = urlParams.get('refresh_token');
          const type = urlParams.get('type');
          
          console.log('URL params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
          
          // If we have tokens in the URL, this is likely a password reset link
          if (accessToken && refreshToken && type === 'recovery') {
            console.log('Found recovery tokens in URL, attempting to set session');
            
            try {
              // Set the session using the tokens from the URL
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (sessionError) {
                console.error('Failed to set session from URL tokens:', sessionError);
                setError('Invalid or expired reset link. Please request a new password reset.');
                setIsValidSession(false);
              } else {
                console.log('Successfully set session from URL tokens');
                setIsValidSession(true);
                
                // Clean up URL to remove tokens for security
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            } catch (setSessionError) {
              console.error('Error setting session from URL:', setSessionError);
              setError('Failed to process reset link. Please request a new password reset.');
              setIsValidSession(false);
            }
          } else {
            // No URL tokens, check for existing session
            console.log('No URL tokens found, checking existing session');
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('Session error:', error);
              setError('Failed to validate reset session. Please try again.');
              setIsValidSession(false);
            } else if (!session) {
              console.log('No session found for password reset');
              setError('Invalid or expired reset link. Please request a new password reset.');
              setIsValidSession(false);
            } else {
              console.log('Valid existing session found for password reset');
              setIsValidSession(true);
            }
          }
        } else {
          // On mobile, just check for existing session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          console.log('Reset password session check (mobile):', { session: !!session, error });
          
          if (error) {
            console.error('Session error:', error);
            setError('Failed to validate reset session. Please try again.');
            setIsValidSession(false);
          } else if (!session) {
            console.log('No session found for password reset');
            setError('Invalid or expired reset link. Please request a new password reset.');
            setIsValidSession(false);
          } else {
            console.log('Valid session found for password reset');
            setIsValidSession(true);
          }
        }
      } catch (err) {
        console.error('Session validation error:', err);
        setError('Failed to validate reset session. Please try again.');
        setIsValidSession(false);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    // Add more password requirements if needed
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    
    return null;
  };

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Attempting to update password...');
      
      // Check if we still have a valid session before updating
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('No valid session for password update:', sessionError);
        setError('Session expired. Please request a new password reset link.');
        return;
      }
      
      console.log('Session valid, proceeding with password update');
      
      await updatePassword(password);
      
      console.log('Password updated successfully');
      setPasswordUpdated(true);
    } catch (err) {
      console.error('Password update error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update password';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/auth');
  };

  if (checkingSession) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Validating reset link...
          </Text>
        </View>
      </View>
    );
  }

  if (!isValidSession) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={[styles.errorIconContainer, { backgroundColor: `${colors.error}20` }]}>
            <Text style={[styles.errorIcon, { color: colors.error }]}>⚠️</Text>
          </View>
          
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Invalid Reset Link
          </Text>
          
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {error || 'This password reset link is invalid or has expired.'}
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
            style={[styles.requestNewButton, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/auth/forgot-password' as any)}
          >
            <Text style={[styles.requestNewButtonText, { color: colors.primary }]}>
              Request New Reset Link
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (passwordUpdated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={[styles.successIconContainer, { backgroundColor: `${colors.success}20` }]}>
            <CheckCircle size={64} color={colors.success} />
          </View>
          
          <Text style={[styles.successTitle, { color: colors.text }]}>
            Password Updated!
          </Text>
          
          <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
            Your password has been successfully updated. You can now sign in with your new password.
          </Text>
          
          <Pressable
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={handleBackToLogin}
          >
            <Text style={[styles.backButtonText, { color: colors.primaryText }]}>
              Continue to Login
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Reset Password
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
           {` Enter your new password below. Make sure it's strong and secure.`}
          </Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20`, borderColor: `${colors.error}40` }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
            <Lock size={20} color={colors.primary} />
            <TextInput
              style={[styles.input, { color: colors.inputText }]}
              placeholder="New password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? (
                <EyeOff size={20} color={colors.textSecondary} />
              ) : (
                <Eye size={20} color={colors.textSecondary} />
              )}
            </Pressable>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
            <Lock size={20} color={colors.primary} />
            <TextInput
              style={[styles.input, { color: colors.inputText }]}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError(null);
              }}
              secureTextEntry={!showConfirmPassword}
              editable={!isLoading}
            />
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeButton}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color={colors.textSecondary} />
              ) : (
                <Eye size={20} color={colors.textSecondary} />
              )}
            </Pressable>
          </View>

          <View style={styles.passwordRequirements}>
            <Text style={[styles.requirementsTitle, { color: colors.text }]}>
              Password Requirements:
            </Text>
            <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
              • At least 6 characters long
            </Text>
            <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
              • Contains uppercase and lowercase letters
            </Text>
            <Text style={[styles.requirementText, { color: colors.textSecondary }]}>
              • Contains at least one number
            </Text>
          </View>

          <Pressable
            style={[
              styles.updateButton,
              { backgroundColor: colors.primary },
              isLoading && styles.updateButtonDisabled,
            ]}
            onPress={handleUpdatePassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={[styles.updateButtonText, { color: colors.primaryText }]}>
                Update Password
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 60,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
    marginBottom: 16,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 8,
  },
  passwordRequirements: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 16,
  },
  updateButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  updateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Success/Error state styles
  successIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 32,
  },
  errorIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 32,
  },
  errorIcon: {
    fontSize: 48,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
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
  requestNewButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestNewButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
