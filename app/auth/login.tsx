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

export default function AuthScreen() {
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#BCAB92" />
        </Pressable>
      </View>

      <View style={styles.logoContainer}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop',
          }}
          style={styles.logo}
        />
        <Text style={styles.logoText}>Q-Tea Seed Catalogue</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Toggle Section */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Sign up</Text>
          <View style={styles.toggleWrapper}>
            <View style={[styles.toggleSlider, isLogin && styles.toggleSliderActive]} />
            <Pressable 
              style={styles.toggleOption}
              onPress={() => toggleMode(true)}
            >
              <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                Login
              </Text>
            </Pressable>
            <Pressable 
              style={styles.toggleOption}
              onPress={() => toggleMode(false)}
            >
              <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                Sign up
              </Text>
            </Pressable>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Mail size={20} color="#dc2626" />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color="#dc2626" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
            placeholderTextColor="#999"
          />
        </View>

        {!isLogin && (
          <View style={styles.inputContainer}>
            <Lock size={20} color="#dc2626" />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!isLoading}
              placeholderTextColor="#999"
            />
          </View>
        )}

        <Pressable
          style={[
            styles.authButton,
            isLoading && styles.authButtonDisabled,
          ]}
          onPress={handleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.authButtonText}>
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
    backgroundColor: '#2D2B54', // Dark purple background like the screenshot
  },
  header: {
    padding: 16,
    paddingTop: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#BCAB92',
    marginTop: 16,
  },
  formContainer: {
    backgroundColor: '#E5E5E5', // Light gray background for the form
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
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },  toggleWrapper: {
    position: 'relative',
    flexDirection: 'row',
    backgroundColor: '#E5E5E5',
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
    backgroundColor: '#fff',
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
    color: '#8B5A99', // Same color for active state
  },
  errorContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D0D0D0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C0C0C0',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  authButton: {
    backgroundColor: '#8B5A99', // Purple button to match the screenshot
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
