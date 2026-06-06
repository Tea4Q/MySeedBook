# Script to apply the feedback table migration to Supabase
# This script reads the SQL migration file and provides instructions for manual application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Feedback Table Migration Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$migrationFile = Join-Path $PSScriptRoot ".." "supabase" "migrations" "20251030_create_feedback_table.sql"

if (-Not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found at: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migration file found" -ForegroundColor Green
Write-Host ""
Write-Host "To apply this migration, follow these steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to your Supabase Dashboard:" -ForegroundColor White
Write-Host "   https://app.supabase.com/project/YOUR_PROJECT_ID/editor" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Click on 'SQL Editor' in the left sidebar" -ForegroundColor White
Write-Host ""
Write-Host "3. Click '+ New Query'" -ForegroundColor White
Write-Host ""
Write-Host "4. Copy the contents of this file:" -ForegroundColor White
Write-Host "   $migrationFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Paste the SQL into the editor and click 'Run'" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening migration file contents..." -ForegroundColor Yellow
Write-Host ""

# Display the migration file contents
Get-Content $migrationFile | Write-Host -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Would you like to copy this SQL to your clipboard? (Y/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y") {
    Get-Content $migrationFile | Set-Clipboard
    Write-Host "✅ SQL copied to clipboard!" -ForegroundColor Green
    Write-Host "You can now paste it directly into the Supabase SQL Editor" -ForegroundColor Green
} else {
    Write-Host "ℹ️  You can manually copy the contents from:" -ForegroundColor Cyan
    Write-Host "   $migrationFile" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "After running the migration in Supabase:" -ForegroundColor Yellow
Write-Host "1. Verify the 'feedback' table exists in your database" -ForegroundColor White
Write-Host "2. Test the feedback feature in your app" -ForegroundColor White
Write-Host "3. Check that RLS policies are working correctly" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
