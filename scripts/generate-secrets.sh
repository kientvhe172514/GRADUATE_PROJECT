#!/bin/bash

# ============================================
# GENERATE KUBERNETES SECRETS FROM ENV VARS
# ============================================
# Script này tạo Kubernetes secrets từ environment
# variables (GitHub Secrets hoặc local .env)
# ============================================

set -e

echo "============================================"
echo "🔐 GENERATING KUBERNETES SECRETS"
echo "============================================"

# Check required environment variables
REQUIRED_VARS=(
    "POSTGRES_PASSWORD"
    "MONGODB_USERNAME"
    "MONGODB_PASSWORD"
    "RABBITMQ_USERNAME"
    "RABBITMQ_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_SECRET"
)

missing_vars=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ ERROR: Missing required environment variables:"
    printf '   - %s\n' "${missing_vars[@]}"
    echo ""
    echo "💡 Set them as GitHub Secrets or export locally:"
    echo "   export POSTGRES_PASSWORD='your-password'"
    exit 1
fi

echo "✅ All required environment variables present"
echo ""

# Create temporary directory for generated secrets
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo "📝 Generating secrets from templates..."

# Function to generate secret from template
generate_secret() {
    local template_file=$1
    local output_file=$2
    
    if [ ! -f "$template_file" ]; then
        echo "⚠️  Template not found: $template_file"
        return
    fi
    
    # Replace environment variables in template
    envsubst < "$template_file" > "$output_file"
    echo "   ✅ Generated: $(basename $output_file)"
}

# Infrastructure Secrets
echo ""
echo "🏗️  Infrastructure Secrets:"
generate_secret "../k8s/shared/databases/postgres/postgres-secret.yaml.template" \
                "$TEMP_DIR/postgres-secret.yaml"

generate_secret "../k8s/shared/databases/mongodb/mongodb-secret.yaml.template" \
                "$TEMP_DIR/mongodb-secret.yaml"

generate_secret "../k8s/shared/messaging/rabbitmq/rabbitmq-secret.yaml.template" \
                "$TEMP_DIR/rabbitmq-secret.yaml"

# Service Secrets (will be created below)
echo ""
echo "🔧 Service Secrets:"

# Auth Service Secret
cat > "$TEMP_DIR/auth-secrets.yaml" <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: auth-secrets
  namespace: default
  labels:
    app: auth
    tier: microservices
type: Opaque
stringData:
  DATABASE_URL: "postgresql://postgres:${POSTGRES_PASSWORD}@postgres-srv.infrastructure.svc.cluster.local:5432/IAM"
  RABBITMQ_URL: "amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@rabbitmq-srv.infrastructure.svc.cluster.local:5672"
  RABBITMQ_EMPLOYEE_QUEUE: "employee_queue"
  RABBITMQ_IAM_QUEUE: "iam_queue"
  RABBITMQ_NOTIFICATION_QUEUE: "notification_queue"
  REDIS_URL: "redis://:${REDIS_PASSWORD}@redis-srv.infrastructure.svc.cluster.local:6379"
  JWT_SECRET: "${JWT_SECRET}"
  JWT_EXPIRES_IN: "15m"
  JWT_REFRESH_EXPIRES_IN: "7d"
EOF
echo "   ✅ Generated: auth-secrets.yaml"

# Attendance Service Secret
cat > "$TEMP_DIR/attendance-secrets.yaml" <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: attendance-secrets
  namespace: default
  labels:
    app: attendance
    tier: microservices
type: Opaque
stringData:
  DATABASE_URL: "postgresql://postgres:${POSTGRES_PASSWORD}@postgres-srv.infrastructure.svc.cluster.local:5432/attendance_db"
  RABBITMQ_URL: "amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@rabbitmq-srv.infrastructure.svc.cluster.local:5672"
  RABBITMQ_ATTENDANCE_QUEUE: "attendance_queue"
  RABBITMQ_EMPLOYEE_QUEUE: "employee_queue"
  RABBITMQ_LEAVE_QUEUE: "leave_queue"
  RABBITMQ_NOTIFICATION_QUEUE: "notification_queue"
  REDIS_URL: "redis://:${REDIS_PASSWORD}@redis-srv.infrastructure.svc.cluster.local:6379"
  JWT_SECRET: "${JWT_SECRET}"
  JWT_EXPIRATION: "1d"
