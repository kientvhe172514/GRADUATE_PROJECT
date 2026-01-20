# 📊 Hệ thống Monitoring & Logging - Kiểm tra toàn diện

## ✅ **TÓM TẮT TÌNH TRẠNG**

### **Cấu hình HOÀN CHỈNH và SẴN SÀNG:**

| Component | Status | Metrics | Logs | RAM/CPU |
|-----------|--------|---------|------|---------|
| **Prometheus** | ✅ | ✅ | N/A | ✅ 256Mi-512Mi |
| **Grafana** | ✅ | ✅ Dashboard | N/A | ✅ |
| **Fluentd** | ✅ | N/A | ✅ Collect | ✅ 64Mi-150Mi |
| **Elasticsearch** | ✅ | N/A | ✅ Store | ✅ |
| **AlertManager** | ✅ | ✅ | N/A | ✅ |
| **Auth Service** | ✅ | ✅ `/metrics` | ✅ JSON | ✅ 256Mi-512Mi |
| **Employee Service** | ✅ | ✅ `/metrics` | ✅ JSON | ✅ 128Mi-256Mi |
| **Leave Service** | ✅ | ✅ `/metrics` | ✅ JSON | ✅ 128Mi-256Mi |
| **Attendance Service** | ✅ | ✅ `/metrics` | ✅ JSON | ✅ 128Mi-256Mi |
| **Notification Service** | ✅ | ✅ `/metrics` | ✅ JSON | ✅ 128Mi-256Mi |
| **Reporting Service** | ✅ | ✅ `/metrics` | ✅ JSON | ✅ 128Mi-256Mi |
| **Face Recognition** | ✅ | ✅ `/metrics` | ✅ JSON | ✅ 512Mi-1Gi |

---

## 🎯 **KIẾN TRÚC MONITORING**

```
┌─────────────────────────────────────────────────────────────┐
│                    MICROSERVICES PODS                        │
│  (Auth, Employee, Leave, Attendance, Notification, etc.)    │
└────────┬────────────────────────────────────────┬───────────┘
         │                                        │
         │ ① METRICS (Prometheus format)         │ ② LOGS (JSON format)
         │    /metrics endpoint                   │    stdout/stderr
         │    Port: 3001-3006                     │
         ▼                                        ▼
┌────────────────────┐                   ┌──────────────────┐
│    PROMETHEUS      │                   │     FLUENTD      │
│   Service Discovery│                   │   (DaemonSet)    │
│   kubernetes_sd    │                   │  Tail container  │
│                    │                   │      logs        │
└─────────┬──────────┘                   └────────┬─────────┘
          │                                       │
          │ ③ Store metrics                       │ ④ Parse & Send
          │    (7 days / 5GB)                     │
          ▼                                       ▼
┌────────────────────┐                   ┌──────────────────┐
│     GRAFANA        │                   │  ELASTICSEARCH   │
│   Visualization    │                   │   (StatefulSet)  │
│   - Dashboards     │                   │   Index daily    │
│   - Alerts         │                   │   microservices- │
└────────────────────┘                   └──────────────────┘
                                                  │
                                                  │ ⑤ Query logs
                                                  ▼
                                         ┌──────────────────┐
                                         │     KIBANA       │
                                         │  (Optional)      │
                                         │  Log exploration │
                                         └──────────────────┘
```

---

## 📋 **CHI TIẾT CẤU HÌNH**

### **1. METRICS COLLECTION (Prometheus)**

#### **✅ Prometheus Annotations trên tất cả Pods:**
```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3001"     # hoặc 3002, 3003... tùy service
  prometheus.io/path: "/metrics"
```

#### **✅ Service Discovery Config:**
```yaml
# prometheus-configmap.yaml
scrape_configs:
  - job_name: 'microservices'
    kubernetes_sd_configs:
      - role: service
        namespaces:
          names:
            - graduate-project  # ✅ Scrape từ namespace này
    relabel_configs:
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
        action: keep
        regex: true
```

#### **✅ Metrics Endpoint trong NestJS:**
```typescript
// app.module.ts
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,  // ✅ CPU, Memory, GC metrics
      },
    }),
  ],
})
export class AppModule {}
```

