import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Image } from 'react-native';
import { Link } from 'expo-router';
import { Mail, Lock } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop' }}
          style={styles.logo}
        />
        <Text style={styles.logoText}>Q-Tea Seed Catalogue</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Sign in to manage your seed collection</Text>

        <View style={styles.inputContainer}>
          <Mail size={20} color="#BCAB92" />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#8B8776"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color="#BCAB92" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#8B8776"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <Pressable style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </Pressable>

        <Pressable style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Sign In</Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Link href="/auth/signup" asChild>
          <Pressable style={styles.signupButton}>
            <Text style={styles.signupButtonText}>Create Account</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#262A2B',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#BCAB92',
    marginTop: 16,
  },
  formContainer: {
    backgroundColor: '#2D2B24',
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
    color: '#BCAB92',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B8776',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262A2B',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#5E6347',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#BCAB92',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#BCAB92',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#5E6347',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#BCAB92',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#5E6347',
  },
  dividerText: {
    color: '#8B8776',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  signupButton: {
    borderWidth: 2,
    borderColor: '#BCAB92',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#BCAB92',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
