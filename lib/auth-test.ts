import { supabase } from './supabase';

// Test credentials for development
const TEST_EMAIL = 'test@gardening.app';
const TEST_PASSWORD = 'testpassword123';

/**
 * Create a test user account for development purposes
 */
export async function createTestUser() {
  console.log('Creating test user...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (error) {
      console.error('Error creating test user:', error.message);
      return { success: false, error: error.message };
    }

    console.log('Test user created successfully:', data.user?.email);
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Exception creating test user:', error);
    return { success: false, error: 'Failed to create test user' };
  }
}

/**
 * Sign in with test user credentials
 */
export async function signInTestUser() {
  console.log('Signing in test user...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (error) {
      console.error('Error signing in test user:', error.message);
      return { success: false, error: error.message };
    }

    console.log('Test user signed in successfully:', data.user?.email);
    return { success: true, user: data.user, session: data.session };
  } catch (error) {
    console.error('Exception signing in test user:', error);
    return { success: false, error: 'Failed to sign in test user' };
  }
}

/**
 * Check current session status
 */
export async function checkSessionStatus() {
  console.log('Checking session status...');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error checking session:', error.message);
      return { success: false, error: error.message };
    }

    const hasSession = !!session;
    console.log('Session status:', hasSession ? 'Active' : 'None');
    if (hasSession) {
      console.log('User email:', session.user?.email);
      console.log('Session expires at:', session.expires_at);
    }

    return { success: true, hasSession, session };
  } catch (error) {
    console.error('Exception checking session:', error);
    return { success: false, error: 'Failed to check session' };
  }
}

/**
 * Test the complete authentication flow
 */
export async function testAuthFlow() {
  console.log('=== Testing Authentication Flow ===');
  
  // Check initial session
  let result = await checkSessionStatus();
  if (!result.success) {
    console.error('Failed to check initial session:', result.error);
    return;
  }

  if (result.hasSession) {
    console.log('Already signed in');
    return;
  }

  // Try to sign in first
  result = await signInTestUser();
  if (result.success) {
    console.log('Successfully signed in existing test user');
    return;
  }

  // If sign in failed, try to create user
  console.log('Sign in failed, trying to create test user...');
  result = await createTestUser();
  if (!result.success) {
    console.error('Failed to create test user:', result.error);
    return;
  }

  // Try to sign in again after creating user
  result = await signInTestUser();
  if (result.success) {
    console.log('Successfully created and signed in test user');
  } else {
    console.error('Failed to sign in after creating user:', result.error);
  }
}

// Export test credentials for use in components
export const TEST_CREDENTIALS = {
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
};