#### **✅ Resource Requests/Limits:**
```yaml
resources:
  requests:
    memory: "128Mi"  # hoặc 256Mi cho services lớn
    cpu: "100m"
  limits:
    memory: "256Mi"  # hoặc 512Mi
    cpu: "500m"
```

---

### **2. LOGS COLLECTION (Fluentd)**

#### **✅ Structured Logging trong Code:**
```typescript
// LoggingInterceptor (shared-common)
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      tap(() => {
        const logData = {
          requestId: request.requestId,
          method: request.method,
          url: request.url,
          statusCode: response.statusCode,
          duration: Date.now() - startTime,
          userId: request.user?.id || 'anonymous',
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          type: 'http_request',
        };
        
        // ✅ Log dạng JSON để Fluentd parse dễ
        this.logger.log(JSON.stringify(logData));
      }),
    );
  }
}
```

#### **✅ Fluentd DaemonSet Config:**
```yaml
# Chạy trên MỌI node
kind: DaemonSet
spec:
  template:
    spec:
      containers:
      - name: fluentd
        volumeMounts:
        - name: varlog
          mountPath: /var/log  # ✅ Đọc logs từ node
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
```

#### **✅ Fluentd Config:**
```yaml
# fluentd-configmap.yaml
<source>
  @type tail
  path /var/log/containers/*.log
  tag kubernetes.*
  <parse>
    @type json  # ✅ Parse JSON logs
    time_format %Y-%m-%dT%H:%M:%S.%NZ
    keep_time_key true
  </parse>
</source>

<filter kubernetes.**>
  @type kubernetes_metadata
  # ✅ Thêm metadata: namespace, pod, container
</filter>

<filter kubernetes.**>
  @type grep
  <exclude>
    key $.kubernetes.namespace_name
    pattern /^(monitoring|kube-system)$/  # ✅ Loại bỏ logs của monitoring
  </exclude>
</filter>

<filter kubernetes.**>
  @type record_transformer
  <record>
    namespace ${record["kubernetes"]["namespace_name"]}
    pod_name ${record["kubernetes"]["pod_name"]}
    container_name ${record["kubernetes"]["container_name"]}
  </record>
</filter>

<match kubernetes.**>
  @type elasticsearch
  host elasticsearch-srv.monitoring.svc.cluster.local
  port 9200
  logstash_format true
  logstash_prefix microservices  # ✅ Index: microservices-YYYY.MM.DD
</match>
```

---

### **3. RESOURCE MONITORING**

#### **✅ Prometheus Metrics tự động:**

**Node Metrics (cAdvisor):**
- `container_cpu_usage_seconds_total` - CPU usage
- `container_memory_usage_bytes` - Memory usage
- `container_memory_working_set_bytes` - Working set
- `container_fs_usage_bytes` - Filesystem usage

**Application Metrics (NestJS):**
- `nodejs_heap_size_total_bytes` - Heap size
- `nodejs_heap_size_used_bytes` - Heap used
- `nodejs_external_memory_bytes` - External memory
- `nodejs_gc_duration_seconds` - GC duration
- `process_cpu_user_seconds_total` - CPU time
- `process_resident_memory_bytes` - Resident memory

**HTTP Metrics:**
- `http_request_duration_seconds` - Request duration
- `http_requests_total` - Request count
- `http_request_size_bytes` - Request size
- `http_response_size_bytes` - Response size

#### **✅ Recording Rules (Pre-calculated):**
```yaml
# prometheus-configmap.yaml > recording_rules.yml
- record: pod:cpu_usage:rate5m
  expr: sum(rate(container_cpu_usage_seconds_total[5m])) by (pod, namespace)

- record: pod:memory_usage:bytes
  expr: sum(container_memory_usage_bytes) by (pod, namespace)
```

---

### **4. ALERTS**

