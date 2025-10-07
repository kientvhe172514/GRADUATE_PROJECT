# create-service.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceName
)

$templatePath = "auth"
$newServicePath = $ServiceName

# Copy template
Write-Host "Creating $ServiceName from template..." -ForegroundColor Green
Copy-Item -Path $templatePath -Destination $newServicePath -Recurse

# Navigate to new service
Set-Location $newServicePath

# Remove unnecessary files
Write-Host "Cleaning up..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules, dist, .env -ErrorAction SilentlyContinue

# Update package.json
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$packageJson.name = "@hr-system/$ServiceName"
$packageJson.description = "$ServiceName service for HR System"
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"

# Create .env from example
Copy-Item ".env.example" ".env"

Write-Host "Service $ServiceName created successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. cd $ServiceName" -ForegroundColor White
Write-Host "  2. Update .env file" -ForegroundColor White
Write-Host "  3. npm install" -ForegroundColor White
Write-Host "  4. npm run start:dev" -ForegroundColor White