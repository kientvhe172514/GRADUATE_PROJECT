#!/bin/bash

# ============================================
# SERVICES DEPLOYMENT SCRIPT
# ============================================
# Script này deploy toàn bộ microservices
# SAU KHI infrastructure đã ready
# ============================================

set -e

echo "============================================"
echo "🚀 DEPLOYING MICROSERVICES"
echo "============================================"

# Function to deploy a service
deploy_service() {
    local service_name=$1
    echo ""
    echo "📦 Deploying $service_name service..."
    
    # Deploy secrets, configmap, deployment, service
    kubectl apply -f ../k8s/services/$service_name/secrets.yaml
    kubectl apply -f ../k8s/services/$service_name/configmap.yaml
    kubectl apply -f ../k8s/services/$service_name/deployment.yaml
    kubectl apply -f ../k8s/services/$service_name/service.yaml
    
    echo "✅ $service_name deployed"
}

# 1. Deploy Auth Service (must be first - other services depend on it)
deploy_service "auth"
echo "⏳ Waiting for Auth service to be ready..."
kubectl wait --for=condition=ready pod -l app=auth -n default --timeout=120s

# 2. Deploy Employee Service
deploy_service "employee"
echo "⏳ Waiting for Employee service to be ready..."
kubectl wait --for=condition=ready pod -l app=employee -n default --timeout=120s

# 3. Deploy Attendance Service
deploy_service "attendance"
echo "⏳ Waiting for Attendance service to be ready..."
kubectl wait --for=condition=ready pod -l app=attendance -n default --timeout=120s

# 4. Deploy Leave Service
deploy_service "leave"
echo "⏳ Waiting for Leave service to be ready..."
kubectl wait --for=condition=ready pod -l app=leave -n default --timeout=120s

# 5. Deploy Notification Service
deploy_service "notification"
echo "⏳ Waiting for Notification service to be ready..."
kubectl wait --for=condition=ready pod -l app=notification -n default --timeout=120s

# 6. Deploy Reporting Service
deploy_service "reporting"
echo "⏳ Waiting for Reporting service to be ready..."
kubectl wait --for=condition=ready pod -l app=reporting -n default --timeout=120s

# 7. Deploy Face Recognition Service
deploy_service "face-recognition"
echo "⏳ Waiting for Face Recognition service to be ready..."
kubectl wait --for=condition=ready pod -l app=face-recognition -n default --timeout=120s

# 8. Verify deployment
echo ""
echo "============================================"
echo "✅ ALL SERVICES DEPLOYMENT COMPLETE"
echo "============================================"
echo ""
echo "📊 Services Status:"
kubectl get pods -n default
echo ""
echo "🔌 Services Endpoints:"
kubectl get svc -n default
echo ""
echo "============================================"
echo "✅ SYSTEM READY FOR USE"
echo "============================================"