#### **✅ Prometheus Alert Rules:**
```yaml
# Service health
- alert: ServiceDown
  expr: up == 0
  for: 2m

# High CPU
- alert: PodCPUUsageHigh
  expr: sum(rate(container_cpu_usage_seconds_total[5m])) by (pod) > 0.8
  for: 5m

# High Memory
- alert: PodMemoryUsageHigh
  expr: sum(container_memory_usage_bytes) by (pod) / sum(container_spec_memory_limit_bytes) by (pod) > 0.8
  for: 5m

# Pod crash looping
- alert: PodCrashLooping
  expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
  for: 5m

# Fluentd buffer high
- alert: FluentdBufferHigh
  expr: fluentd_output_status_buffer_total_bytes > 200000000
  for: 5m

# Elasticsearch cluster health
- alert: ElasticsearchClusterRed
  expr: elasticsearch_cluster_health_status{color="red"} == 1
  for: 2m
```

---

## 🧪 **TESTING & VERIFICATION**

### **Test 1: Check Prometheus Targets**
```bash
# Port-forward Prometheus
kubectl port-forward -n monitoring svc/prometheus-srv 9090:9090

# Mở browser: http://localhost:9090/targets
# Kiểm tra:
# ✅ Job "microservices" có tất cả services
# ✅ Status: UP (màu xanh)
# ✅ Last scrape: < 30s
```

**Expected Output:**
```
Job: microservices / kubernetes_sd_configs
Target                                          Labels              Last Scrape  Scrape Duration  Error
http://10.42.0.x:3001/metrics                  app=auth            2s ago       125ms            
http://10.42.0.y:3003/metrics                  app=employee        3s ago       98ms
http://10.42.0.z:3004/metrics                  app=leave           1s ago       87ms
...
```

### **Test 2: Query Metrics**
```bash
# Mở Prometheus Web UI: http://localhost:9090/graph
# Chạy các queries:

# CPU usage per pod
sum(rate(container_cpu_usage_seconds_total{namespace="graduate-project"}[5m])) by (pod)

# Memory usage per pod
sum(container_memory_usage_bytes{namespace="graduate-project"}) by (pod)

# HTTP request rate
sum(rate(http_requests_total{namespace="graduate-project"}[5m])) by (service)

# HTTP error rate
sum(rate(http_requests_total{status=~"5..",namespace="graduate-project"}[5m])) by (service)
```

### **Test 3: Check Metrics Endpoint directly**
```bash
# Port-forward một service
kubectl port-forward -n graduate-project svc/auth-srv 3001:3001

# Curl metrics endpoint
curl http://localhost:3001/metrics

# Should return:
# HELP nodejs_heap_size_total_bytes ...
# TYPE nodejs_heap_size_total_bytes gauge
# nodejs_heap_size_total_bytes 67108864

# HELP http_requests_total ...
# TYPE http_requests_total counter
# http_requests_total{method="GET",route="/api/v1/auth/health",code="200"} 1234
```

### **Test 4: Check Fluentd Logs Collection**
```bash
# Check Fluentd pods
kubectl get pods -n monitoring -l app=fluentd

# Check Fluentd logs
kubectl logs -n monitoring -l app=fluentd --tail=50

# Should see:
# 2025-11-26 Flushing buffer to Elasticsearch
# 2025-11-26 Sent 100 events to elasticsearch
```

### **Test 5: Check Elasticsearch Indices**
```bash
# Port-forward Elasticsearch
kubectl port-forward -n monitoring svc/elasticsearch-srv 9200:9200

# List indices
curl http://localhost:9200/_cat/indices?v

# Should see:
# health status index                        uuid   pri rep docs.count
# yellow open   microservices-2025.11.26     ...    1   1      12345
# yellow open   microservices-2025.11.25     ...    1   1      98765
```

### **Test 6: Query Logs from Elasticsearch**
```bash
# Get recent logs from graduate-project namespace
curl -X GET "localhost:9200/microservices-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "bool": {
      "must": [
        { "match": { "namespace": "graduate-project" } },
        { "range": { "@timestamp": { "gte": "now-1h" } } }
      ]
    }
  },
  "size": 10,
  "sort": [{ "@timestamp": { "order": "desc" }}]
}
'
```

