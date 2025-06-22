import * as React from 'react';
import { useState } from 'react';
// import {supabase} from '@/config/supabase';

import {
  Alert,
  View,
  Text,
  TextInput,
  Button,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';

import { supabase } from '@/lib/supabase'; // Adjust the import path as necessary
// import BackgroundImage from '@/components/LoginBackgroundImage'; // Uncomment if you have a custom background component

const Login = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Login submission
  const onLogin = async () => {
    setLoading(true);
    setError(null);

    // Basic validation
    if (!email || !password) {
      setError('Email and password are required.');
      setLoading(false);
      return;
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      // Use Supabase authentication
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message || 'Login failed. Please try again.');
      } else {
        // Optionally, navigate to the next screen or show success
        console.log('Login successful');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup submission
  const onSignup = async () => {
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert('Error signing up', error.message);
    } else {
      Alert.alert(
        'Signup successful',
        'Please check your email for confirmation.'
      );
      setEmail('');
      setPassword('');
    }
    setLoading(false);
  };

  // Render the Login component
  return (
    <View style={styles.onContainer}>
      {/* <BackgroundImage> */}
      {/* </BackgroundImage> */}
      {/* <Image source={require('@/assets/images/background.jpg')} style={styles.backgroundImage} /> */}
      <Image
        source={{
          uri: 'https://doc-08-2c-docs.googleusercontent.com/docs/securesc/68c90smiglihng9534mvqmq1946dmis5/fo0picsp1nhiucmc0l25s29respgpr4j/1631524275000/03522360960922298374/03522360960922298374/1Sx0jhdpEpnNIydS4rnN4kHSJtU1EyWka?e=view&authuser=0&nonce=gcrocepgbb17m&user=03522360960922298374&hash=tfhgbs86ka6divo3llbvp93mg4csvb38',
        }}
        style={styles.backgroundImage}
      />
      <Text style={styles.label}>Login</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {loading && <Text style={styles.loading}>Loading...</Text>}
      <Text style={styles.description}>
        Please enter your email and password to login or signup.
      </Text>
      <View style={styles.InputGroup}>
        <Text style={styles.label}>Email:</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Enter your email"
          placeholderTextColor="#888"
        />
        <View style={styles.InputGroup}>
          <Text style={styles.label}>Password:</Text>
          <TextInput
            style={styles.input}
            maxLength={20}
            blurOnSubmit={true}
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#888"
            keyboardType="default"
            returnKeyType="done"
          />
        </View>
        <Pressable style={styles.button} onPress={onLogin} disabled={loading}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>Login</Text>
        </Pressable>
      </View>
      <View style={styles.InputGroup}>
        <Text style={styles.label}>Don't have an account? Signup below:</Text>
        <Button title="Signup" onPress={onSignup} disabled={loading} />
      </View>
    </View>
  );
};

// Styles for the Login component

const styles = StyleSheet.create({
  onContainer: {
    width: 350,
    height: 500,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    // React Native shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
    // React Native elevation for Android
    elevation: 10,
    padding: 20,
    margin: 20,
  },
  backgroundImage: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'cover',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  loading: {
    color: 'blue',
    marginBottom: 10,
  },
  InputGroup: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    padding: 12,
    marginTop: 10,
  },
});

export default Login;
// export default Login;
