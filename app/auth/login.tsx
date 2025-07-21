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
} from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

export default function AuthScreen() {
  const { colors } = useTheme();
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true); // true for login, false for signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    if (!email || !password) {
      setError('Email and password are required');
      return false;
    }

    if (!isLogin) {
      if (!confirmPassword) {
        setError('Please confirm your password');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleAuth = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError(null);
      
      if (isLogin) {
        await signIn(email, password);
        router.replace('/(tabs)');
      } else {
        await signUp(email, password);
        router.replace('/(tabs)');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isLogin ? 'sign in' : 'create account'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setError(null);
    setConfirmPassword('');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: `${colors.primary}20` }]}>
          <ArrowLeft size={24} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.logoContainer}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop',
          }}
          style={styles.logo}
        />
        <Text style={[styles.logoText, { color: colors.primary }]}>Q-Tea Seed Catalogue</Text>
      </View>

      <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
        {/* Toggle Section */}
        <View style={styles.toggleContainer}>
          <Text style={[styles.toggleLabel, { color: colors.text }]}>Choose Your Action</Text>
          <View style={[styles.toggleWrapper, { backgroundColor: colors.inputBackground }]}>
            <View style={[styles.toggleSlider, { backgroundColor: colors.card }, isLogin && styles.toggleSliderActive]} />
            <Pressable 
              style={styles.toggleOption}
              onPress={() => toggleMode(true)}
            >
              <Text style={[styles.toggleText, { color: colors.primary }, isLogin && styles.toggleTextActive]}>
                Login
              </Text>
            </Pressable>
            <Pressable 
              style={styles.toggleOption}
              onPress={() => toggleMode(false)}
            >
              <Text style={[styles.toggleText, { color: colors.primary }, !isLogin && styles.toggleTextActive]}>
                Sign up
              </Text>
            </Pressable>
          </View>
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: `${colors.error}20`, borderColor: `${colors.error}40` }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
          <Mail size={20} color={colors.primary} />
          <TextInput
            style={[styles.input, { color: colors.inputText }]}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
          <Lock size={20} color={colors.primary} />
          <TextInput
            style={[styles.input, { color: colors.inputText }]}
            placeholder="Password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />
        </View>

        {!isLogin && (
          <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
            <Lock size={20} color={colors.primary} />
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
        )}

        <Pressable
          style={[
            styles.authButton,
            { backgroundColor: colors.primary },
            isLoading && styles.authButtonDisabled,
          ]}
          onPress={handleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={[styles.authButtonText, { color: colors.primaryText }]}>
              {isLogin ? 'Login' : 'Sign up'}
            </Text>
          )}
        </Pressable>
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
  toggleContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  toggleWrapper: {
    position: 'relative',
    flexDirection: 'row',
    borderRadius: 25,
    padding: 4,
    width: 200,
    height: 50,
  },
  toggleSlider: {
    position: 'absolute',
    top: 4,
    right: 4, // Start at signup position (right side)
    width: 96,
    height: 42,
    borderRadius: 21,
    zIndex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toggleSliderActive: {
    right: 96, // Move to login position (left side)
  },
  toggleOption: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  toggleOptionActive: {
    // Active option styling handled by slider
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5A99', // Purple color to match the screenshot
  },
  toggleTextActive: {
    // Color applied dynamically through JSX
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
  authButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
