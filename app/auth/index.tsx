import React, { useState, useEffect, useMemo } from 'react';
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
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Mail, Lock, User, Eye, EyeOff, Leaf } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';

export default function AuthScreen() {
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLogin, setIsLogin] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  // Animation values with useMemo to prevent re-creation
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(50), []);
  const scaleAnim = useMemo(() => new Animated.Value(0.9), []);

  // Falling leaf animations - create 20 animated values for each leaf
  const leafAnims = useMemo(() => 
    Array.from({ length: 20 }, () => ({
      translateY: new Animated.Value(-100),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(0.1)
    })), []
  );

  const { signIn, signUp, signInAsGuest, resendConfirmation } = useAuth();
  const ContainerComponent = Platform.OS === 'ios' ? KeyboardAvoidingView : View;

  useEffect(() => {
    // Initial screen animations
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
    ]).start();

    // Start falling leaf animations
    const startFallingLeaves = () => {
      leafAnims.forEach((leafAnim, index) => {
        // Stagger the start times for natural effect - spread over longer period
        const delay = index * 400; // 400ms between each leaf start
        
        const animateLeaf = () => {
          const fallDuration = 8000 + (index % 4) * 1000; // 8-11 seconds for full traverse
          const startX = (index % 5) * (100) + (index % 3 - 1) * 40; // Better spread across screen
          const endX = startX + (index % 2 === 0 ? 1 : -1) * 60; // More horizontal drift
          
          // Reset leaf to TOP of screen (well above visible area)
          leafAnim.translateY.setValue(-150); // Start higher
          leafAnim.translateX.setValue(startX);
          leafAnim.rotate.setValue(0);
          leafAnim.opacity.setValue(0); // Start invisible

          // Animate falling from top to bottom of ENTIRE screen
          Animated.parallel([
            // Fall from top to well below screen bottom
            Animated.timing(leafAnim.translateY, {
              toValue: 1200, // Go well past bottom of screen
              duration: fallDuration,
              useNativeDriver: true,
            }),
            // Horizontal drift during fall
            Animated.timing(leafAnim.translateX, {
              toValue: endX,
              duration: fallDuration,
              useNativeDriver: true,
            }),
            // Gentle rotation during fall
            Animated.timing(leafAnim.rotate, {
              toValue: (index % 4) * 180 + 360, // More rotation for longer fall
              duration: fallDuration,
              useNativeDriver: true,
            }),
            // Fade in, stay visible, then fade out at bottom
            Animated.sequence([
              // Fade in at top
              Animated.timing(leafAnim.opacity, {
                toValue: 0.4 + (index % 3) * 0.1, // More visible: 0.4-0.7
                duration: fallDuration * 0.1, // Quick fade in
                useNativeDriver: true,
              }),
              // Stay visible during most of fall
              Animated.timing(leafAnim.opacity, {
                toValue: 0.4 + (index % 3) * 0.1,
                duration: fallDuration * 0.8, // Visible for 80% of fall
                useNativeDriver: true,
              }),
              // Fade out at bottom
              Animated.timing(leafAnim.opacity, {
                toValue: 0,
                duration: fallDuration * 0.1, // Quick fade out
                useNativeDriver: true,
              }),
            ]),
          ]).start(() => {
            // Restart the animation immediately when it completes
            setTimeout(animateLeaf, 500 + index * 100); // Slight stagger on restart
          });
        };

        // Start with delay
        setTimeout(animateLeaf, delay);
      });
    };

    startFallingLeaves();

    // Cleanup function to stop animations when component unmounts
    return () => {
      leafAnims.forEach(leafAnim => {
        leafAnim.translateY.stopAnimation();
        leafAnim.translateX.stopAnimation();
        leafAnim.rotate.stopAnimation();
        leafAnim.opacity.stopAnimation();
      });
    };
  }, [fadeAnim, scaleAnim, slideAnim, leafAnims]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setShowResend(false);
    setResendSent(false);
    try {
      await signIn(loginEmail, loginPassword);
      // Let _layout.tsx handle navigation after auth state changes
    } catch (err) {
      console.error('❌ Regular sign in error:', err);
      const errorMessage = (err as Error).message || 'Failed to sign in. Please try again.';
      
      // If it's a network error, provide guidance to use guest mode
      if (errorMessage.includes('Network connection issue') || 
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('fetch resource') ||
          errorMessage.includes('Network request failed')) {
        setError(`${errorMessage}\n\n💡 Tip: You can continue as a guest to explore the app offline!`);
      } else if (errorMessage.includes('confirmation link')) {
        setError(errorMessage);
        setShowResend(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!loginEmail) {
      setError('Enter your email address above, then tap Resend.');
      return;
    }
    setIsLoading(true);
    try {
      await resendConfirmation(loginEmail);
      setResendSent(true);
      setShowResend(false);
      setError(null);
    } catch (err) {
      setError((err as Error).message || 'Failed to resend. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    console.log('🔍 Sign up started');
    setIsLoading(true);
    setError(null);
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('🔍 Calling signUp...');
      await signUp(signupEmail, signupPassword);
      console.log('✅ Sign up successful - showing email confirmation prompt');
      setShowEmailConfirmation(true);
    } catch (err) {
      console.error('❌ Sign up error:', err);
      const errorMessage = (err as Error).message || 'Failed to sign up. Please try again.';
      
      // If it's a network error, provide guidance to use guest mode
      if (errorMessage.includes('Network connection issue') || 
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('fetch resource')) {
        setError(`${errorMessage}\n\n💡 Tip: You can continue as a guest to explore the app offline!`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInAsGuest();
      // Let _layout.tsx handle navigation after auth state changes
    } catch (err) {
      console.error('❌ Guest sign in error:', err);
      setError((err as Error).message || 'Failed to continue as guest. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ContainerComponent
      style={styles.container} 
      {...(Platform.OS === 'ios'
        ? {
            behavior: 'padding' as const,
            keyboardVerticalOffset: 0,
          }
        : {})}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#2d5a2d', '#1a4a1a', '#0f2f0f']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        {leafAnims.map((leafAnim, i) => (
          <Animated.View
            key={i}
            style={[
              styles.backgroundLeaf,
              {
                transform: [
                  { translateY: leafAnim.translateY },
                  { translateX: leafAnim.translateX },
                  { rotate: leafAnim.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg']
                  }) },
                ],
                opacity: leafAnim.opacity,
                // Remove fixed positioning - let animation control everything
                left: 0,
                top: 0,
              },
            ]}
          >
            <Leaf size={25 + (i % 4) * 5} color="#ffffff" />
          </Animated.View>
        ))}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <Animated.View 
          style={[
            styles.headerSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image 
                source={require('@/assets/images/icon1.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appTitle}>Gardening Catalogue</Text>
            <Text style={styles.appSubtitle}>Cultivate your Garden dreams</Text>
          </View>
        </Animated.View>

        {/* Main Card */}
        <Animated.View 
          style={[
            styles.mainCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <BlurView intensity={10} style={styles.blurContainer}>
            <View style={styles.cardContent}>
              {/* Email confirmation screen shown after successful signup */}
              {showEmailConfirmation ? (
                <View style={styles.confirmationContainer}>
                  <Mail size={48} color="#4a7c59" style={{ marginBottom: 16 }} />
                  <Text style={styles.confirmationTitle}>Check your email</Text>
                  <Text style={styles.confirmationBody}>
                    We sent a confirmation link to{' '}
                    <Text style={styles.confirmationEmail}>{signupEmail}</Text>.
                    {'\n'}Tap the link in the email to activate your account, then sign in below.
                  </Text>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => { setShowEmailConfirmation(false); setIsLogin(true); }}
                  >
                    <Text style={styles.primaryButtonText}>Go to Sign In</Text>
                  </Pressable>
                </View>
              ) : (
              <>
              {/* Tab Selector */}
              <View style={styles.tabContainer}>
                <Pressable
                  style={[styles.tab, isLogin && styles.activeTab]}
                  onPress={() => setIsLogin(true)}
                >
                  <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                    Sign In
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.tab, !isLogin && styles.activeTab]}
                  onPress={() => setIsLogin(false)}
                >
                  <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
                    Sign Up
                  </Text>
                </Pressable>
              </View>

              {/* Error Message */}
              {error && (
                <Animated.View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              {/* Form Content */}
              {isLogin ? (
                <View style={styles.formContainer}>
                  {/* Email Input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Mail size={20} color="#7c9885" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Email address"
                      placeholderTextColor="#7c9885"
                      value={loginEmail}
                      onChangeText={setLoginEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Lock size={20} color="#7c9885" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#7c9885"
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      secureTextEntry={!showLoginPassword}
                      editable={!isLoading}
                    />
                    <Pressable
                      style={styles.eyeIcon}
                      onPress={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? (
                        <EyeOff size={20} color="#7c9885" />
                      ) : (
                        <Eye size={20} color="#7c9885" />
                      )}
                    </Pressable>
                  </View>

                  {/* Sign In Button */}
                  <Pressable
                    style={[styles.primaryButton, isLoading && styles.disabledButton]}
                    onPress={handleSignIn}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Sign In</Text>
                    )}
                  </Pressable>

                  {/* Forgot Password */}
                  <Pressable style={styles.forgotPassword} onPress={handleForgotPassword}>
                    <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                  </Pressable>

                  {/* Resend confirmation email */}
                  {showResend && (
                    <Pressable
                      style={[styles.forgotPassword, { marginTop: 4 }]}
                      onPress={handleResendConfirmation}
                      disabled={isLoading}
                    >
                      <Text style={[styles.forgotPasswordText, { color: '#a7d4b4' }]}>
                        Resend confirmation email
                      </Text>
                    </Pressable>
                  )}

                  {/* Resend success notice */}
                  {resendSent && (
                    <Text style={[styles.forgotPasswordText, { color: '#a7d4b4', textAlign: 'center', marginTop: 8 }]}>
                      Confirmation email sent — check your inbox.
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.formContainer}>
                  {/* Name Input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <User size={20} color="#7c9885" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Full name"
                      placeholderTextColor="#7c9885"
                      value={userName}
                      onChangeText={setUserName}
                      editable={!isLoading}
                    />
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Mail size={20} color="#7c9885" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Email address"
                      placeholderTextColor="#7c9885"
                      value={signupEmail}
                      onChangeText={setSignupEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Lock size={20} color="#7c9885" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#7c9885"
                      value={signupPassword}
                      onChangeText={setSignupPassword}
                      secureTextEntry={!showSignupPassword}
                      editable={!isLoading}
                    />
                    <Pressable
                      style={styles.eyeIcon}
                      onPress={() => setShowSignupPassword(!showSignupPassword)}
                    >
                      {showSignupPassword ? (
                        <EyeOff size={20} color="#7c9885" />
                      ) : (
                        <Eye size={20} color="#7c9885" />
                      )}
                    </Pressable>
                  </View>

                  {/* Confirm Password Input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <Lock size={20} color="#7c9885" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm password"
                      placeholderTextColor="#7c9885"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      editable={!isLoading}
                    />
                    <Pressable
                      style={styles.eyeIcon}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color="#7c9885" />
                      ) : (
                        <Eye size={20} color="#7c9885" />
                      )}
                    </Pressable>
                  </View>

                  {/* Sign Up Button */}
                  <Pressable
                    style={[styles.primaryButton, isLoading && styles.disabledButton]}
                    onPress={handleSignup}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Create Account</Text>
                    )}
                  </Pressable>
                </View>
              )}

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.divider} />
              </View>

              {/* Guest Login Button */}
              <Pressable
                style={styles.guestButton}
                onPress={handleGuestSignIn}
                disabled={isLoading}
              >
                <Leaf size={20} color="#4a7c59" />
                <View style={styles.guestButtonContent}>
                  <Text style={styles.guestButtonText}>Continue as Guest</Text>
                  <Text style={styles.guestButtonSubtext}>
                    Try for free: Add up to 10 seeds
                  </Text>
                </View>
                {isLoading && (
                  <ActivityIndicator color="#4a7c59" size="small" />
                )}
              </Pressable>
              </>
              )}
            </View>
          </BlurView>
        </Animated.View>
      </ScrollView>
    </ContainerComponent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f2f0f',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundPattern: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 1,
    pointerEvents: 'none', // This allows touches to pass through
  },
  backgroundLeaf: {
    position: 'absolute',
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 60,
    height: 60,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mainCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 10,
  },
  blurContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: '#ffffff',
  },
  errorContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderColor: 'rgba(220, 38, 38, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: {
    gap: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  eyeIcon: {
    padding: 8,
  },
  primaryButton: {
    backgroundColor: '#4a7c59',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPassword: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  forgotPasswordText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginHorizontal: 16,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(116, 165, 127, 0.4)',
  },
  guestButtonContent: {
    marginLeft: 12,
    flex: 1,
  },
  guestButtonText: {
    color: '#a7d4b4',
    fontSize: 16,
    fontWeight: '600',
  },
  guestButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  confirmationContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 8,
    gap: 12,
  },
  confirmationTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmationBody: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmationEmail: {
    color: '#a7d4b4',
    fontWeight: '600',
  },
});
