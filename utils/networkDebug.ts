import { Platform } from 'react-native';

export const debugNetwork = () => {
  console.log('=== NETWORK DEBUG ===');
  console.log('Platform:', Platform.OS);
  console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
  console.log('Has Anon Key:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  
  if (Platform.OS === 'android') {
    console.log('Android Network Debug - Testing connectivity...');
    
    // Test basic fetch
    fetch('https://httpbin.org/get')
      .then(response => {
        console.log('✅ Basic internet connectivity works:', response.status);
        return response.json();
      })
      .then(data => console.log('Basic fetch success:', data.url))
      .catch(error => console.log('❌ Basic internet test failed:', error.message));
    
    // Test Supabase connectivity
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''}`,
        }
      })
        .then(response => {
          console.log('✅ Supabase connectivity works:', response.status);
        })
        .catch(error => {
          console.log('❌ Supabase connectivity failed:', error.message);
          console.log('Error details:', error);
        });
    }
  }
  
  console.log('=== END DEBUG ===');
};

export const networkErrorHandler = (error: any, context: string) => {
  console.log(`❌ Network Error in ${context}:`, error.message);
  
  if (error.message?.includes('Network request failed')) {
    console.log('💡 Network request failed suggestions:');
    console.log('1. Check internet connectivity');
    console.log('2. Verify Supabase URL is accessible');
    console.log('3. Check Android network security config');
    console.log('4. Try clearing cache and rebuilding');
  }
  
  return error;
};
