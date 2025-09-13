# Production Build Script for MySeedBook Catalogue (Windows PowerShell)
# Run this script to create a production-ready build

Write-Host "🚀 MySeedBook Catalogue - Production Build Script" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Function to check if command exists
function Test-CommandExists {
    param($command)
    $exists = $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
    return $exists
}

# Pre-build validation
Write-Host "🔍 Pre-build validation..." -ForegroundColor Yellow

# Check if EAS CLI is installed
if (-not (Test-CommandExists "eas")) {
    Write-Host "❌ EAS CLI not found. Installing..." -ForegroundColor Red
    npm install -g @expo/eas-cli@latest
}

# Check if user is logged in to Expo
$loggedIn = $false
try {
    $whoami = eas whoami 2>$null
    if ($whoami) { $loggedIn = $true }
} catch {
    $loggedIn = $false
}

if (-not $loggedIn) {
    Write-Host "❌ Not logged in to Expo. Please run 'eas login' first." -ForegroundColor Red
    exit 1
}

# Validate environment
Write-Host "🔧 Validating environment..." -ForegroundColor Yellow

# Check for required files
$requiredFiles = @("app.json", "eas.json", "package.json")
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Missing required file: $file" -ForegroundColor Red
        exit 1
    }
}

# Check for production environment variables
if (-not (Test-Path ".env.production") -and -not (Test-Path ".env")) {
    Write-Host "⚠️ No environment file found. Make sure production environment is configured." -ForegroundColor Yellow
}

# Security scan
Write-Host "🔒 Running production security scan..." -ForegroundColor Yellow

# Check for authentication bypasses
$bypassCheck = Select-String -Path "app\**\*.tsx", "app\**\*.ts", "components\**\*.tsx", "components\**\*.ts", "lib\**\*.tsx", "lib\**\*.ts" -Pattern "bypass|Bypass|BYPASS" -ErrorAction SilentlyContinue
if ($bypassCheck) {
    Write-Host "❌ CRITICAL: Authentication bypass found! Remove before production." -ForegroundColor Red
    $bypassCheck | ForEach-Object { Write-Host $_.ToString() -ForegroundColor Red }
    exit 1
}

# Check for debug code
$debugCheck = Select-String -Path "app\**\*.tsx", "app\**\*.ts", "components\**\*.tsx", "components\**\*.ts" -Pattern "console\.log|console\.debug|alert\(" -ErrorAction SilentlyContinue
if ($debugCheck) {
    $debugCount = ($debugCheck | Measure-Object).Count
    Write-Host "⚠️ Found $debugCount debug statements - review before production" -ForegroundColor Yellow
}

Write-Host "✅ Security scan completed" -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Run TypeScript check
Write-Host "🔍 Running TypeScript check..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript errors found. Fix before building." -ForegroundColor Red
    exit 1
}

# Run Expo doctor
Write-Host "🩺 Running Expo doctor..." -ForegroundColor Yellow
npx expo doctor

Write-Host "✅ All validations passed!" -ForegroundColor Green
Write-Host ""

# Build options
Write-Host "📱 Select build option:" -ForegroundColor Yellow
Write-Host "1. Production Android (AAB for Play Store)"
Write-Host "2. Production iOS (for App Store)"
Write-Host "3. Production Both Platforms"
Write-Host "4. Production Android APK (for testing)"
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "🤖 Building Android production (AAB)..." -ForegroundColor Green
        eas build --platform android --profile production --non-interactive
    }
    "2" {
        Write-Host "🍎 Building iOS production..." -ForegroundColor Green
        eas build --platform ios --profile production --non-interactive
    }
    "3" {
        Write-Host "📱 Building both platforms..." -ForegroundColor Green
        eas build --platform all --profile production --non-interactive
    }
    "4" {
        Write-Host "🤖 Building Android APK..." -ForegroundColor Green
        eas build --platform android --profile production-apk --non-interactive
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test the build on physical devices"
    Write-Host "2. Submit to app stores if testing passes"
    Write-Host "3. Monitor for any production issues"
    Write-Host ""
    Write-Host "🔗 Check build status: https://expo.dev/" -ForegroundColor Cyan
} else {
    Write-Host "❌ Build failed. Check the logs above." -ForegroundColor Red
    exit 1
}