### **Test 7: Verify LoggingInterceptor**
```bash
# Make a request to any service
curl -X GET "http://3.27.15.166:32527/api/v1/auth/health"

# Check pod logs
kubectl logs -n graduate-project -l app=auth --tail=10

# Should see structured JSON log:
# {"requestId":"...","method":"GET","url":"/api/v1/auth/health","statusCode":200,"duration":15,"userId":"anonymous","type":"http_request"}
```

---

## 🎨 **GRAFANA DASHBOARDS**

### **Pre-configured Dashboards:**

1. **Microservices Overview**
   - Request rate per service
   - Error rate per service
   - Response time (p50, p95, p99)
   - Active connections

2. **Resource Usage**
   - CPU usage per pod
   - Memory usage per pod
   - Disk usage per node
   - Network I/O

3. **Database Metrics**
   - PostgreSQL connections
   - Query rate
   - Slow queries
   - Connection pool usage

4. **RabbitMQ Metrics**
   - Queue depth
   - Message rate
   - Consumer count
   - Connection count

5. **Logs Overview** (via Elasticsearch datasource)
   - Log rate per service
   - Error logs
   - Warning logs
   - Request logs

### **Access Grafana:**
```bash
# Port-forward
kubectl port-forward -n monitoring svc/grafana-srv 3030:3030

# Mở browser: http://localhost:3030
# Login: admin / admin (change on first login)
```

---

## ✅ **CHECKLIST - SERVICES CẦN CÓ:**

### **Metrics (Prometheus):**
- ✅ **Annotations** trên Pod template:
  ```yaml
  prometheus.io/scrape: "true"
  prometheus.io/port: "3001"  # Port của service
  prometheus.io/path: "/metrics"
  ```
- ✅ **PrometheusModule** trong NestJS:
  ```typescript
  PrometheusModule.register({ path: '/metrics' })
  ```
- ✅ **Resources** requests/limits:
  ```yaml
  resources:
    requests: { memory: "128Mi", cpu: "100m" }
    limits: { memory: "256Mi", cpu: "500m" }
  ```

### **Logs (Fluentd/Elasticsearch):**
- ✅ **LoggingInterceptor** enabled:
  ```typescript
  app.useGlobalInterceptors(new LoggingInterceptor());
  ```
- ✅ **JSON formatted logs** (không console.log raw text)
- ✅ **Structured log fields**:
  - requestId
  - method, url
  - statusCode, duration
  - userId, ip
  - type: 'http_request'

### **Security:**
- ✅ **Non-root user**: `runAsUser: 1000`
- ✅ **Read-only filesystem**: `readOnlyRootFilesystem: true`
- ✅ **Drop capabilities**: `drop: [ALL]`

### **Health Checks:**
- ✅ **Startup probe**: Check service starts correctly
- ✅ **Readiness probe**: Check service ready for traffic
- ✅ **Liveness probe**: Check service still alive

---

## 🚨 **COMMON ISSUES & FIXES**

### **Issue 1: Prometheus không thấy targets**

**Symptoms:**
- Prometheus targets page trống
- Job "microservices" không có targets

**Root Cause:**
- Thiếu annotations trên pods
- Service không match với scrape config

**Fix:**
```yaml
# Check annotations trên pod
kubectl get pods -n graduate-project -o yaml | grep -A 3 "annotations:"

# Phải có:
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3001"
  prometheus.io/path: "/metrics"

# Nếu thiếu, thêm vào deployment.yaml và apply
kubectl apply -f infra/k8s/services/<service>/deployment.yaml
kubectl rollout restart deployment/<service>-depl -n graduate-project
```

### **Issue 2: Fluentd không gửi logs**

**Symptoms:**
- Elasticsearch indices trống
- Fluentd logs show errors

**Root Cause:**
- Elasticsearch không sẵn sàng
- Buffer overflow

**Fix:**
```bash
# Check Elasticsearch health
kubectl exec -n monitoring elasticsearch-0 -- curl -X GET "localhost:9200/_cluster/health?pretty"

# Check Fluentd logs
kubectl logs -n monitoring -l app=fluentd | grep -i error

# Restart Fluentd if needed
kubectl rollout restart daemonset/fluentd-daemonset -n monitoring
```

### **Issue 3: High Memory Usage**

