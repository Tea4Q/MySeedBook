# Console Log Cleanup Script for Production Build
# This script replaces console.log statements with conditional logger calls

$rootPath = "C:\dev\GardeningCatalogue"
Set-Location $rootPath

# Files that need console.log cleanup (excluding node_modules)
$filesToClean = @(
    "app\(tabs)\settings.tsx",
    "app\(tabs)\select-supplier.tsx", 
    "app\(tabs)\calendar.tsx",
    "app\(tabs)\index.tsx",
    "app\(tabs)\manage-suppliers.tsx",
    "app\add-seed.tsx",
    "app\auth\index.tsx",
    "components\DevBanner\index.tsx",
    "components\ImageCapture.tsx",
    "components\ImageHandler\index.tsx",
    "components\PhotoButtons.tsx",
    "components\SupplierSelect\index.tsx",
    "lib\theme.tsx",
    "utils\auth-test-fix.ts"
)

Write-Host "🧹 Starting console log cleanup for production build..." -ForegroundColor Yellow

foreach ($file in $filesToClean) {
    $fullPath = Join-Path $rootPath $file
    
    if (Test-Path $fullPath) {
        Write-Host "📝 Processing: $file" -ForegroundColor Cyan
        
        # Get file content
        $content = Get-Content $fullPath -Raw
        
        # Check if logger import already exists
        if ($content -notmatch "import.*logger.*from.*utils/logger") {
            # Add logger import after existing imports
            $content = $content -replace "(import.*from.*react.*;\s*)", "`$1`nimport { logger } from '@/utils/logger';"
        }
        
        # Replace console.log with logger.log
        $content = $content -replace "console\.log\(", "logger.log("
        
        # Replace console.warn with logger.warn  
        $content = $content -replace "console\.warn\(", "logger.warn("
        
        # Replace console.info with logger.info
        $content = $content -replace "console\.info\(", "logger.info("
        
        # Replace console.debug with logger.debug
        $content = $content -replace "console\.debug\(", "logger.debug("
        
        # Keep console.error as-is (important for production error tracking)
        
        # Write back to file
        Set-Content $fullPath $content -NoNewline
        
        # Count remaining console statements
        $consoleCount = (Select-String -Path $fullPath -Pattern "console\." -AllMatches).Matches.Count
        Write-Host "   ✅ Processed. Remaining console statements: $consoleCount" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  File not found: $file" -ForegroundColor Yellow
    }
}

# Clean up debug utility files
$debugFiles = @(
    "utils\auth-test-fix.ts",
    "utils\debug-supabase.ts", 
    "utils\web-auth-debug.ts"
)

Write-Host "`n🗑️  Removing debug utility files..." -ForegroundColor Yellow
foreach ($debugFile in $debugFiles) {
    $fullPath = Join-Path $rootPath $debugFile
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "   ✅ Deleted: $debugFile" -ForegroundColor Green
    }
}

Write-Host "`n🎉 Console log cleanup completed!" -ForegroundColor Green
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   • Replaced console.log/warn/info/debug with conditional logger calls" -ForegroundColor White
Write-Host "   • Kept console.error for production error tracking" -ForegroundColor White  
Write-Host "   • Removed debug utility files" -ForegroundColor White
Write-Host "   • Added logger imports where needed" -ForegroundColor White

Write-Host "`n🔍 Run 'npm run build' to test production build" -ForegroundColor Yellow
