# MySeedBook Catalogue - Build and Test Script
# PowerShell script for building and testing the app

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("preview", "production", "development", "web")]
    [string]$BuildType = "preview",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("android", "ios", "all")]
    [string]$Platform = "android",
    
    [Parameter(Mandatory=$false)]
    [switch]$IconTest = $false
)

Write-Host "MySeedBook Catalogue Build Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check if EAS CLI is installed
try {
    $easVersion = eas --version 2>$null
    Write-Host "[OK] EAS CLI found: $easVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] EAS CLI not found. Installing..." -ForegroundColor Red
    npm install -g @expo/eas-cli
}

# Check if logged in to EAS
Write-Host "`nChecking EAS authentication..." -ForegroundColor Cyan
try {
    $whoami = eas whoami 2>$null
    if ($whoami) {
        Write-Host "[OK] Logged in as: $whoami" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Not logged in to EAS. Please run: eas login" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Please login first: eas login" -ForegroundColor Red
    exit 1
}

# Icon validation
if ($IconTest) {
    Write-Host "`nValidating app icon..." -ForegroundColor Cyan
    $iconPath = "assets\images\icon.png"
    
    if (Test-Path $iconPath) {
        $iconFile = Get-ItemProperty $iconPath
        $iconSize = $iconFile.Length
        Write-Host "[OK] Icon found: $iconPath ($iconSize bytes)" -ForegroundColor Green
        
        # Check if it's likely a proper size (rough estimate for 1024x1024 PNG)
        if ($iconSize -gt 50000 -and $iconSize -lt 2000000) {
            Write-Host "[OK] Icon size looks reasonable for 1024x1024" -ForegroundColor Green
        } else {
            Write-Host "[WARNING] Icon size may not be optimal. Expected ~50KB-2MB for 1024x1024 PNG" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[ERROR] Icon not found at: $iconPath" -ForegroundColor Red
        Write-Host "   Please ensure you have a 1024x1024 square icon at this location" -ForegroundColor Yellow
        exit 1
    }
}

# Pre-build checks
Write-Host "`nRunning pre-build checks..." -ForegroundColor Cyan
Write-Host "   Build Type: $BuildType" -ForegroundColor White
Write-Host "   Platform: $Platform" -ForegroundColor White

# Clean install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Cyan
npm install

# Git commit step - Ensure all changes are committed before build
Write-Host "`nChecking git status and committing changes..." -ForegroundColor Cyan
try {
    # Check if there are any changes to commit
    $gitStatus = git status --porcelain 2>$null
    if ($gitStatus) {
        Write-Host "[INFO] Found uncommitted changes. Committing before build..." -ForegroundColor Yellow
        
        # Add all files (modified, new, deleted)
        git add -A
        
        # Create commit with timestamp and build type
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = "Pre-build commit ($BuildType) - $timestamp"
        git commit -m $commitMessage
        
        Write-Host "[OK] Changes committed: $commitMessage" -ForegroundColor Green
        
        # Optional: Push to remote (commented out by default)
        # Uncomment the next line if you want to auto-push before builds
        # git push origin main
        
    } else {
        Write-Host "[OK] No uncommitted changes found" -ForegroundColor Green
    }
} catch {
    Write-Host "[WARNING] Git commit failed or not in a git repository" -ForegroundColor Yellow
    Write-Host "   You can manually commit changes with: git add -A && git commit -m 'Pre-build commit'" -ForegroundColor Cyan
    Write-Host "   Continuing with build process..." -ForegroundColor Yellow
}

# Build based on type and platform
Write-Host "`nStarting build process..." -ForegroundColor Cyan

switch ($BuildType) {
    "web" {
        Write-Host "Building for web..." -ForegroundColor Yellow
        npx expo export --platform web
        Write-Host "[OK] Web build complete! Check the 'dist' folder" -ForegroundColor Green
        Write-Host "   You can serve it locally with: npx serve dist" -ForegroundColor Cyan
    }
    "development" {
        Write-Host "Starting development build..." -ForegroundColor Yellow
        if ($Platform -eq "android" -or $Platform -eq "all") {
            eas build --platform android --profile development --non-interactive
        }
        if ($Platform -eq "ios" -or $Platform -eq "all") {
            eas build --platform ios --profile development --non-interactive
        }
    }
    "preview" {
        Write-Host "Building preview version (great for testing icons!)..." -ForegroundColor Yellow
        if ($Platform -eq "android" -or $Platform -eq "all") {
            Write-Host "Building Android APK..." -ForegroundColor Cyan
            eas build --platform android --profile preview --non-interactive
        }
        if ($Platform -eq "ios" -or $Platform -eq "all") {
            Write-Host "Building iOS preview..." -ForegroundColor Cyan
            eas build --platform ios --profile preview --non-interactive
        }
    }
    "production" {
        Write-Host "Building production version..." -ForegroundColor Yellow
        Write-Host "[WARNING] This will increment version numbers!" -ForegroundColor Yellow
        $confirm = Read-Host "Continue with production build? (y/N)"
        if ($confirm -eq 'y' -or $confirm -eq 'Y') {
            if ($Platform -eq "android" -or $Platform -eq "all") {
                eas build --platform android --profile production --non-interactive
            }
            if ($Platform -eq "ios" -or $Platform -eq "all") {
                eas build --platform ios --profile production --non-interactive
            }
        } else {
            Write-Host "Production build cancelled." -ForegroundColor Yellow
            exit 0
        }
    }
}

Write-Host "`nBuild process completed!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "   1. Check your EAS dashboard: https://expo.dev/accounts/[your-account]/projects/myseedbook-catalogue/builds" -ForegroundColor White
Write-Host "   2. Download the build when ready" -ForegroundColor White
Write-Host "   3. Install on device to test icon and functionality" -ForegroundColor White
Write-Host "   4. Verify icon appears correctly on home screen" -ForegroundColor White

if ($BuildType -eq "preview") {
    Write-Host "`nIcon Testing Checklist:" -ForegroundColor Magenta
    Write-Host "   - Icon appears on device home screen" -ForegroundColor White
    Write-Host "   - Icon is square (not stretched)" -ForegroundColor White
    Write-Host "   - Icon is clear and readable at small sizes" -ForegroundColor White
    Write-Host "   - Icon matches your app's gardening theme" -ForegroundColor White
    Write-Host "   - Background color works with adaptive icons (Android)" -ForegroundColor White
}
