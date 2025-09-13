import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Mail, Lock, User, Eye, EyeOff, Leaf } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';


export default function AuthScreen() {
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const screenWidth = Dimensions.get('window').width;
  
  const [isLogin, setIsLogin] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  // Signup animation values
  const signupOpacity = React.useRef(new Animated.Value(0)).current;
  const signupTranslateY = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(signupOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(signupTranslateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim, signupOpacity, signupTranslateY]);


  const { colors } = useTheme();
  const { signIn, signUp, signInAsGuest } = useAuth();

  const showSignup = () => {
    setError(null);
    setIsLogin(false);
  }
  const showLogin = () => {
    setError(null);
    setIsLogin(true);
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
      try {
        await signIn(loginEmail, loginPassword);
        // On success, navigation is handled by auth state change
      } catch (err) {
    setError((err as Error).message || 'Failed to sign in. Please try again.');
      } finally {
        setIsLoading(false);
      }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    setError(null);
      if (signupPassword !== confirmPassword) {
        setError('Passwords do not match.');
        setIsLoading(false);
        return;
      }
    
      try {
        await signUp(signupEmail, signupPassword);
        // On success, navigation is handled by auth state change
      } catch (err) {
        setError((err as Error).message || 'Failed to sign up. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    const handleForgotPassword = () => {
      // Implement forgot password logic or navigation
      router.push('/auth/forgot-password');
    };

    const handleGuestSignIn = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await signInAsGuest();
        // Navigation is handled by auth state change
      } catch (err) {
        setError((err as Error).message || 'Failed to sign in as guest. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

 

    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Background Gradient */}
        <LinearGradient
          colors={['#2d5a2d', '#1a4a1a', '#0f2f0f']}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.formWrapper, { backgroundColor: colors.surface }, isLandscape && { flex: 2, minHeight: 400, maxWidth: 500, marginLeft: 40 }]}> 
          {isLogin ? (
            <Animated.View 
              style={[
                styles.loginContainer,
                isLandscape && { padding: 24 },
                {
                  transform: [{ translateY: slideAnim }],
                  opacity: fadeAnim,
                }
              ]}
            >
              <View style={styles.formHeader}>
                <Text style={[styles.formTitle, { color: colors.primary }]}>Login</Text>
                <Pressable onPress={showSignup} style={styles.toggleButton}>
                  <Text style={[styles.toggleText, { color: colors.textSecondary }]}>Don&apos;t have an account?</Text>
                </Pressable>
              </View>
              {error && (
                <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20`, borderColor: `${colors.error}40` }]}> 
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
                  secureTextEntry={!showLoginPassword}
                  editable={!isLoading}
                />
                <Pressable onPress={() => setShowLoginPassword(v => !v)} style={{ padding: 4 }}>
                  {showLoginPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
                </Pressable>
              </View>
              <Pressable
                style={[styles.authButton, { backgroundColor: colors.primary }]}
                onPress={handleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.primaryText} />
                ) : (
                  <Text style={[styles.authButtonText, { color: colors.primaryText }]}>Sign In</Text>
                )}
              </Pressable>
              
              <Pressable
                style={[styles.guestButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                onPress={handleGuestSignIn}
                disabled={isLoading}
              >
                <Text style={[styles.guestButtonText, { color: colors.primary }]}>Continue as Guest</Text>
                <Text style={[styles.guestLimitText, { color: colors.textSecondary }]}>
                  Try for free: 1 seed, 1 supplier, 1 view
                </Text>
              </Pressable>
              
              <Pressable onPress={handleForgotPassword} style={[styles.forgotPassword, isLoading && { opacity: 0.5 }]} disabled={isLoading}>
                <Text style={[styles.forgotPasswordText, { color: colors.textSecondary }]}>Forgot your Password?</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View
              style={[styles.signupContainer, 
                isLandscape && { padding: 24 },
                { 
                  transform: [{ translateY: signupTranslateY }],
                  opacity: signupOpacity,
                }
              ]}
            >
              <View style={styles.formHeader}>
                <Text style={[styles.formTitle, { color: colors.primary }]}>Sign Up</Text>  
                <Pressable onPress={showLogin} style={styles.toggleButton}>
                  <Text style={[styles.toggleText, { color: colors.textSecondary }]}>Already have an account?</Text>
                </Pressable>
              </View>
              {error && (
                <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20`, borderColor: `${colors.error}40` }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              )}
              <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor
  : colors.inputBorder }]}>
                <User size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.inputText }]}
                  placeholder="User Name"
                  placeholderTextColor={colors.textSecondary}
                  value={userName}
                  onChangeText={setUserName}
                  editable={!isLoading}
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
                  secureTextEntry={!showSignupPassword}
                  editable={!isLoading}
                />
                <Pressable onPress={() => setShowSignupPassword(v => !v)} style={{ padding: 4 }}>
                  {showSignupPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
                </Pressable>
              </View>
              <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}> 
                <Lock size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.inputText }]}
                  placeholder="Confirm Password"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                />
                <Pressable onPress={() => setShowConfirmPassword(v => !v)} style={{ padding: 4 }}>
                  {showConfirmPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
                </Pressable>
              </View>
              <Pressable
                style={[styles.authButton, { backgroundColor: colors.primary }]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.authButtonText, { color: colors.primaryText }]}>Sign Up</Text>
                )}
              </Pressable>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  };

const styles = StyleSheet.create({
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
  },
  container:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,  
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formWrapper: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  signupContainer: {
    width: '100%',  
  },
  loginContainer: {
    width: '100%',
  },
  toggleButton: {
    paddingVertical: 6,
  },
  toggleText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  errorContainer: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 15,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
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
  guestButton: {
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 2,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  guestLimitText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
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
