# ✅ Post-Build Migration Script
# Chạy tự động sau khi build project thành công

param(
    [string]$ProjectPath = ".",
    [string]$DatabaseHost = "localhost",
    [string]$DatabaseName = "zentry_db",
    [string]$DatabaseUser = "postgres",
    [string]$DatabasePassword = "password"
)

Write-Host "🚀 Post-Build Migration cho Notification..." -ForegroundColor Green

# 1. Kiểm tra xem project đã build thành công chưa
Write-Host "🔍 Kiểm tra trạng thái build..." -ForegroundColor Yellow
if (-not (Test-Path "$ProjectPath\bin") -or -not (Test-Path "$ProjectPath\obj")) {
    Write-Host "❌ Project chưa được build. Vui lòng build trước!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project đã được build thành công" -ForegroundColor Green

# 2. Kiểm tra xem có cần migration không
Write-Host "🔍 Kiểm tra trạng thái database..." -ForegroundColor Yellow
try {
    $checkQuery = @"
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'Notifications' 
AND column_name IN ('Type', 'Deeplink')
ORDER BY column_name;
"@
    
    $result = psql -h $DatabaseHost -U $DatabaseUser -d $DatabaseName -c $checkQuery 2>$null
    
    if ($result -match "Type|Deeplink") {
        Write-Host "✅ Migration đã được chạy trước đó" -ForegroundColor Green
        Write-Host "💡 Không cần migration thêm" -ForegroundColor Cyan
        exit 0
    }
} catch {
    Write-Host "⚠️ Không thể kiểm tra database, tiếp tục migration..." -ForegroundColor Yellow
}

# 3. Chạy auto-migration script
Write-Host "🔧 Chạy auto-migration..." -ForegroundColor Yellow
try {
    if (Test-Path "auto-migration.ps1") {
        & ".\auto-migration.ps1" -DatabaseHost $DatabaseHost -DatabaseName $DatabaseName -DatabaseUser $DatabaseUser
        Write-Host "✅ Auto-migration hoàn thành" -ForegroundColor Green
    } else {
        Write-Host "❌ Không tìm thấy auto-migration.ps1" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Lỗi khi chạy auto-migration: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Post-Build Migration hoàn thành thành công!" -ForegroundColor Green
Write-Host "💡 Database đã được cập nhật với schema mới" -ForegroundColor Cyan
