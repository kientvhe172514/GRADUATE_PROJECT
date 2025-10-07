# Face ID Encryption Key Setup Script
Write-Host "Face ID Encryption Key Setup" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Generate a random 32-byte key and convert to Base64
Write-Host "Generating a random 32-byte encryption key..." -ForegroundColor Yellow
$randomBytes = 1..32 | ForEach-Object { [byte](Get-Random -Min 0 -Max 256) }
$base64Key = [Convert]::ToBase64String($randomBytes)

Write-Host "Generated key (Base64): $base64Key" -ForegroundColor Green
Write-Host "Key length: $($base64Key.Length) characters" -ForegroundColor Green

# Set environment variable for current session
Write-Host "Setting FACEID_EMBEDDING_KEY for current PowerShell session..." -ForegroundColor Yellow
$env:FACEID_EMBEDDING_KEY = $base64Key

# Verify it's set
$envValue = [Environment]::GetEnvironmentVariable("FACEID_EMBEDDING_KEY")
if ($envValue -eq $base64Key) {
    Write-Host "Environment variable set successfully for current session" -ForegroundColor Green
} else {
    Write-Host "Failed to set environment variable" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Restart your API/application to pick up the new environment variable" -ForegroundColor White
Write-Host "2. Or set it permanently in your system:" -ForegroundColor White
Write-Host "   - Windows: [Environment]::SetEnvironmentVariable('FACEID_EMBEDDING_KEY', '$base64Key', 'User')" -ForegroundColor Gray
Write-Host "   - Or add to your appsettings.json:" -ForegroundColor Gray
Write-Host "     'FaceId': { 'EncryptionKey': '$base64Key' }" -ForegroundColor Gray

Write-Host ""
Write-Host "To verify the key is working, check your API logs after restart" -ForegroundColor Cyan
Write-Host "The error 'FACEID_EMBEDDING_KEY is not configured' should disappear" -ForegroundColor White

Write-Host ""
Write-Host "IMPORTANT: Keep this key secure and consistent across deployments!" -ForegroundColor Red
Write-Host "Changing the key will make existing encrypted data unreadable!" -ForegroundColor Red
