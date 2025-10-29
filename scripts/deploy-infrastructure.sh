#!/bin/bash

# ============================================
# INFRASTRUCTURE DEPLOYMENT SCRIPT
# ============================================
# Script này deploy toàn bộ infrastructure
# cho Kubernetes cluster (PostgreSQL, MongoDB, 
# Redis, RabbitMQ)
# ============================================

set -e

echo "============================================"
echo "🚀 DEPLOYING INFRASTRUCTURE"
echo "============================================"

# 1. Create namespace
echo "📦 Creating infrastructure namespace..."
kubectl apply -f ../k8s/platform/namespace.yaml

# 2. Deploy PostgreSQL
echo "🐘 Deploying PostgreSQL..."
kubectl apply -f ../k8s/shared/databases/postgres/postgres-secret.yaml
kubectl apply -f ../k8s/shared/databases/postgres/postgres-config.yaml
kubectl apply -f ../k8s/shared/databases/postgres/postgres-init-scripts.yaml
kubectl apply -f ../k8s/shared/databases/postgres/postgres-pvc.yaml
kubectl apply -f ../k8s/shared/databases/postgres/postgres-depl.yaml
kubectl apply -f ../k8s/shared/databases/postgres/postgres-srv.yaml

echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n infrastructure --timeout=120s

# 3. Deploy MongoDB
echo "🍃 Deploying MongoDB..."
kubectl apply -f ../k8s/shared/databases/mongodb/mongodb-secret.yaml
kubectl apply -f ../k8s/shared/databases/mongodb/mongodb-pvc.yaml
kubectl apply -f ../k8s/shared/databases/mongodb/mongodb-deployment.yaml
kubectl apply -f ../k8s/shared/databases/mongodb/mongodb-service.yaml

echo "⏳ Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb -n infrastructure --timeout=120s

# 4. Deploy Redis
echo "🔴 Deploying Redis..."
kubectl apply -f ../k8s/shared/messaging/redis/redis-config.yaml
kubectl apply -f ../k8s/shared/messaging/redis/redis-pvc.yaml
kubectl apply -f ../k8s/shared/messaging/redis/redis-deployment.yaml
kubectl apply -f ../k8s/shared/messaging/redis/redis-service.yaml

echo "⏳ Waiting for Redis to be ready..."
kubectl wait --for=condition=ready pod -l app=redis -n infrastructure --timeout=120s

# 5. Deploy RabbitMQ
echo "🐰 Deploying RabbitMQ..."
kubectl apply -f ../k8s/shared/messaging/rabbitmq/rabbitmq-secret.yaml
kubectl apply -f ../k8s/shared/messaging/rabbitmq/rabbitmq-config.yaml
kubectl apply -f ../k8s/shared/messaging/rabbitmq/rabbitmq-definitions.yaml
kubectl apply -f ../k8s/shared/messaging/rabbitmq/rabbitmq-pvc.yaml
kubectl apply -f ../k8s/shared/messaging/rabbitmq/rabbitmq-depl.yaml
kubectl apply -f ../k8s/shared/messaging/rabbitmq/rabbitmq-srv.yaml

echo "⏳ Waiting for RabbitMQ to be ready..."
kubectl wait --for=condition=ready pod -l app=rabbitmq -n infrastructure --timeout=120s

# 6. Verify deployment
echo ""
echo "============================================"
echo "✅ INFRASTRUCTURE DEPLOYMENT COMPLETE"
echo "============================================"
echo ""
echo "📊 Infrastructure Status:"
kubectl get pods -n infrastructure
echo ""
echo "🔌 Services:"
kubectl get svc -n infrastructure
echo ""
echo "💾 Persistent Volumes:"
kubectl get pvc -n infrastructure
echo ""
echo "============================================"
echo "✅ ALL INFRASTRUCTURE READY FOR SERVICES"
echo "============================================"
