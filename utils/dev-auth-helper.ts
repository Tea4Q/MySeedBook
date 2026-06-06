/**
 * Development helper for testing authentication
 * Only use this for development/testing purposes
 */

import { supabase } from '@/lib/supabase';

export const createTestUser = async (email: string, password: string) => {
  console.log('🧪 Creating test user:', email);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('❌ Test user creation failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Test user created successfully:', data.user?.email);
    return { success: true, user: data.user };
  } catch (error: any) {
    console.error('❌ Test user creation exception:', error);
    return { success: false, error: error.message };
  }
};

export const testSignIn = async (email: string, password: string) => {
  console.log('🧪 Testing sign in for:', email);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Test sign in failed:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      return { success: false, error: error.message };
    }

    console.log('✅ Test sign in successful:', data.user?.email);
    return { success: true, user: data.user };
  } catch (error: any) {
    console.error('❌ Test sign in exception:', error);
    return { success: false, error: error.message };
  }
};

// Common test credentials
export const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'testpassword123'
};