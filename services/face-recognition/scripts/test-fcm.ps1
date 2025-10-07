# Test FCM Integration Script
param(
    [string]$ApiUrl = "http://localhost:8080",
    [string]$UserId = "00000000-0000-0000-0000-000000000000"
)

Write-Host "Testing FCM Integration" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow
Write-Host "User ID: $UserId" -ForegroundColor Yellow
Write-Host ""

# Test 1: Check FCM Status
Write-Host "1. Checking FCM Status..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/api/notifications/fcm-status" -Method GET
    if ($response.success) {
        Write-Host "   FCM Status: $($response.message)" -ForegroundColor Green
        Write-Host "   Initialized: $($response.fcmInitialized)" -ForegroundColor Green
    } else {
        Write-Host "   FCM Status: Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   Error checking FCM status: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Send Test FCM Notification
Write-Host "2. Sending Test FCM Notification..." -ForegroundColor Green
try {
    $body = @{
        recipientUserId = $UserId
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$ApiUrl/api/notifications/test-fcm" -Method POST -Body $body -Headers $headers
    
    if ($response.success) {
        Write-Host "   Test FCM: Success" -ForegroundColor Green
        Write-Host "   Message: $($response.message)" -ForegroundColor Green
        Write-Host "   Timestamp: $($response.timestamp)" -ForegroundColor Green
    } else {
        Write-Host "   Test FCM: Failed" -ForegroundColor Red
        Write-Host "   Message: $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   Error sending test FCM: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "FCM Test Completed!" -ForegroundColor Cyan
Write-Host "Check server logs for detailed information" -ForegroundColor Yellow
