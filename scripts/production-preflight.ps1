# Production Build Pre-Flight Script
# Run this before building for Google Play Store

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MySeedBook - Production Build Pre-Flight" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()
$passed = 0
$total = 0

function Test-Requirement {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [bool]$IsWarning = $false
    )
    
    $script:total++
    Write-Host "Checking: $Name..." -NoNewline
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host " ✓" -ForegroundColor Green
            $script:passed++
            return $true
        } else {
            if ($IsWarning) {
                Write-Host " ⚠" -ForegroundColor Yellow
                $script:warnings += $Name
            } else {
                Write-Host " ✗" -ForegroundColor Red
                $script:errors += $Name
            }
            return $false
        }
    } catch {
        if ($IsWarning) {
            Write-Host " ⚠" -ForegroundColor Yellow
            $script:warnings += "$Name - $_"
        } else {
            Write-Host " ✗" -ForegroundColor Red
            $script:errors += "$Name - $_"
        }
        return $false
    }
}

Write-Host "ENVIRONMENT CHECKS" -ForegroundColor Yellow
Write-Host "==================" -ForegroundColor Yellow
Write-Host ""

# Check Node.js
Test-Requirement "Node.js installed" {
    $null -ne (Get-Command node -ErrorAction SilentlyContinue)
}

# Check npm
Test-Requirement "npm installed" {
    $null -ne (Get-Command npm -ErrorAction SilentlyContinue)
}

# Check EAS CLI
Test-Requirement "EAS CLI installed" {
    $null -ne (Get-Command eas -ErrorAction SilentlyContinue)
}

# Check Expo login
Test-Requirement "Logged into Expo" {
    try {
        $result = eas whoami 2>$null
        $result -and $result -ne "Not logged in"
    } catch {
        $false
    }
}

Write-Host ""
Write-Host "CONFIGURATION CHECKS" -ForegroundColor Yellow
Write-Host "====================" -ForegroundColor Yellow
Write-Host ""

# Check app.json exists
Test-Requirement "app.json exists" {
    Test-Path "app.json"
}

# Check eas.json exists
Test-Requirement "eas.json exists" {
    Test-Path "eas.json"
}

# Check package.json
Test-Requirement "package.json exists" {
    Test-Path "package.json"
}

# Check version in app.json
Test-Requirement "App version configured" {
    $appJson = Get-Content "app.json" -Raw | ConvertFrom-Json
    $appJson.expo.version -ne $null
} -IsWarning $true

# Check Android package name
Test-Requirement "Android package name configured" {
    $appJson = Get-Content "app.json" -Raw | ConvertFrom-Json
    $appJson.expo.android.package -eq "com.myseedbook.catalogue"
}

Write-Host ""
Write-Host "ASSET CHECKS" -ForegroundColor Yellow
Write-Host "============" -ForegroundColor Yellow
Write-Host ""

# Check app icon
Test-Requirement "App icon exists" {
    Test-Path "assets/images/icon1.png"
}

# Check splash screen
Test-Requirement "Splash screen exists" {
    Test-Path "assets/images/splashScreenImage.png"
}

# Check favicon
Test-Requirement "Favicon exists" {
    Test-Path "assets/images/favicon.png"
} -IsWarning $true

Write-Host ""
Write-Host "ENVIRONMENT VARIABLES" -ForegroundColor Yellow
Write-Host "=====================" -ForegroundColor Yellow
Write-Host ""

# Check Supabase URL
Test-Requirement "SUPABASE_URL configured" {
    $null -ne $env:EXPO_PUBLIC_SUPABASE_URL -and $env:EXPO_PUBLIC_SUPABASE_URL.Length -gt 0
}

# Check Supabase Anon Key
Test-Requirement "SUPABASE_ANON_KEY configured" {
    $null -ne $env:EXPO_PUBLIC_SUPABASE_ANON_KEY -and $env:EXPO_PUBLIC_SUPABASE_ANON_KEY.Length -gt 0
}

# Check Weather API Key
Test-Requirement "Weather API Key configured" {
    $null -ne $env:EXPO_PUBLIC_WEATHER_API_KEY -and $env:EXPO_PUBLIC_WEATHER_API_KEY.Length -gt 0
}

Write-Host ""
Write-Host "DEPENDENCIES CHECK" -ForegroundColor Yellow
Write-Host "==================" -ForegroundColor Yellow
Write-Host ""

# Check node_modules
Test-Requirement "Dependencies installed (node_modules exists)" {
    Test-Path "node_modules"
}

# Check for common issues
Test-Requirement "No package-lock conflicts" {
    if (Test-Path "package-lock.json") {
        $content = Get-Content "package-lock.json" -Raw
        -not ($content -match "<<<<<<< HEAD" -or $content -match "=======")
    } else {
        $true
    }
} -IsWarning $true

Write-Host ""
Write-Host "CODE QUALITY CHECKS" -ForegroundColor Yellow
Write-Host "===================" -ForegroundColor Yellow
Write-Host ""

# Check for console.logs (warning only)
Test-Requirement "No debug console.logs (warning)" {
    $logs = Get-ChildItem -Path "." -Include "*.tsx","*.ts","*.jsx","*.js" -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch "node_modules" } |
        Select-String -Pattern "console\.(log|debug)" |
        Measure-Object
    
    $logs.Count -eq 0
} -IsWarning $true

# Check for TODO comments (warning only)
Test-Requirement "No TODO comments (warning)" {
    $todos = Get-ChildItem -Path "." -Include "*.tsx","*.ts","*.jsx","*.js" -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notmatch "node_modules" } |
        Select-String -Pattern "TODO:|FIXME:" |
        Measure-Object
    
    $todos.Count -eq 0
} -IsWarning $true

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Tests Passed: $passed / $total" -ForegroundColor $(if ($errors.Count -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

if ($errors.Count -gt 0) {
    Write-Host "❌ CRITICAL ISSUES ($($errors.Count)):" -ForegroundColor Red
    foreach ($err in $errors) {
        Write-Host "   • $err" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please fix these issues before building for production!" -ForegroundColor Red
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "⚠️  WARNINGS ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($warn in $warnings) {
        Write-Host "   • $warn" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "These warnings are not critical but should be addressed." -ForegroundColor Yellow
    Write-Host ""
}

if ($errors.Count -eq 0) {
    Write-Host "All critical checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You are ready to build for production! Run:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   eas build --platform android --profile production" -ForegroundColor White
    Write-Host ""
    Write-Host "Or for testing APK:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   eas build --platform android --profile production-apk" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "Please fix the issues above before proceeding." -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Show current app info
Write-Host "CURRENT APP CONFIGURATION" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
try {
    $appJson = Get-Content "app.json" -Raw | ConvertFrom-Json
    Write-Host ""
    Write-Host "App Name: $($appJson.expo.name)" -ForegroundColor White
    Write-Host "Version: $($appJson.expo.version)" -ForegroundColor White
    Write-Host "Android Package: $($appJson.expo.android.package)" -ForegroundColor White
    Write-Host "Version Code: $($appJson.expo.android.versionCode)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "Could not read app.json" -ForegroundColor Yellow
}

Write-Host "For detailed guide, see: GOOGLE_PLAY_PRODUCTION_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
