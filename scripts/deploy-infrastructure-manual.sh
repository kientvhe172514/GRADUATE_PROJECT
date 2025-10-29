#!/bin/bash

# ============================================
# MANUAL INFRASTRUCTURE DEPLOYMENT SCRIPT
# Run this on EC2 if workflow doesn't work
# ============================================

set -e

echo "🚀 Starting manual infrastructure deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -d "infra/k8s" ]; then
    print_error "Not in GRADUATE_PROJECT directory. Please cd to ~/GRADUATE_PROJECT"
    exit 1
fi

print_status "Working directory: $(pwd)"

# ============================================
# 1. CREATE INFRASTRUCTURE SECRETS
# ============================================
print_status "Creating infrastructure secrets..."

# Postgres Secret
cat > /tmp/postgres-secret.yaml << 'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: infrastructure
type: Opaque
stringData:
  postgres-user: "admin"
  postgres-password: "admin123"
  postgres-db: "postgres"
EOF

# MongoDB Secret
cat > /tmp/mongodb-secret.yaml << 'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: mongodb-secret
  namespace: infrastructure
type: Opaque
stringData:
  mongodb-root-username: "admin"
  mongodb-root-password: "admin123"
  mongodb-database: "graduate_project"
EOF

# RabbitMQ Secret
cat > /tmp/rabbitmq-secret.yaml << 'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: rabbitmq-secret
  namespace: infrastructure
type: Opaque
stringData:
  rabbitmq-default-user: "admin"
  rabbitmq-default-pass: "admin123"
  rabbitmq-erlang-cookie: "mycookie"
EOF

# Redis Secret
cat > /tmp/redis-secret.yaml << 'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: redis-secret
  namespace: infrastructure
type: Opaque
stringData:
  redis-password: "redis123"
EOF

print_status "Secrets created in /tmp/"

# ============================================
# 2. APPLY SECRETS
# ============================================
print_status "Applying secrets to Kubernetes..."

kubectl apply -f /tmp/postgres-secret.yaml
kubectl apply -f /tmp/mongodb-secret.yaml
kubectl apply -f /tmp/rabbitmq-secret.yaml
kubectl apply -f /tmp/redis-secret.yaml

print_status "Secrets applied"

# ============================================
# 3. DEPLOY INFRASTRUCTURE COMPONENTS
# ============================================
print_status "Deploying infrastructure components..."

# Apply platform resources (namespaces, ingress, etc.)
kubectl apply -f infra/k8s/platform/

# Apply databases
kubectl apply -f infra/k8s/shared/databases/

# Apply messaging
kubectl apply -f infra/k8s/shared/messaging/

print_status "Infrastructure deployment initiated"

# ============================================
# 4. WAIT FOR COMPONENTS TO BE READY
# ============================================
print_status "Waiting for infrastructure to be ready..."

# Wait for Postgres
echo "Waiting for PostgreSQL..."
kubectl wait --for=condition=ready pod -l app=postgres-primary -n infrastructure --timeout=300s || print_warning "PostgreSQL not ready yet"

# Wait for MongoDB
echo "Waiting for MongoDB..."
kubectl wait --for=condition=ready pod -l app=mongodb -n infrastructure --timeout=300s || print_warning "MongoDB not ready yet"

# Wait for Redis
echo "Waiting for Redis..."
kubectl wait --for=condition=ready pod -l app=redis -n infrastructure --timeout=300s || print_warning "Redis not ready yet"

# Wait for RabbitMQ
echo "Waiting for RabbitMQ..."
kubectl wait --for=condition=ready pod -l app=rabbitmq -n infrastructure --timeout=300s || print_warning "RabbitMQ not ready yet"

# ============================================
# 5. SHOW STATUS
# ============================================
echo ""
print_status "INFRASTRUCTURE DEPLOYMENT SUMMARY"
echo "=================================="

echo ""
echo "Namespaces:"
kubectl get namespaces

echo ""
echo "Pods in infrastructure namespace:"
kubectl get pods -n infrastructure

echo ""
echo "Services in infrastructure namespace:"
kubectl get svc -n infrastructure

echo ""
echo "Secrets in infrastructure namespace:"
kubectl get secrets -n infrastructure

echo ""
echo "PVCs:"
kubectl get pvc --all-namespaces

echo ""
print_status "Manual infrastructure deployment completed!"
print_warning "Check pod status above. If any pods are not Running, check logs with:"
echo "kubectl logs <pod-name> -n infrastructure"
echo "kubectl describe pod <pod-name> -n infrastructure"