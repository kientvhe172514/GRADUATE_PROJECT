#!/bin/bash

# ============================================
# INITIAL INFRASTRUCTURE SETUP
# ============================================
# Script này chỉ chạy 1 LẦN DUY NHẤT khi setup
# server lần đầu. Không tự động qua CI/CD.
# ============================================

set -e

echo "============================================"
echo "🏗️  INITIAL INFRASTRUCTURE SETUP"
echo "============================================"
echo ""
echo "⚠️  WARNING: This script should only be run ONCE"
echo "    during initial server setup!"
echo ""
read -p "Continue? (yes/no) " -n 3 -r
echo
if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Aborted."
    exit 0
fi

# Check if secrets are set
if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$RABBITMQ_USERNAME" ]; then
    echo ""
    echo "❌ ERROR: Required secrets not set!"
    echo ""
    echo "Please set these environment variables:"
    echo "  export POSTGRES_PASSWORD='your-strong-password'"
    echo "  export MONGODB_USERNAME='admin'"
    echo "  export MONGODB_PASSWORD='your-strong-password'"
    echo "  export RABBITMQ_USERNAME='admin'"
    echo "  export RABBITMQ_PASSWORD='your-strong-password'"
    echo "  export REDIS_PASSWORD='your-strong-password'"
    echo "  export JWT_SECRET='your-jwt-secret-min-32-chars'"
    echo ""
    exit 1
fi

echo ""
echo "============================================"
echo "STEP 1: Creating Namespaces"
echo "============================================"
kubectl apply -f ../infra/k8s/platform/namespace.yaml

echo ""
echo "============================================"
echo "STEP 2: Generating Secrets from Environment"
echo "============================================"
./generate-secrets.sh

echo ""
echo "============================================"
echo "STEP 3: Deploying Infrastructure"
echo "============================================"
./deploy-infrastructure.sh

echo ""
echo "============================================"
echo "STEP 4: Waiting for Infrastructure to be Ready"
echo "============================================"
echo "⏳ This may take 2-3 minutes..."
sleep 30

# Verify all infrastructure pods are running
kubectl wait --for=condition=ready pod -l app=postgres -n infrastructure --timeout=180s
kubectl wait --for=condition=ready pod -l app=mongodb -n infrastructure --timeout=180s
kubectl wait --for=condition=ready pod -l app=redis -n infrastructure --timeout=180s
kubectl wait --for=condition=ready pod -l app=rabbitmq -n infrastructure --timeout=180s

echo ""
echo "============================================"
echo "✅ INFRASTRUCTURE SETUP COMPLETE"
echo "============================================"
echo ""
kubectl get pods -n infrastructure
echo ""
echo "============================================"
echo "📝 NEXT STEPS:"
echo "============================================"
echo ""
echo "1. Verify databases are created:"
echo "   kubectl exec -it -n infrastructure \$(kubectl get pod -n infrastructure -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c '\l'"
echo ""
echo "2. Add these secrets to GitHub:"
echo "   - POSTGRES_PASSWORD"
echo "   - MONGODB_USERNAME"
echo "   - MONGODB_PASSWORD"
echo "   - RABBITMQ_USERNAME"
echo "   - RABBITMQ_PASSWORD"
echo "   - REDIS_PASSWORD"
echo "   - JWT_SECRET"
echo "   - (Optional) FIREBASE_*, SMTP_*, TWILIO_*"
echo ""
echo "3. Infrastructure is ready! Services will be"
echo "   deployed automatically via GitHub Actions"
echo "   when you push code changes."
echo ""
echo "============================================"
