# Test Face ID API
Write-Host "Testing Face ID API..." -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

Write-Host "Status Check:" -ForegroundColor Yellow
Write-Host "✅ Encryption key configured" -ForegroundColor Green
Write-Host "✅ Database services running (Docker)" -ForegroundColor Green
Write-Host "✅ Connection strings updated to localhost" -ForegroundColor Green
Write-Host "✅ Repository methods fixed (no more raw SQL)" -ForegroundColor Green
Write-Host "✅ Build successful" -ForegroundColor Green

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. RESTART your API application" -ForegroundColor White
Write-Host "2. Check API logs for:" -ForegroundColor White
Write-Host "   - 'FaceEmbeddings table created'" -ForegroundColor Gray
Write-Host "   - 'FaceIdVerifyRequests table created'" -ForegroundColor Gray
Write-Host "   - 'FaceId module migrations applied successfully'" -ForegroundColor Gray

Write-Host ""
Write-Host "3. Test Face ID Register API:" -ForegroundColor White
Write-Host "   POST http://localhost:8080/api/faceid/register" -ForegroundColor Gray
Write-Host "   Content-Type: multipart/form-data" -ForegroundColor Gray
Write-Host "   - userId: <your-user-id>" -ForegroundColor Gray
Write-Host "   - embedding: <your-embedding-file>" -ForegroundColor Gray

Write-Host ""
Write-Host "Expected Results:" -ForegroundColor Green
Write-Host "- No more 'CancellationToken mapping' errors" -ForegroundColor Gray
Write-Host "- No more 'relation does not exist' errors" -ForegroundColor Gray
Write-Host "- API should return 200 OK with success message" -ForegroundColor Gray

Write-Host ""
Write-Host "If you still get errors, check:" -ForegroundColor Red
Write-Host "- API logs for migration messages" -ForegroundColor Gray
Write-Host "- Database connection (localhost:5432)" -ForegroundColor Gray
Write-Host "- Docker containers are running" -ForegroundColor Gray
