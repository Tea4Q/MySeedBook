import { supabase } from '@/lib/supabase';

export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Check if we can get the user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('User data:', userData);
    if (userError) {
      console.error('User error:', userError);
    }
    
    // Test 2: Try a simple database query (check if seeds table exists)
    const { data: testData, error: testError } = await supabase
      .from('seeds')
      .select('count')
      .limit(1);
    
    console.log('Database test data:', testData);
    if (testError) {
      console.error('Database test error:', testError);
    }
    
    // Test 3: Check environment variables
    console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key (first 20 chars):', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20));
    
    return { userData, testData, userError, testError };
  } catch (error) {
    console.error('Connection test failed:', error);
    return { error };
  }
}
