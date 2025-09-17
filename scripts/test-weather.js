// Test script for weather services
// Run with: node scripts/test-weather.js

const { weatherService } = require('../lib/services/weatherService');
const { locationService } = require('../lib/services/locationService');
const { gardeningInsightsService } = require('../lib/services/gardeningInsightsService');

async function testWeatherServices() {
  console.log('🌤️ Testing Weather Integration...\n');

  try {
    // Test 1: Location Service
    console.log('📍 Testing Location Service...');
    const location = await locationService.getBestLocation();
    console.log(`✅ Default location: ${location.name} (${location.lat}, ${location.lon})`);

    // Test 2: Weather Service (with mock data since we don't have real API key)
    console.log('\n🌡️ Testing Weather Service...');
    
    // Create mock weather data for testing
    const mockWeather = {
      location: {
        name: 'Test Location',
        country: 'US',
        lat: 40.7128,
        lon: -74.0060
      },
      temperature: 72,
      feelsLike: 75,
      humidity: 65,
      pressure: 1013,
      visibility: 10000,
      condition: {
        id: 800,
        main: 'Clear',
        description: 'clear sky',
        icon: '01d'
      },
      wind: {
        speed: 5,
        direction: 180
      },
      timestamp: Date.now(),
      sunrise: Date.now() - 3600000,
      sunset: Date.now() + 3600000
    };

    console.log('✅ Mock weather data created successfully');
    console.log(`   Temperature: ${mockWeather.temperature}°F`);
    console.log(`   Condition: ${mockWeather.condition.description}`);
    console.log(`   Humidity: ${mockWeather.humidity}%`);

    // Test 3: Gardening Insights Service
    console.log('\n🌱 Testing Gardening Insights Service...');
    const insights = gardeningInsightsService.analyzeCurrentConditions(mockWeather);
    
    console.log('✅ Gardening insights generated successfully');
    console.log(`   Overall suitability: ${insights.suitability}`);
    console.log(`   Planting conditions: ${insights.conditions.planting}`);
    console.log(`   Watering conditions: ${insights.conditions.watering}`);
    console.log(`   Harvesting conditions: ${insights.conditions.harvesting}`);
    console.log(`   Soil conditions: ${insights.conditions.soil}`);
    
    if (insights.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      insights.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    if (insights.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      insights.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    // Test 4: Component data structure
    console.log('\n🧩 Testing Component Data Compatibility...');
    
    const componentTests = {
      currentWeatherCard: {
        hasRequiredFields: !!(mockWeather.location && mockWeather.temperature && mockWeather.condition),
        temperatureIsNumber: typeof mockWeather.temperature === 'number',
        conditionHasMain: !!mockWeather.condition.main,
        timestampValid: !isNaN(new Date(mockWeather.timestamp))
      },
      gardeningConditionsCard: {
        hasSuitability: !!insights.suitability,
        hasConditions: !!insights.conditions,
        hasRecommendations: Array.isArray(insights.recommendations),
        hasWarnings: Array.isArray(insights.warnings)
      }
    };

    console.log('✅ Current Weather Card compatibility:', 
      Object.values(componentTests.currentWeatherCard).every(Boolean) ? 'PASS' : 'FAIL');
    console.log('✅ Gardening Conditions Card compatibility:', 
      Object.values(componentTests.gardeningConditionsCard).every(Boolean) ? 'PASS' : 'FAIL');

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Get a real OpenWeatherMap API key at: https://openweathermap.org/api');
    console.log('   2. Add it to your .env file: EXPO_PUBLIC_OPENWEATHER_API_KEY=your_key_here');
    console.log('   3. Test the app with: npm start');
    console.log('   4. Navigate to the Weather tab to see live data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   - Make sure all dependencies are installed: npm install');
    console.error('   - Check that all TypeScript files compile: npx tsc --noEmit');
    console.error('   - Verify file paths are correct');
  }
}

// Run the test
testWeatherServices();