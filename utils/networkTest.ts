// Simple network connectivity test
export const testConnectivity = async (): Promise<boolean> => {
  try {
    // Test basic internet connectivity with a simple, fast endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch('https://httpbin.org/get', { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('Basic connectivity test failed:', error);
    return false;
  }
};

export const testSupabaseConnectivity = async (supabaseUrl: string, anonKey: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('Supabase connectivity test failed:', error);
    return false;
  }
};

export const getNetworkStatus = async () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  
  const basicConnectivity = await testConnectivity();
  const supabaseConnectivity = basicConnectivity ? await testSupabaseConnectivity(supabaseUrl, anonKey) : false;
  
  return {
    hasInternet: basicConnectivity,
    canReachSupabase: supabaseConnectivity,
    recommendation: !basicConnectivity 
      ? 'Check your internet connection' 
      : !supabaseConnectivity 
        ? 'Authentication service unavailable. Use Guest Login to continue.'
        : 'All systems operational'
  };
};
