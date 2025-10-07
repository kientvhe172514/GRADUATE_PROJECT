# Test Face ID GetAllUsers API
Write-Host "Testing Face ID GetAllUsers API..." -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "New Endpoint Added:" -ForegroundColor Green
Write-Host "GET /api/faceid/users" -ForegroundColor White
Write-Host "Description: Get all user IDs that have registered Face IDs" -ForegroundColor Gray

Write-Host ""
Write-Host "Expected Response Format:" -ForegroundColor Yellow
Write-Host "```json" -ForegroundColor Gray
Write-Host "{" -ForegroundColor Gray
Write-Host "  \"success\": true," -ForegroundColor Gray
Write-Host "  \"data\": {" -ForegroundColor Gray
Write-Host "    \"totalCount\": 3," -ForegroundColor Gray
Write-Host "    \"userIds\": [" -ForegroundColor Gray
Write-Host "      \"9444745a-4680-4052-849c-d9faa9b95adc\"," -ForegroundColor Gray
Write-Host "      \"a1b2c3d4-e5f6-7890-abcd-ef1234567890\"" -ForegroundColor Gray
Write-Host "    ]" -ForegroundColor Gray
Write-Host "  }," -ForegroundColor Gray
Write-Host "  \"message\": \"Retrieved all users with Face ID successfully\"" -ForegroundColor Gray
Write-Host "}" -ForegroundColor Gray
Write-Host "```" -ForegroundColor Gray

Write-Host ""
Write-Host "Test Commands:" -ForegroundColor Yellow
Write-Host "1. Using curl:" -ForegroundColor White
Write-Host "   curl -X GET http://localhost:8080/api/faceid/users" -ForegroundColor Gray

Write-Host ""
Write-Host "2. Using PowerShell:" -ForegroundColor White
Write-Host "   Invoke-RestMethod -Uri 'http://localhost:8080/api/faceid/users' -Method GET" -ForegroundColor Gray

Write-Host ""
Write-Host "3. Using Postman:" -ForegroundColor White
Write-Host "   Import the updated collection and use 'Get All Users with Face ID' request" -ForegroundColor Gray

Write-Host ""
Write-Host "Use Cases:" -ForegroundColor Yellow
Write-Host "- Admin dashboard: Show total users with Face ID" -ForegroundColor Gray
Write-Host "- Analytics: Count registered users" -ForegroundColor Gray
Write-Host "- Bulk operations: Process all users with Face ID" -ForegroundColor Gray
Write-Host "- Monitoring: Track Face ID adoption rate" -ForegroundColor Gray

Write-Host ""
Write-Host "Security Notes:" -ForegroundColor Red
Write-Host "- This endpoint returns sensitive user IDs" -ForegroundColor Gray
Write-Host "- Should be protected with proper authentication/authorization" -ForegroundColor Gray
Write-Host "- Consider rate limiting for large user bases" -ForegroundColor Gray

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. RESTART your API application" -ForegroundColor White
Write-Host "2. Test the new endpoint" -ForegroundColor White
Write-Host "3. Verify response format matches documentation" -ForegroundColor White
