#!/usr/bin/env pwsh

# ====================================
# VERIFY CI/CD DEPLOYMENT
# ====================================
# Script để verify deployment status
# Run: pwsh verify-deployment.ps1
# ====================================

param(
    [string]$EC2Host = "",
    [string]$EC2User = "ubuntu",
    [string]$KeyPath = ""
)

$ErrorActionPreference = "Continue"

Write-Host "🔍 CI/CD Deployment Verification" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if SSH connection info provided
if ([string]::IsNullOrEmpty($EC2Host)) {
    $EC2Host = Read-Host "Enter EC2 Host (IP or DNS)"
}

if ([string]::IsNullOrEmpty($KeyPath)) {
    $KeyPath = Read-Host "Enter SSH Key Path (e.g., C:\path\to\key.pem)"
}

# Verify key file exists
if (-not (Test-Path $KeyPath)) {
    Write-Host "❌ SSH key file not found: $KeyPath" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Connecting to $EC2Host as $EC2User" -ForegroundColor Green
Write-Host ""

# Function to run remote command
function Invoke-SSHCommand {
    param([string]$Command)
    
    ssh -i $KeyPath -o StrictHostKeyChecking=no "$EC2User@$EC2Host" $Command
}

# 1. Check cluster health
Write-Host "1️⃣  Checking Cluster Health..." -ForegroundColor Yellow
Invoke-SSHCommand "kubectl get nodes"
Write-Host ""

# 2. Check namespaces
Write-Host "2️⃣  Checking Namespaces..." -ForegroundColor Yellow
Invoke-SSHCommand "kubectl get namespaces"
Write-Host ""

# 3. Check all pods
Write-Host "3️⃣  Checking All Pods..." -ForegroundColor Yellow
Invoke-SSHCommand "kubectl get pods -A"
Write-Host ""

# 4. Check services
Write-Host "4️⃣  Checking Services..." -ForegroundColor Yellow
Invoke-SSHCommand "kubectl get svc -n default"
Write-Host ""

# 5. Check deployments
Write-Host "5️⃣  Checking Deployments..." -ForegroundColor Yellow
Invoke-SSHCommand "kubectl get deployments -n default"
Write-Host ""

# 6. Health checks
Write-Host "6️⃣  Running Health Checks..." -ForegroundColor Yellow

$services = @(
    @{Name="auth-srv"; Port="3001"},
    @{Name="attendance-srv"; Port="3002"},
    @{Name="employee-srv"; Port="3003"},
    @{Name="leave-srv"; Port="3004"},
    @{Name="notification-srv"; Port="3005"},
    @{Name="reporting-srv"; Port="3006"},
    @{Name="face-recognition-srv"; Port="8080"}
)

foreach ($svc in $services) {
    $testCmd = "kubectl run test-$($svc.Name) --image=curlimages/curl --rm -i --restart=Never --timeout=10s -- curl -sf http://$($svc.Name)/health 2>&1"
    Write-Host "  Testing $($svc.Name)..." -NoNewline
    
    $result = Invoke-SSHCommand $testCmd
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅ Healthy" -ForegroundColor Green
    } else {
        Write-Host " ❌ Failed" -ForegroundColor Red
    }
}
Write-Host ""

# 7. Check resource usage
Write-Host "7️⃣  Checking Resource Usage..." -ForegroundColor Yellow
Write-Host "  Nodes:" -ForegroundColor Cyan
Invoke-SSHCommand "kubectl top nodes 2>/dev/null || echo 'Metrics not available'"
Write-Host ""
Write-Host "  Pods:" -ForegroundColor Cyan
Invoke-SSHCommand "kubectl top pods -n default 2>/dev/null || echo 'Metrics not available'"
Write-Host ""

# 8. Check recent events
Write-Host "8️⃣  Recent Events (last 10)..." -ForegroundColor Yellow
Invoke-SSHCommand "kubectl get events -n default --sort-by='.lastTimestamp' | tail -n 10"
Write-Host ""

# 9. Check PVCs
Write-Host "9️⃣  Checking PersistentVolumeClaims..." -ForegroundColor Yellow
Invoke-SSHCommand "kubectl get pvc -A"
Write-Host ""

# Summary
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "✅ Verification Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Recommendations
Write-Host "📊 Quick Stats:" -ForegroundColor Cyan
$podCount = Invoke-SSHCommand "kubectl get pods -n default --no-headers | wc -l"
Write-Host "  Total Pods: $podCount" -ForegroundColor White

$runningPods = Invoke-SSHCommand "kubectl get pods -n default --no-headers | grep Running | wc -l"
Write-Host "  Running Pods: $runningPods" -ForegroundColor Green

$failedPods = Invoke-SSHCommand "kubectl get pods -n default --no-headers | grep -v Running | grep -v Completed | wc -l"
if ([int]$failedPods -gt 0) {
    Write-Host "  Failed Pods: $failedPods" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔗 Quick Links:" -ForegroundColor Cyan
Write-Host "  GitHub Actions: https://github.com/kientvhe172514/GRADUATE_PROJECT/actions" -ForegroundColor White
Write-Host "  EC2 Console: https://console.aws.amazon.com/ec2/" -ForegroundColor White
Write-Host ""

Write-Host "✨ Done!" -ForegroundColor Green
