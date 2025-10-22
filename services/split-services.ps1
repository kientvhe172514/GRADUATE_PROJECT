# Script to split monolithic deployment files into separate YAML files
# Similar to auth and face-recognition structure

$services = @(
    @{
        name = "employee"
        port = 3003
        database = "employee_db"
        db_type = "postgresql"
    },
    @{
        name = "leave"
        port = 3004
        database = "leave_db"
        db_type = "postgresql"
    },
    @{
        name = "notification"
        port = 3005
        database = "notification_db"
        db_type = "mongodb"
    },
    @{
        name = "reporting"
        port = 3006
        database = "reporting_db"
        db_type = "mongodb"
    }
)

foreach ($svc in $services) {
    $serviceName = $svc.name
    $servicePort = $svc.port
    $database = $svc.database
    $dbType = $svc.db_type
    
    Write-Host "Processing $serviceName service..." -ForegroundColor Green
    
    # Create ConfigMap
    if ($dbType -eq "postgresql") {
        $configContent = @"
# ============================================
# $($serviceName.ToUpper()) Service - ConfigMap
# ============================================

apiVersion: v1
kind: ConfigMap
metadata:
  name: $serviceName-config
  namespace: default
  labels:
    app: $serviceName
    tier: application
data:
  # Database Configuration
  POSTGRES_HOST: "pgbouncer-srv.infrastructure"
  POSTGRES_PORT: "5432"
  POSTGRES_DATABASE: "$database"
  
  # Redis Configuration (optional)
  REDIS_HOST: "redis-master-srv.infrastructure"
  REDIS_PORT: "6379"
  
  # Service Configuration
  LOG_LEVEL: "info"
  NODE_ENV: "production"
"@
    } else {
        $configContent = @"
# ============================================
# $($serviceName.ToUpper()) Service - ConfigMap
# ============================================

apiVersion: v1
kind: ConfigMap
metadata:
  name: $serviceName-config
  namespace: default
  labels:
    app: $serviceName
    tier: application
data:
  # Database Configuration
  MONGO_HOST: "mongodb-srv.infrastructure"
  MONGO_PORT: "27017"
  MONGO_DATABASE: "$database"
  MONGO_REPLICASET: "rs0"
  
  # RabbitMQ Configuration
  RABBITMQ_HOST: "rabbitmq-srv.infrastructure"
  RABBITMQ_PORT: "5672"
  
  # Service Configuration
  LOG_LEVEL: "info"
  NODE_ENV: "production"
"@
    }
    
    $configContent | Out-File -FilePath ".\infra\k8s\services\$serviceName\configmap.yaml" -Encoding UTF8
    
    # Create ServiceAccount
    $saContent = @"
# ============================================
# $($serviceName.ToUpper()) Service - ServiceAccount
# ============================================

apiVersion: v1
kind: ServiceAccount
metadata:
  name: $serviceName-sa
  namespace: default
  labels:
    app: $serviceName
    tier: application
automountServiceAccountToken: true
"@
    
    $saContent | Out-File -FilePath ".\infra\k8s\services\$serviceName\serviceaccount.yaml" -Encoding UTF8
    
    # Create Service
    $serviceContent = @"
# ============================================
# $($serviceName.ToUpper()) Service - Service
# ============================================

apiVersion: v1
kind: Service
metadata:
  name: $serviceName-srv
  namespace: default
  labels:
    app: $serviceName
    tier: application
spec:
  type: ClusterIP
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
  ports:
  - port: $servicePort
    targetPort: $servicePort
    protocol: TCP
    name: http
  selector:
    app: $serviceName
"@
    
    $serviceContent | Out-File -FilePath ".\infra\k8s\services\$serviceName\service.yaml" -Encoding UTF8
    
    # Create HPA
    $hpaContent = @"
# ============================================
# $($serviceName.ToUpper()) Service - HPA
# ============================================

apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: $serviceName-hpa
  namespace: default
  labels:
    app: $serviceName
    tier: application
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: $serviceName-depl
  minReplicas: 1
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 85
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 90
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 120
      policies:
      - type: Pods
        value: 2
        periodSeconds: 60
      - type: Percent
        value: 50
        periodSeconds: 60
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Pods
        value: 1
        periodSeconds: 120
      selectPolicy: Min
"@
    
    $hpaContent | Out-File -FilePath ".\infra\k8s\services\$serviceName\hpa.yaml" -Encoding UTF8
    
    Write-Host "Created files for $serviceName service" -ForegroundColor Cyan
}

Write-Host "`nDone! All services now have proper file structure." -ForegroundColor Green
Write-Host "Files created: configmap.yaml, serviceaccount.yaml, service.yaml, hpa.yaml" -ForegroundColor Yellow
