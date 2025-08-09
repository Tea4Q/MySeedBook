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
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, User } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

export default function AuthScreen() {
  const { colors } = useTheme();
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
    try {
      router.push('/auth/forgot-password');
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Navigation failed: ' + error);
    }
  };

  const toggleForm = () => {
    setError(null);
    const toValue = isLogin ? 1 : 0;
    
    Animated.timing(slideAnim, {
      toValue,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    setIsLogin(!isLogin);
  };

  const validateLoginForm = () => {
    if (!loginEmail || !loginPassword) {
      setError('Email and password are required');
      return false;
    }
    if (loginPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const validateSignupForm = () => {
    if (!signupName || !signupEmail || !signupPassword || !confirmPassword) {
      setError('All fields are required');
      return false;
    }
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    if (!validateLoginForm()) return;

    try {
      setIsLoading(true);
      setError(null);
      await signIn(loginEmail, loginPassword);
      
      if (Platform.OS === 'web') {
        // Let the _layout.tsx handle navigation on web to prevent splash screen
        console.log('Login successful, waiting for automatic navigation...');
      } else {
        // On mobile, navigate immediately - auth provider handles timing for splash screen
        console.log('Login successful, navigating to main app...');
        router.replace('/(tabs)');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!validateSignupForm()) return;

    try {
      setIsLoading(true);
      setError(null);
      await signUp(signupEmail, signupPassword);
      
      if (Platform.OS === 'web') {
        // Let the _layout.tsx handle navigation on web to prevent splash screen
        console.log('Signup successful, waiting for automatic navigation...');
      } else {
        // On mobile, navigate immediately - auth provider handles timing for splash screen
        console.log('Signup successful, navigating to main app...');
        router.replace('/(tabs)');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  // Transform values for animations
  const signupTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -320],
  });

  const loginTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  const signupOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const loginOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/icon1.png')}
          style={styles.logo}
        />
        <Text style={[styles.logoText, { color: colors.primary }]}>
          MySeedBook Catalogue
        </Text>
      </View>

      {/* Main Form Container */}
      <View style={[styles.formWrapper, { backgroundColor: colors.surface }]}>
        
        {/* Signup Form */}
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
            <Pressable onPress={toggleForm} style={styles.toggleButton}>
              <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
                Already have an account?
              </Text>
            </Pressable>
          </View>

          {error && !isLogin && (
            <View style={[styles.errorContainer, { 
              backgroundColor: `${colors.error}20`, 
              borderColor: `${colors.error}40` 
            }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <View style={[styles.inputContainer, { 
            backgroundColor: colors.inputBackground, 
            borderColor: colors.inputBorder 
          }]}>
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

          <View style={[styles.inputContainer, { 
            backgroundColor: colors.inputBackground, 
            borderColor: colors.inputBorder 
          }]}>
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

          <View style={[styles.inputContainer, { 
            backgroundColor: colors.inputBackground, 
            borderColor: colors.inputBorder 
          }]}>
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

          <View style={[styles.inputContainer, { 
            backgroundColor: colors.inputBackground, 
            borderColor: colors.inputBorder 
          }]}>
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
            {isLoading && !isLogin ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={[styles.authButtonText, { color: colors.primaryText }]}>
                Sign up
              </Text>
            )}
          </Pressable>
        </Animated.View>

        {/* Login Form */}
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
            <Pressable onPress={toggleForm} style={styles.toggleButton}>
              <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
                Don&apos;t have an account?
              </Text>
            </Pressable>
          </View>

          {error && isLogin && (
            <View style={[styles.errorContainer, { 
              backgroundColor: `${colors.error}20`, 
              borderColor: `${colors.error}40` 
            }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <View style={[styles.inputContainer, { 
            backgroundColor: colors.inputBackground, 
            borderColor: colors.inputBorder 
          }]}>
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

          <View style={[styles.inputContainer, { 
            backgroundColor: colors.inputBackground, 
            borderColor: colors.inputBorder 
          }]}>
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
            {isLoading && isLogin ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={[styles.authButtonText, { color: colors.primaryText }]}>
                Login
              </Text>
            )}
          </Pressable>

          {/* Forgot Password Link - only show on login form */}
          {isLogin && (
            <Pressable
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.primary }]}> 
                Forgot your password?
              </Text>
            </Pressable>
          )}
        </Animated.View>
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
  },
  forgotPasswordText: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
