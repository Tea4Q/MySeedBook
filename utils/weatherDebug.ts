// Debug utility to help troubleshoot weather API issues
export const debugWeatherAPI = () => {
  console.log('🐛 Weather API Debug Info:');
  console.log('API Key (first 10 chars):', process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY?.substring(0, 10) + '...');
  console.log('API Key exists:', !!process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY);
  console.log('API Key length:', process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY?.length);
  console.log('Base URL:', 'https://api.openweathermap.org/data/2.5');
  console.log('Units:', 'imperial');
  
  // Test URL construction
  const testLat = 39.8283;
  const testLon = -98.5795;
  const testUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${testLat}&lon=${testLon}&appid=${process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY}&units=imperial`;
  console.log('Test URL:', testUrl);
};

export const testWeatherAPICall = async () => {
  console.log('🧪 Testing Weather API Call...');
  
  try {
    const testLat = 39.8283;
    const testLon = -98.5795;
    const testUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${testLat}&lon=${testLon}&appid=${process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY}&units=imperial`;
    
    const response = await fetch(testUrl);
    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Call Successful!');
      console.log('Location:', data.name);
      console.log('Temperature:', data.main?.temp);
      console.log('Description:', data.weather?.[0]?.description);
      return data;
    } else {
      console.log('❌ API Call Failed');
      const errorText = await response.text();
      console.log('Error Response:', errorText);
      return null;
    }
  } catch (error) {
    console.log('❌ API Call Error:', error);
    return null;
  }
};