EOF
echo "   ✅ Generated: attendance-secrets.yaml"

# Employee Service Secret
cat > "$TEMP_DIR/employee-secrets.yaml" <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: employee-secrets
  namespace: default
  labels:
    app: employee
    tier: microservices
type: Opaque
stringData:
  DATABASE_URL: "postgresql://postgres:${POSTGRES_PASSWORD}@postgres-srv.infrastructure.svc.cluster.local:5432/employee_db"
  RABBITMQ_URL: "amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@rabbitmq-srv.infrastructure.svc.cluster.local:5672"
  RABBITMQ_IAM_QUEUE: "iam_queue"
  RABBITMQ_EMPLOYEE_QUEUE: "employee_queue"
  REDIS_URL: "redis://:${REDIS_PASSWORD}@redis-srv.infrastructure.svc.cluster.local:6379"
EOF
echo "   ✅ Generated: employee-secrets.yaml"

# Leave Service Secret
cat > "$TEMP_DIR/leave-secrets.yaml" <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: leave-secrets
  namespace: default
  labels:
    app: leave
    tier: microservices
type: Opaque
stringData:
  DATABASE_URL: "postgresql://postgres:${POSTGRES_PASSWORD}@postgres-srv.infrastructure.svc.cluster.local:5432/leave_db"
  RABBITMQ_URL: "amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@rabbitmq-srv.infrastructure.svc.cluster.local:5672"
  RABBITMQ_LEAVE_QUEUE: "leave_queue"
  RABBITMQ_EMPLOYEE_QUEUE: "employee_queue"
  RABBITMQ_NOTIFICATION_QUEUE: "notification_queue"
  REDIS_URL: "redis://:${REDIS_PASSWORD}@redis-srv.infrastructure.svc.cluster.local:6379"
  JWT_SECRET: "${JWT_SECRET}"
  JWT_EXPIRATION: "1d"
EOF
echo "   ✅ Generated: leave-secrets.yaml"

# Notification Service Secret
cat > "$TEMP_DIR/notification-secrets.yaml" <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: notification-secrets
  namespace: default
  labels:
    app: notification
    tier: microservices
type: Opaque
stringData:
  DATABASE_URL: "postgresql://postgres:${POSTGRES_PASSWORD}@postgres-srv.infrastructure.svc.cluster.local:5432/notification_db"
  RABBITMQ_URL: "amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@rabbitmq-srv.infrastructure.svc.cluster.local:5672"
  RABBITMQ_NOTIFICATION_QUEUE: "notification_queue"
  JWT_SECRET: "${JWT_SECRET}"
  JWT_EXPIRY: "24h"
  FIREBASE_PROJECT_ID: "${FIREBASE_PROJECT_ID:-your-project-id}"
  FIREBASE_PRIVATE_KEY: "${FIREBASE_PRIVATE_KEY:-dummy-key}"
  FIREBASE_CLIENT_EMAIL: "${FIREBASE_CLIENT_EMAIL:-dummy@email.com}"
  SMTP_HOST: "${SMTP_HOST:-smtp.gmail.com}"
  SMTP_PORT: "${SMTP_PORT:-587}"
  SMTP_SECURE: "false"
  SMTP_USER: "${SMTP_USER:-dummy@gmail.com}"
  SMTP_PASSWORD: "${SMTP_PASSWORD:-dummy-password}"
  SMTP_FROM_NAME: "Zentry HR System"
  SMTP_FROM_EMAIL: "noreply@zentry.com"
  SMS_PROVIDER: "twilio"
  TWILIO_ACCOUNT_SID: "${TWILIO_ACCOUNT_SID:-dummy-sid}"
  TWILIO_AUTH_TOKEN: "${TWILIO_AUTH_TOKEN:-dummy-token}"
  TWILIO_PHONE_NUMBER: "${TWILIO_PHONE_NUMBER:-+1234567890}"
EOF
echo "   ✅ Generated: notification-secrets.yaml"

# Reporting Service Secret
cat > "$TEMP_DIR/reporting-secrets.yaml" <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: reporting-secrets
  namespace: default
  labels:
    app: reporting
    tier: microservices
