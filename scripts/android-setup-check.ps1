# Android Development Setup for MySeedBook Catalogue
# PowerShell script to help set up Android development on Windows

Write-Host "🤖 MySeedBook Catalogue - Android Setup Helper" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if Android Studio is already installed
$androidStudioPath = "${env:ProgramFiles}\Android\Android Studio\bin\studio64.exe"
$androidStudioPath2 = "${env:LOCALAPPDATA}\Programs\Android Studio\bin\studio64.exe"

if (Test-Path $androidStudioPath -or Test-Path $androidStudioPath2) {
    Write-Host "✅ Android Studio appears to be installed" -ForegroundColor Green
} else {
    Write-Host "❌ Android Studio not found" -ForegroundColor Red
    Write-Host "📥 Please download from: https://developer.android.com/studio" -ForegroundColor Yellow
    Write-Host "💡 After installation, re-run this script" -ForegroundColor Cyan
    exit 1
}

# Check for Android SDK
$androidHome = $env:ANDROID_HOME
if (-not $androidHome) {
    $androidHome = "${env:LOCALAPPDATA}\Android\Sdk"
}

Write-Host "`n🔍 Checking Android SDK..." -ForegroundColor Cyan

if (Test-Path $androidHome) {
    Write-Host "✅ Android SDK found at: $androidHome" -ForegroundColor Green
    
    # Check for platform-tools
    $adbPath = "$androidHome\platform-tools\adb.exe"
    if (Test-Path $adbPath) {
        Write-Host "✅ ADB found: $adbPath" -ForegroundColor Green
    } else {
        Write-Host "❌ ADB not found in platform-tools" -ForegroundColor Red
    }
    
    # Check for emulator
    $emulatorPath = "$androidHome\emulator\emulator.exe"
    if (Test-Path $emulatorPath) {
        Write-Host "✅ Emulator found: $emulatorPath" -ForegroundColor Green
    } else {
        Write-Host "❌ Emulator not found" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Android SDK not found" -ForegroundColor Red
    Write-Host "💡 Run Android Studio and complete the setup wizard" -ForegroundColor Cyan
}

# Check PATH environment
Write-Host "`n🛤️ Checking PATH configuration..." -ForegroundColor Cyan
$pathItems = $env:PATH -split ';'
$platformToolsInPath = $pathItems | Where-Object { $_ -like "*platform-tools*" }
$emulatorInPath = $pathItems | Where-Object { $_ -like "*emulator*" }

if ($platformToolsInPath) {
    Write-Host "✅ platform-tools in PATH" -ForegroundColor Green
} else {
    Write-Host "❌ platform-tools not in PATH" -ForegroundColor Red
    Write-Host "💡 Add this to your PATH: $androidHome\platform-tools" -ForegroundColor Cyan
}

if ($emulatorInPath) {
    Write-Host "✅ emulator in PATH" -ForegroundColor Green
} else {
    Write-Host "❌ emulator not in PATH" -ForegroundColor Red
    Write-Host "💡 Add this to your PATH: $androidHome\emulator" -ForegroundColor Cyan
}

# List available emulators
Write-Host "`n📱 Checking for Android Virtual Devices..." -ForegroundColor Cyan
try {
    if (Test-Path "$androidHome\emulator\emulator.exe") {
        $emulators = & "$androidHome\emulator\emulator.exe" -list-avds 2>$null
        if ($emulators) {
            Write-Host "✅ Available emulators:" -ForegroundColor Green
            $emulators | ForEach-Object { Write-Host "   - $_" -ForegroundColor White }
        } else {
            Write-Host "❌ No emulators found" -ForegroundColor Red
            Write-Host "💡 Create one in Android Studio: Tools > AVD Manager" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "❌ Could not list emulators" -ForegroundColor Red
}

# Check if development server is running
Write-Host "`n🚀 Development Server Status..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Expo dev server is running" -ForegroundColor Green
        Write-Host "🌐 Web: http://localhost:8081" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Expo dev server not running" -ForegroundColor Red
    Write-Host "💡 Run: npm start" -ForegroundColor Cyan
}

Write-Host "`n📋 Quick Setup Checklist:" -ForegroundColor Magenta
Write-Host "1. ✓ Install Android Studio" -ForegroundColor White
Write-Host "2. ✓ Complete Android Studio setup wizard" -ForegroundColor White
Write-Host "3. ✓ Create an Android Virtual Device (AVD)" -ForegroundColor White
Write-Host "4. ✓ Add SDK tools to PATH" -ForegroundColor White
Write-Host "5. ✓ Start your app with 'npm start'" -ForegroundColor White
Write-Host "6. ✓ Press 'a' to open Android emulator" -ForegroundColor White

Write-Host "`n🎯 Next Steps:" -ForegroundColor Magenta
Write-Host "- If Android Studio is missing: Download and install it" -ForegroundColor White
Write-Host "- If AVD is missing: Open Android Studio > Tools > AVD Manager" -ForegroundColor White
Write-Host "- If PATH is incomplete: Add SDK directories to system PATH" -ForegroundColor White
Write-Host "- Test your app: npm start, then press 'a' for Android" -ForegroundColor White

Write-Host "`n✨ Once everything is set up, your MySeedBook Catalogue app will run smoothly on Android!" -ForegroundColor Green
