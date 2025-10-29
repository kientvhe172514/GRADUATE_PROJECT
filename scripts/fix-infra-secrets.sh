#!/bin/bash
# Quick fix script to create infrastructure secrets in correct namespace

echo "🔧 Creating infrastructure secrets in 'infrastructure' namespace..."

# Delete old pods to force recreate with correct secrets
echo "Deleting failed pods..."
kubectl delete pod --field-selector=status.phase=Failed -n infrastructure
kubectl delete pod --field-selector=status.phase=Pending -n infrastructure

# Create Postgres secret
echo "Creating Postgres secret..."
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_HOST="${POSTGRES_HOST:-postgres-srv}" \
  --from-literal=POSTGRES_PORT="${POSTGRES_PORT:-5432}" \
  --from-literal=POSTGRES_USER="${POSTGRES_USER:-postgres}" \
  --from-literal=POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres123}" \
  --from-literal=POSTGRES_DB_IAM="${POSTGRES_DB_IAM:-iam_db}" \
  --from-literal=POSTGRES_DB_ATTENDANCE="${POSTGRES_DB_ATTENDANCE:-attendance_db}" \
  --from-literal=POSTGRES_DB_EMPLOYEE="${POSTGRES_DB_EMPLOYEE:-employee_db}" \
  --from-literal=POSTGRES_DB_LEAVE="${POSTGRES_DB_LEAVE:-leave_db}" \
  --from-literal=POSTGRES_DB_NOTIFICATION="${POSTGRES_DB_NOTIFICATION:-notification_db}" \
  --from-literal=POSTGRES_DB_REPORTING="${POSTGRES_DB_REPORTING:-reporting_db}" \
  --from-literal=POSTGRES_DB_ZENTRY="${POSTGRES_DB_ZENTRY:-zentry_db}" \
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
  --from-literal=REDIS_HOST="${REDIS_HOST:-redis-srv}" \
  --from-literal=REDIS_PORT="${REDIS_PORT:-6379}" \
  --from-literal=REDIS_PASSWORD="${REDIS_PASSWORD:-redis123}" \
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