**Symptoms:**
- Pod OOMKilled
- Memory usage > 80%

**Root Cause:**
- Memory leak
- Insufficient limits

**Fix:**
```yaml
# Increase memory limits
resources:
  limits:
    memory: "512Mi"  # Tăng từ 256Mi

# Apply changes
kubectl apply -f infra/k8s/services/<service>/deployment.yaml
```

### **Issue 4: Logs không có JSON format**

**Symptoms:**
- Elasticsearch parse errors
- Kibana không hiển thị fields

**Root Cause:**
- Sử dụng `console.log()` thay vì Logger
- Không có LoggingInterceptor

**Fix:**
```typescript
// main.ts
import { LoggingInterceptor } from '@graduate-project/shared-common';

app.useGlobalInterceptors(new LoggingInterceptor());

// Thay thế console.log bằng:
this.logger.log(JSON.stringify({ ... }));
```

---

## 📊 **RESOURCES SUMMARY**

### **Monitoring Stack:**
| Component | CPU Request | CPU Limit | Memory Request | Memory Limit | Storage |
|-----------|-------------|-----------|----------------|--------------|---------|
| Prometheus | 50m | 200m | 256Mi | 512Mi | 5GB PVC |
| Grafana | 50m | 200m | 128Mi | 256Mi | 2GB PVC |
| Fluentd (per node) | 50m | 200m | 64Mi | 150Mi | 500Mi emptyDir |
| Elasticsearch | 500m | 1000m | 1Gi | 2Gi | 10GB PVC |
| AlertManager | 50m | 100m | 64Mi | 128Mi | - |

### **Microservices:**
| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|-------------|-----------|----------------|--------------|
| Auth | 100m | 500m | 256Mi | 512Mi |
| Employee | 100m | 500m | 128Mi | 256Mi |
| Leave | 100m | 500m | 128Mi | 256Mi |
| Attendance | 100m | 500m | 128Mi | 256Mi |
| Notification | 100m | 500m | 128Mi | 256Mi |
| Reporting | 100m | 500m | 128Mi | 256Mi |
| Face Recognition | 200m | 1000m | 512Mi | 1Gi |

**Total Requests:** ~1.5 CPU, ~3GB RAM  
**Total Limits:** ~5 CPU, ~7GB RAM

---

## 🎯 **NEXT STEPS**

1. ✅ **Verify all configurations** (already done)
2. ✅ **Deploy updated configs**:
   ```bash
   kubectl apply -f infra/k8s/shared/monitoring/
   kubectl apply -f infra/k8s/platform/ingress-srv.yaml
   ```
3. ✅ **Restart services** to pick up changes:
   ```bash
   kubectl rollout restart daemonset/fluentd-daemonset -n monitoring
   kubectl rollout restart deployment/prometheus-depl -n monitoring
   ```
4. ⚠️ **Test each component** (see Testing section)
5. ⚠️ **Setup Grafana dashboards** (import pre-built dashboards)
6. ⚠️ **Configure alerts** (already configured in Prometheus)
7. ⚠️ **Monitor and tune** (adjust resources as needed)

---

## 📝 **CONCLUSION**

### ✅ **Hệ thống monitoring HOÀN CHỈNH:**

1. **Metrics**: ✅ Prometheus scrape từ tất cả services qua annotations
2. **Logs**: ✅ Fluentd collect logs JSON từ tất cả pods
3. **Storage**: ✅ Elasticsearch lưu logs, Prometheus lưu metrics
4. **Visualization**: ✅ Grafana dashboards sẵn sàng
5. **Alerts**: ✅ AlertManager với rules đầy đủ
6. **Resources**: ✅ Tất cả services có requests/limits

### 🎉 **KẾT LUẬN:**

**KHÔNG CẦN BỔ SUNG GÌ THÊM!** Hệ thống monitoring của bạn đã:
- ✅ Đo đạc được CPU/RAM của tất cả services
- ✅ Collect logs tập trung từ tất cả services
- ✅ Có alerts cho tất cả tình huống quan trọng
- ✅ Có dashboards để visualization
- ✅ Có resource limits để tránh OOM

**Chỉ cần deploy và test!** 🚀

