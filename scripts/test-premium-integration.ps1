# Premium Feature Testing Script
# Test the weather integration premium upgrade flow

Write-Host "🧪 Premium Weather Integration Test Suite" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

# Function to check file exists
function Test-FileExists {
    param([string]$filePath, [string]$description)
    if (Test-Path $filePath) {
        Write-Host "✅ $description" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $description - File not found: $filePath" -ForegroundColor Red
        return $false
    }
}

# Function to check content contains text
function Test-ContentContains {
    param([string]$filePath, [string]$searchText, [string]$description)
    if ((Get-Content $filePath -Raw) -match [regex]::Escape($searchText)) {
        Write-Host "✅ $description" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $description - Text not found: $searchText" -ForegroundColor Red
        return $false
    }
}

Write-Host "`n📁 File Structure Tests..." -ForegroundColor Yellow
$tests = @()

# Core files
$tests += Test-FileExists "app/(tabs)/weather.tsx" "Weather tab exists"
$tests += Test-FileExists "app/(tabs)/calendar.tsx" "Calendar tab exists"
$tests += Test-FileExists "components/Weather/WeatherService.ts" "Weather service exists"
$tests += Test-FileExists "assets/meteocons" "Meteocons assets exist"

Write-Host "`n🔒 Premium Integration Tests..." -ForegroundColor Yellow

# Premium gating tests
$tests += Test-ContentContains "app/(tabs)/weather.tsx" "checkFeature('weather_integration')" "Weather tab has premium gating"
$tests += Test-ContentContains "app/(tabs)/weather.tsx" "handlePremiumUpgrade" "Weather tab has upgrade handler"
$tests += Test-ContentContains "app/(tabs)/calendar.tsx" "checkFeature('weather_integration')" "Calendar has conditional weather"

Write-Host "`n🌦️  Weather Integration Tests..." -ForegroundColor Yellow

# Weather component tests
$tests += Test-ContentContains "components/Weather/WeatherService.ts" "OPENWEATHER_API_KEY" "Weather service has API key"
$tests += Test-ContentContains "components/Weather/WeatherService.ts" "32.7767" "Weather service has Dallas coordinates"
$tests += Test-ContentContains "app/(tabs)/weather.tsx" "WeatherService" "Weather tab imports service"

Write-Host "`n📱 Configuration Tests..." -ForegroundColor Yellow

# App configuration tests
$tests += Test-ContentContains "app.json" '"version": "1.3.0"' "App version is 1.3.0"
$tests += Test-ContentContains "package.json" '"version": "1.3.0"' "Package version is 1.3.0"
$tests += Test-ContentContains "app.json" "NSLocationWhenInUseUsageDescription" "iOS location permission set"
$tests += Test-ContentContains "app.json" "ACCESS_FINE_LOCATION" "Android location permission set"

Write-Host "`n🚀 Build Configuration Tests..." -ForegroundColor Yellow

# EAS build tests
$tests += Test-ContentContains "eas.json" "premium-weather" "Premium weather build profile exists"
$tests += Test-ContentContains "eas.json" "FEATURE_WEATHER_INTEGRATION" "Weather feature flag set"

Write-Host "`n📝 Documentation Tests..." -ForegroundColor Yellow

# Documentation tests
$tests += Test-FileExists "RELEASE_NOTES_v1.3.0.md" "Release notes exist"
$tests += Test-ContentContains "STORE_DESCRIPTIONS.md" "weather integration" "Store descriptions mention weather"

# Summary
Write-Host "`n📊 Test Results Summary" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

$passedTests = $tests | Where-Object { $_ -eq $true }
$failedTests = $tests | Where-Object { $_ -eq $false }

Write-Host "Total Tests: $($tests.Count)" -ForegroundColor White
Write-Host "Passed: $($passedTests.Count)" -ForegroundColor Green
Write-Host "Failed: $($failedTests.Count)" -ForegroundColor Red

if ($failedTests.Count -eq 0) {
    Write-Host "`n🎉 All tests passed! Premium weather integration is ready for deployment." -ForegroundColor Green
    Write-Host "`n🚀 Ready to run: .\scripts\deploy-premium-weather.ps1" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  Some tests failed. Please review the issues above before deployment." -ForegroundColor Yellow
}

Write-Host "`n💡 Manual Testing Checklist:" -ForegroundColor Yellow
Write-Host "1. Start app in development mode: npx expo start" -ForegroundColor White
Write-Host "2. Navigate to Weather tab" -ForegroundColor White
Write-Host "3. Verify upgrade prompt shows for non-premium users" -ForegroundColor White
Write-Host "4. Test premium upgrade flow (if payment system is connected)" -ForegroundColor White
Write-Host "5. Verify weather data loads for premium users" -ForegroundColor White
Write-Host "6. Check calendar shows weather icons for premium users only" -ForegroundColor White
Write-Host "7. Test on both iOS and Android simulators" -ForegroundColor White