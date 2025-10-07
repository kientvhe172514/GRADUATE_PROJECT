# Test FCM Token Registration API Script
param(
    [string]$ApiUrl = "http://localhost:8080",
    [string]$UserId = "00000000-0000-0000-0000-000000000000",
    [string]$AndroidId = "test_android_id_123",
    [string]$FcmToken = "test_fcm_token_456",
    [string]$Platform = "android"
)

Write-Host "Testing FCM Token Registration API" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow
Write-Host "User ID: $UserId" -ForegroundColor Yellow
Write-Host "Android ID: $AndroidId" -ForegroundColor Yellow
Write-Host "FCM Token: $FcmToken" -ForegroundColor Yellow
Write-Host "Platform: $Platform" -ForegroundColor Yellow
Write-Host ""

# Test 1: Register FCM Token
Write-Host "1. Testing FCM Token Registration..." -ForegroundColor Green
try {
    $body = @{
        UserId = $UserId
        AndroidId = $AndroidId
        FcmToken = $FcmToken
        Platform = $Platform
        DeviceName = "Test Device"
        Model = "Test Model"
        Manufacturer = "Test Manufacturer"
        OsVersion = "Android 13"
        AppVersion = "1.0.0"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$ApiUrl/api/device-tokens/register-fcm" -Method POST -Body $body -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "   ✅ FCM Token Registration: SUCCESS" -ForegroundColor Green
        Write-Host "   Device ID: $($response.data.deviceId)" -ForegroundColor Green
        Write-Host "   Status: $($response.data.status)" -ForegroundColor Green
        Write-Host "   Message: $($response.data.message)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FCM Token Registration: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($response.error.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ FCM Token Registration: ERROR" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Check FCM Token Status
Write-Host "2. Testing FCM Token Status Check..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/api/device-tokens/fcm-status?userId=$UserId&androidId=$AndroidId" -Method GET
    
    if ($response.success) {
        Write-Host "   ✅ FCM Token Status Check: SUCCESS" -ForegroundColor Green
        Write-Host "   User ID: $($response.data.userId)" -ForegroundColor Green
        Write-Host "   Android ID: $($response.data.androidId)" -ForegroundColor Green
        Write-Host "   Has FCM Token: $($response.data.hasFcmToken)" -ForegroundColor Green
        Write-Host "   Status: $($response.data.status)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FCM Token Status Check: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($response.error.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ FCM Token Status Check: ERROR" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Register Same FCM Token Again (Should Update)
Write-Host "3. Testing FCM Token Update (Same Android ID)..." -ForegroundColor Green
try {
    $newFcmToken = "updated_fcm_token_789"
    $body = @{
        UserId = $UserId
        AndroidId = $AndroidId
        FcmToken = $newFcmToken
        Platform = $Platform
        DeviceName = "Updated Test Device"
        Model = "Updated Test Model"
        Manufacturer = "Updated Test Manufacturer"
        OsVersion = "Android 14"
        AppVersion = "2.0.0"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$ApiUrl/api/device-tokens/register-fcm" -Method POST -Body $body -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "   ✅ FCM Token Update: SUCCESS" -ForegroundColor Green
        Write-Host "   Device ID: $($response.data.deviceId)" -ForegroundColor Green
        Write-Host "   Status: $($response.data.status)" -ForegroundColor Green
        Write-Host "   Message: $($response.data.message)" -ForegroundColor Green
        Write-Host "   New FCM Token: $($response.data.fcmToken)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FCM Token Update: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($response.error.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ FCM Token Update: ERROR" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test completed!" -ForegroundColor Cyan
