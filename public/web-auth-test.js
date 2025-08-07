/**
 * Test script to verify web sign out functionality
 * Run this in the browser console to test the improvements
 */

// Test function to check current auth state
window.testWebAuthState = async () => {
  console.log('=== Testing Web Auth State ===');
  
  // Check if supabase is available
  if (typeof window.supabase === 'undefined') {
    console.log('Supabase not available in window object');
    return;
  }
  
  try {
    const { data: { session }, error } = await window.supabase.auth.getSession();
    console.log('Session check result:');
    console.log('- Session exists:', !!session);
    console.log('- User email:', session?.user?.email || 'No user');
    console.log('- Error:', error?.message || 'No error');
    
    // Check localStorage
    console.log('\n--- Storage Analysis ---');
    const allKeys = Object.keys(localStorage);
    console.log('Total localStorage keys:', allKeys.length);
    
    const supabaseKeys = allKeys.filter(key => 
      key.includes('supabase') || 
      key.includes('sb-') || 
      key.includes('gotrue') ||
      key.includes('auth')
    );
    
    console.log('Supabase-related keys:', supabaseKeys);
    supabaseKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`  ${key}: ${value ? 'Present' : 'Empty'}`);
    });
    
  } catch (err) {
    console.log('Error checking auth state:', err);
  }
};

// Test function to force clear all auth data
window.forceWebClear = () => {
  console.log('=== Force Clearing Web Auth Data ===');
  
  const keysToRemove = [];
  
  // Get all keys that might be auth-related
  Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || 
        key.includes('sb-') || 
        key.includes('gotrue') ||
        key.includes('auth') ||
        key.includes('token') ||
        key.includes('session')) {
      keysToRemove.push(key);
    }
  });
  
  console.log('Keys to remove:', keysToRemove);
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log('Removed:', key);
  });
  
  // Also clear sessionStorage
  Object.keys(sessionStorage).forEach(key => {
    if (key.includes('supabase') || 
        key.includes('sb-') || 
        key.includes('gotrue') ||
        key.includes('auth')) {
      sessionStorage.removeItem(key);
      console.log('Removed from sessionStorage:', key);
    }
  });
  
  console.log('Force clear completed');
  console.log('Consider refreshing the page');
};

console.log('Web auth test functions loaded:');
console.log('- testWebAuthState() - Check current auth state');
console.log('- forceWebClear() - Force clear all auth data');
