# Test Face ID Encryption
Write-Host "Testing Face ID Encryption..." -ForegroundColor Cyan

# Test if environment variable is set
$envKey = [Environment]::GetEnvironmentVariable("FACEID_EMBEDDING_KEY")
if ($envKey) {
    Write-Host "✅ FACEID_EMBEDDING_KEY environment variable is set" -ForegroundColor Green
    Write-Host "   Length: $($envKey.Length) characters" -ForegroundColor Gray
} else {
    Write-Host "❌ FACEID_EMBEDDING_KEY environment variable is NOT set" -ForegroundColor Red
}

# Test if we can decode the Base64 key
try {
    $keyBytes = [Convert]::FromBase64String($envKey)
    Write-Host "✅ Base64 key decoded successfully" -ForegroundColor Green
    Write-Host "   Key bytes: $($keyBytes.Length) bytes" -ForegroundColor Gray
    
    if ($keyBytes.Length -eq 32) {
        Write-Host "✅ Key length is correct (32 bytes for AES-256-GCM)" -ForegroundColor Green
    } else {
        Write-Host "❌ Key length is incorrect. Expected 32 bytes, got $($keyBytes.Length)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to decode Base64 key: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your API application" -ForegroundColor White
Write-Host "2. Try calling the Face ID register API again" -ForegroundColor White
Write-Host "3. Check if the 'FACEID_EMBEDDING_KEY is not configured' error is gone" -ForegroundColor White
