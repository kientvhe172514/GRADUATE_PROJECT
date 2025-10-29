#!/bin/bash
# Quick fix script to create infrastructure secrets in correct namespace

echo "🔧 Creating infrastructure secrets in 'infrastructure' namespace..."

# Delete old secrets first
echo "Deleting old secrets..."
kubectl delete secret postgres-secret mongodb-secret rabbitmq-secret redis-secret -n infrastructure --ignore-not-found=true

# Delete old pods to force recreate with correct secrets
echo "Deleting failed pods..."
kubectl delete pod --field-selector=status.phase=Failed -n infrastructure --ignore-not-found=true
kubectl delete pod --field-selector=status.phase=Pending -n infrastructure --ignore-not-found=true

# Create Postgres secret
echo "Creating Postgres secret..."
kubectl create secret generic postgres-secret \
  --from-literal=postgres-user="${POSTGRES_USER:-postgres}" \
  --from-literal=postgres-password="${POSTGRES_PASSWORD:-postgres123}" \
  --from-literal=postgres-db="postgres" \
  --namespace=infrastructure \
  --dry-run=client -o yaml | kubectl apply -f -

# Create MongoDB secret
echo "Creating MongoDB secret..."
kubectl create secret generic mongodb-secret \
  --from-literal=MONGODB_HOST="${MONGODB_HOST:-mongodb-srv}" \
  --from-literal=MONGODB_PORT="${MONGODB_PORT:-27017}" \
  --from-literal=MONGODB_DATABASE="${MONGODB_DATABASE:-attendance_db}" \
  --from-literal=MONGODB_USERNAME="${MONGODB_USERNAME:-admin}" \
  --from-literal=MONGODB_PASSWORD="${MONGODB_PASSWORD:-mongo123}" \
  --namespace=infrastructure \
  --dry-run=client -o yaml | kubectl apply -f -

# Create RabbitMQ secret
echo "Creating RabbitMQ secret..."
kubectl create secret generic rabbitmq-secret \
  --from-literal=RABBITMQ_HOST="${RABBITMQ_HOST:-rabbitmq-srv}" \
  --from-literal=RABBITMQ_PORT="${RABBITMQ_PORT:-5672}" \
  --from-literal=RABBITMQ_USERNAME="${RABBITMQ_USERNAME:-admin}" \
  --from-literal=RABBITMQ_PASSWORD="${RABBITMQ_PASSWORD:-rabbitmq123}" \
  --from-literal=RABBITMQ_MANAGEMENT_PORT="${RABBITMQ_MANAGEMENT_PORT:-15672}" \
  --namespace=infrastructure \
  --dry-run=client -o yaml | kubectl apply -f -

# Create Redis secret
echo "Creating Redis secret..."
kubectl create secret generic redis-secret \
  --from-literal=redis-password="${REDIS_PASSWORD:-redis123}" \
  --namespace=infrastructure \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ All secrets created!"
echo ""
echo "Checking secrets..."
kubectl get secrets -n infrastructure

echo ""
echo "Restarting failed deployments..."
kubectl rollout restart deployment -n infrastructure
kubectl rollout restart statefulset -n infrastructure

echo ""
echo "Checking pods status..."
kubectl get pods -n infrastructure
