# Test Face ID Users Status API
Write-Host "Testing Face ID Users Status API..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "New Endpoints Added:" -ForegroundColor Green
Write-Host "1. GET /api/faceid/users" -ForegroundColor White
Write-Host "   Description: Get all users with Face ID (only those who have registered)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. POST /api/faceid/users/status" -ForegroundColor White
Write-Host "   Description: Get Face ID status for specific users (including those without Face ID)" -ForegroundColor Gray

Write-Host ""
Write-Host "Key Feature: hasFaceId Field" -ForegroundColor Yellow
Write-Host "- hasFaceId: true = User has registered Face ID" -ForegroundColor Gray
Write-Host "- hasFaceId: false = User has NOT registered Face ID" -ForegroundColor Gray
Write-Host "- createdAt/updatedAt: null for users without Face ID" -ForegroundColor Gray

Write-Host ""
Write-Host "Test Commands:" -ForegroundColor Yellow
Write-Host "1. Test GET endpoint:" -ForegroundColor White
Write-Host "   curl -X GET http://localhost:8080/api/faceid/users" -ForegroundColor Gray

Write-Host ""
Write-Host "2. Test POST endpoint:" -ForegroundColor White
Write-Host "   curl -X POST http://localhost:8080/api/faceid/users/status" -ForegroundColor Gray
Write-Host "        -H Content-Type: application/json" -ForegroundColor Gray
Write-Host "        -d '{\"userIds\":[\"9444745a-4680-4052-849c-d9faa9b95adc\"]}'" -ForegroundColor Gray

Write-Host ""
Write-Host "Use Cases:" -ForegroundColor Yellow
Write-Host "- Admin dashboard: Show Face ID adoption rate" -ForegroundColor Gray
Write-Host "- User management: Identify users needing Face ID setup" -ForegroundColor Gray
Write-Host "- Analytics: Track Face ID registration progress" -ForegroundColor Gray
Write-Host "- Bulk operations: Process users based on Face ID status" -ForegroundColor Gray

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. RESTART your API application" -ForegroundColor White
Write-Host "2. Test both endpoints" -ForegroundColor White
Write-Host "3. Verify hasFaceId field works correctly" -ForegroundColor White
Write-Host "4. Check response format matches documentation" -ForegroundColor White


