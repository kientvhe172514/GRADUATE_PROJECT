#!/bin/bash
# Script để deploy infrastructure đầy đủ

echo "🚀 Deploying infrastructure..."

cd ~/GRADUATE_PROJECT

# Apply platform
kubectl apply -f infra/k8s/platform/

# Apply databases
echo "📊 Deploying Postgres..."
kubectl apply -f infra/k8s/shared/databases/postgres/

echo "📊 Deploying MongoDB..."
kubectl apply -f infra/k8s/shared/databases/mongodb/

# Apply messaging
echo "📬 Deploying RabbitMQ..."
kubectl apply -f infra/k8s/shared/messaging/rabbitmq/

echo "📬 Deploying Redis..."
kubectl apply -f infra/k8s/shared/messaging/redis/

echo "✅ Infrastructure deployed!"
echo ""
echo "Checking pods..."
kubectl get pods -n infrastructure