type: Opaque
stringData:
  DATABASE_URL: "postgresql://postgres:${POSTGRES_PASSWORD}@postgres-srv.infrastructure.svc.cluster.local:5432/reporting_db"
  RABBITMQ_URL: "amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@rabbitmq-srv.infrastructure.svc.cluster.local:5672"
  RABBITMQ_REPORTING_QUEUE: "reporting_queue"
  RABBITMQ_ATTENDANCE_QUEUE: "attendance_queue"
  RABBITMQ_LEAVE_QUEUE: "leave_queue"
  RABBITMQ_EMPLOYEE_QUEUE: "employee_queue"
  RABBITMQ_NOTIFICATION_QUEUE: "notification_queue"
  REDIS_URL: "redis://:${REDIS_PASSWORD}@redis-srv.infrastructure.svc.cluster.local:6379"
  JWT_SECRET: "${JWT_SECRET}"
  JWT_EXPIRATION: "1d"
EOF
echo "   ✅ Generated: reporting-secrets.yaml"

# Face Recognition Service Secret
cat > "$TEMP_DIR/face-recognition-secrets.yaml" <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: face-recognition-secrets
  namespace: default
  labels:
    app: face-recognition
    tier: api
type: Opaque
stringData:
  ConnectionStrings__DefaultConnection: "Host=postgres-srv.infrastructure.svc.cluster.local;Port=5432;Database=zentry;Username=postgres;Password=${POSTGRES_PASSWORD};Pooling=true;"
  RabbitMQ__ConnectionString: "amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@rabbitmq-srv.infrastructure.svc.cluster.local:5672/"
  RabbitMQ__Host: "rabbitmq-srv.infrastructure.svc.cluster.local"
  RabbitMQ__Username: "${RABBITMQ_USERNAME}"
  RabbitMQ__Password: "${RABBITMQ_PASSWORD}"
  Redis__ConnectionString: "redis-srv.infrastructure.svc.cluster.local:6379,password=${REDIS_PASSWORD}"
  MongoDB__ConnectionString: "mongodb://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@mongodb-srv.infrastructure.svc.cluster.local:27017/zentry?authSource=admin"
  Jwt__Secret: "${JWT_SECRET}"
  Jwt__Issuer: "https://yourdomain.com"
  Jwt__Audience: "https://yourdomain.com"
  Jwt__ExpirationMinutes: "60"
EOF
echo "   ✅ Generated: face-recognition-secrets.yaml"

echo ""
echo "============================================"
echo "✅ ALL SECRETS GENERATED"
echo "============================================"
echo ""
echo "📁 Generated files location: $TEMP_DIR"
echo ""
echo "🚀 Next steps:"
echo "   1. Apply infrastructure secrets:"
echo "      kubectl apply -f $TEMP_DIR/postgres-secret.yaml"
echo "      kubectl apply -f $TEMP_DIR/mongodb-secret.yaml"
echo "      kubectl apply -f $TEMP_DIR/rabbitmq-secret.yaml"
echo ""
echo "   2. Apply service secrets:"
echo "      kubectl apply -f $TEMP_DIR/auth-secrets.yaml"
echo "      kubectl apply -f $TEMP_DIR/attendance-secrets.yaml"
echo "      kubectl apply -f $TEMP_DIR/employee-secrets.yaml"
echo "      kubectl apply -f $TEMP_DIR/leave-secrets.yaml"
echo "      kubectl apply -f $TEMP_DIR/notification-secrets.yaml"
echo "      kubectl apply -f $TEMP_DIR/reporting-secrets.yaml"
echo "      kubectl apply -f $TEMP_DIR/face-recognition-secrets.yaml"
echo ""
echo "   OR apply all at once:"
echo "      kubectl apply -f $TEMP_DIR/"
echo ""
echo "⚠️  Secrets are temporary and will be deleted on exit"
echo "============================================"

# Optionally apply secrets directly (comment out if you want manual control)
# read -p "Apply secrets now? (y/N) " -n 1 -r
# echo
# if [[ $REPLY =~ ^[Yy]$ ]]; then
#     kubectl apply -f $TEMP_DIR/
#     echo "✅ Secrets applied to cluster"
# fi
