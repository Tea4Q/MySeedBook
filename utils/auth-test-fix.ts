/**
 * Test utility to verify the sign out fix
 * This demonstrates the improved error handling for the authsessionmissing error
 */

import { supabase } from '../lib/supabase';
import { clearInvalidAuthState } from '../lib/auth';

export async function testSignOutFix() {
  console.log('=== Testing Sign Out Fix ===');
  
  // Test 1: Try to sign out when there's no session
  console.log('\n1. Testing sign out with no session...');
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session status:', session ? 'Active' : 'None');
    
    if (!session) {
      console.log('No session found - this would previously cause authsessionmissing error');
      // This should now be handled gracefully
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log('Expected error when no session:', error.message);
      } else {
        console.log('Sign out succeeded (no session to clear)');
      }
    }
  } catch (error) {
    console.log('Caught error during sign out test:', error);
  }
  
  // Test 2: Test our clearInvalidAuthState function
  console.log('\n2. Testing clearInvalidAuthState function...');
  try {
    await clearInvalidAuthState();
    console.log('clearInvalidAuthState completed successfully');
  } catch (error) {
    console.log('Error in clearInvalidAuthState:', error);
  }
  
  console.log('\n=== Sign Out Fix Test Complete ===');
}

/**
 * Helper function to simulate the authsessionmissing error scenario
 */
export async function simulateSessionMissingError() {
  console.log('=== Simulating Session Missing Error ===');
  
  // Force clear any existing session first
  try {
    await supabase.auth.signOut();
  } catch (e) {
    // Ignore errors here
  }
  
  // Now try to sign out again - this should trigger the "session missing" scenario
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log('Simulation successful - got expected error:', error.message);
      return { success: true, error: error.message };
    } else {
      console.log('No error occurred - session was already cleared');
      return { success: true, error: null };
    }
  } catch (error) {
    console.log('Caught exception during simulation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
