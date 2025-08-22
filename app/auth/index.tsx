import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, User } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';



export default function AuthScreen() {
  // Log isLogin state after all state declarations
  const [isLogin, setIsLogin] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values (dummy for now, replace with actual Animated.Value if needed)
  const loginTranslateY = new Animated.Value(0);
  const loginOpacity = new Animated.Value(1);
  const signupTranslateY = new Animated.Value(0);
  const signupOpacity = new Animated.Value(1);

  const { colors } = useTheme();
  const { signIn, signUp} = useAuth();


  const showSignup = () => {
    setError(null);
    setIsLogin(false);
  };

  const showLogin = () => {
    setError(null);
    setIsLogin(true);
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn(loginEmail, loginPassword);
      // Navigate or do something on success
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    setError(null);
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    try {
      await signUp(signupEmail, signupPassword);
      // Redirect to create profile after successful signup
      router.replace('/auth/create-profile');
    } catch (e: any) {
      setError(e.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.logoContainer}>
        <Image source={require('@/assets/images/icon1.png')} style={styles.logo} />
        <Text style={[styles.logoText, { color: colors.primary }]}>Gardening Catalogue</Text>
      </View>
      <View style={[styles.formWrapper, { backgroundColor: colors.surface }]}> 
        {isLogin ? (
          <Animated.View 
            style={[
              styles.loginContainer,
              {
                transform: [{ translateY: loginTranslateY }],
                opacity: loginOpacity,
              }
            ]}
          >
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: colors.primary }]}>Login</Text>
              <Pressable onPress={showSignup} style={styles.toggleButton}>
                <Text style={[styles.toggleText, { color: colors.textSecondary }]}> 
                  Don&apos;t have an account?
                </Text>
              </Pressable>
            </View>
            {error && (
              <View style={[styles.errorContainer, { 
                backgroundColor: `${colors.error}20`, 
                borderColor: `${colors.error}40` 
              }]}> 
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}> 
              <Mail size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.inputText }]}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={loginEmail}
                onChangeText={setLoginEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}> 
              <Lock size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.inputText }]}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={loginPassword}
                onChangeText={setLoginPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
            <Pressable
              style={[styles.authButton, { backgroundColor: colors.primary }]}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={[styles.authButtonText, { color: colors.primaryText }]}> 
                  Login
                </Text>
              )}
            </Pressable>
            <Pressable
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.primary }]}> 
                Forgot your password?
              </Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View 
            style={[
              styles.signupContainer,
              {
                transform: [{ translateY: signupTranslateY }],
                opacity: signupOpacity,
              }
            ]}
          >
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: colors.primary }]}>Sign up</Text>
              <Pressable onPress={showLogin} style={styles.toggleButton}>
                <Text style={[styles.toggleText, { color: colors.textSecondary }]}> 
                  Already have an account?
                </Text>
              </Pressable>
            </View>
            {error && (
              <View style={[styles.errorContainer, { 
                backgroundColor: `${colors.error}20`, 
                borderColor: `${colors.error}40` 
              }]}> 
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}> 
              <User size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.inputText }]}
                placeholder="Full Name"
                placeholderTextColor={colors.textSecondary}
                value={signupName}
                onChangeText={setSignupName}
                editable={!isLoading}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}> 
              <Mail size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.inputText }]}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={signupEmail}
                onChangeText={setSignupEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}> 
              <Lock size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.inputText }]}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={signupPassword}
                onChangeText={setSignupPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}> 
              <Lock size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.inputText }]}
                placeholder="Confirm Password"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
            <Pressable
              style={[styles.authButton, { backgroundColor: colors.primary }]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={[styles.authButtonText, { color: colors.primaryText }]}> 
                  Sign up
                </Text>
              )}
            </Pressable>
          </Animated.View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: Dimensions.get('window').height,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    marginTop: 60,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  formWrapper: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 450,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  signupContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 32,
    paddingBottom: 50,
  },
  loginContainer: {
    position: 'relative',
    left: 0,
    right: 0,
    padding: 32,
    paddingBottom: 50,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  formTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  toggleButton: {
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 14,
    textDecorationLine: 'underline',
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
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  authButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44,
    fontWeight: '600',
  },
  forgotPasswordText: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
