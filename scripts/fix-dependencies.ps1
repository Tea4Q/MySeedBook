# Dependency Cleanup Script
# This script fixes React version conflicts and removes problematic packages

Write-Host "🔧 MySeedBook Catalogue - Dependency Cleanup" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Step 1: Stop any running processes
Write-Host "1. Stopping development processes..." -ForegroundColor Yellow
$processes = Get-Process | Where-Object {$_.ProcessName -like "*expo*" -or $_.ProcessName -like "*node*" -or $_.ProcessName -like "*metro*"}
if ($processes) {
    $processes | Stop-Process -Force
    Write-Host "   Stopped running processes" -ForegroundColor Green
} else {
    Write-Host "   No processes to stop" -ForegroundColor Green
}

# Step 2: Clean npm cache
Write-Host "2. Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "   npm cache cleaned" -ForegroundColor Green

# Step 3: Try to remove node_modules (with retry logic)
Write-Host "3. Removing node_modules..." -ForegroundColor Yellow
$maxRetries = 3
$retryCount = 0

do {
    try {
        if (Test-Path "node_modules") {
            Remove-Item -Recurse -Force "node_modules" -ErrorAction Stop
            Write-Host "   node_modules removed successfully" -ForegroundColor Green
            break
        } else {
            Write-Host "   node_modules already removed" -ForegroundColor Green
            break
        }
    }
    catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "   Retry $retryCount/$maxRetries - waiting 2 seconds..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        } else {
            Write-Host "   Warning: Could not remove node_modules. Please close VS Code and try again." -ForegroundColor Red
            Write-Host "   Or manually delete the node_modules folder from Windows Explorer" -ForegroundColor Red
            break
        }
    }
} while ($retryCount -lt $maxRetries)

# Step 4: Remove package-lock.json
Write-Host "4. Removing package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force
    Write-Host "   package-lock.json removed" -ForegroundColor Green
} else {
    Write-Host "   package-lock.json not found" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Cleanup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit package.json to remove 'react-native-phone-number-input'" -ForegroundColor White
Write-Host "2. Run: npm install" -ForegroundColor White
Write-Host "3. Run: npx expo start" -ForegroundColor White
Write-Host ""
Write-Host "If you still get file permission errors:" -ForegroundColor Yellow
Write-Host "- Close VS Code completely" -ForegroundColor White
Write-Host "- Delete node_modules folder manually in Windows Explorer" -ForegroundColor White
Write-Host "- Reopen VS Code and run: npm install" -ForegroundColor White
