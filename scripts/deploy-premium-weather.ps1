# Premium Weather Integration Deployment Script
# Version 1.3.0 - Premium Weather Release

Write-Host "🌦️  Starting Premium Weather Integration Build Process..." -ForegroundColor Green
Write-Host "Version: 1.3.0 | Build Profile: premium-weather" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n📋 Checking Prerequisites..." -ForegroundColor Yellow
if (-Not (Get-Command eas -ErrorAction SilentlyContinue)) {
    Write-Host "❌ EAS CLI not found. Please install with: npm install -g @expo/eas-cli" -ForegroundColor Red
    exit 1
}

if (-Not (Get-Command expo -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Expo CLI not found. Please install with: npm install -g @expo/cli" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check complete" -ForegroundColor Green

# Login check
Write-Host "`n🔐 Checking EAS Authentication..." -ForegroundColor Yellow
try {
    $loginStatus = eas whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Not logged in to EAS. Please run: eas login" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Authenticated with EAS: $loginStatus" -ForegroundColor Green
} catch {
    Write-Host "❌ EAS authentication check failed. Please run: eas login" -ForegroundColor Red
    exit 1
}

# Build confirmation
Write-Host "`n🚀 Ready to build Premium Weather Integration v1.3.0" -ForegroundColor Green
Write-Host "Features included:" -ForegroundColor White
Write-Host "  • Real-time weather integration" -ForegroundColor Cyan
Write-Host "  • Animated Basmilius Meteocons" -ForegroundColor Cyan
Write-Host "  • Calendar weather overlay" -ForegroundColor Cyan
Write-Host "  • Premium feature gating" -ForegroundColor Cyan
Write-Host "  • Location-based weather data" -ForegroundColor Cyan

$confirmation = Read-Host "`nProceed with build? (y/N)"
if ($confirmation -ne "y" -and $confirmation -ne "Y") {
    Write-Host "❌ Build cancelled by user" -ForegroundColor Red
    exit 0
}

# Pre-build checks
Write-Host "`n🔍 Running Pre-build Validation..." -ForegroundColor Yellow
Write-Host "Checking app.json configuration..."
$appJson = Get-Content "app.json" -Raw | ConvertFrom-Json
if ($appJson.expo.version -ne "1.3.0") {
    Write-Host "❌ Version mismatch in app.json. Expected 1.3.0, found: $($appJson.expo.version)" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Version validation passed" -ForegroundColor Green

Write-Host "Checking package.json configuration..."
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($packageJson.version -ne "1.3.0") {
    Write-Host "❌ Version mismatch in package.json. Expected 1.3.0, found: $($packageJson.version)" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Package version validation passed" -ForegroundColor Green

# Install dependencies
Write-Host "`n📦 Installing Dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Dependency installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

# Build iOS
Write-Host "`n🍎 Building iOS Production Release..." -ForegroundColor Blue
eas build --platform ios --profile premium-weather --non-interactive
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ iOS build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ iOS build completed successfully" -ForegroundColor Green

# Build Android
Write-Host "`n🤖 Building Android Production Release..." -ForegroundColor Green
eas build --platform android --profile premium-weather --non-interactive
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Android build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Android build completed successfully" -ForegroundColor Green

# Build summary
Write-Host "`n🎉 Premium Weather Integration Build Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Version: 1.3.0" -ForegroundColor White
Write-Host "Profile: premium-weather" -ForegroundColor White
Write-Host "Platforms: iOS + Android" -ForegroundColor White
Write-Host "Features: Weather Integration (Premium)" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test builds on physical devices" -ForegroundColor White
Write-Host "2. Verify premium upgrade flow works correctly" -ForegroundColor White
Write-Host "3. Test weather integration for premium users" -ForegroundColor White
Write-Host "4. Submit to app stores when ready" -ForegroundColor White

Write-Host "`n💡 Quick Commands:" -ForegroundColor Yellow
Write-Host "• Download builds: eas build:list" -ForegroundColor Cyan
Write-Host "• Submit to stores: eas submit --platform all --profile production" -ForegroundColor Cyan
Write-Host "• Update deployment: eas update --channel production" -ForegroundColor Cyan

Write-Host "`n✨ Premium Weather Integration v1.3.0 is ready for deployment!" -ForegroundColor Green