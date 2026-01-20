# Interview Questions & Answers - Graduate Project

> Tài liệu tổng hợp câu hỏi phỏng vấn và câu trả lời chi tiết cho dự án HR Microservices

---

## Round 1: Architecture & Design

### Q1: Giới thiệu kiến trúc tổng thể của dự án

**Answer:**
- **7 microservices**: auth, employee, attendance, leave, notification, reporting, face-recognition
- **Communication patterns**:
  - Sync: REST API (inter-service calls)
  - Async: RabbitMQ (event-driven)
  - RPC: @MessagePattern cho internal calls
- **Data storage**: PostgreSQL (database-per-service), Redis (cache)
- **Infrastructure**: Kubernetes (2-node cluster on EC2), NGINX Ingress

**Trade-offs**:
- ✅ Independent scaling, deployment
- ✅ Technology diversity (Node.js + .NET)
- ❌ Complexity tăng (distributed debugging)
- ❌ Network latency giữa services

---

### Q2: Tại sao chọn microservices thay vì monolith?

**Answer:**
**Pros:**
- Team có thể work parallel trên different services
- Scale independently (Face Recognition cần nhiều CPU, Notification cần nhiều network)
- Technology flexibility (.NET cho ML, Node.js cho business logic)
- Fault isolation (1 service down không crash toàn bộ)

**Cons:**
- Distributed transaction complexity
- Network overhead
- Debugging khó hơn
- DevOps overhead (7 services vs 1 monolith)

**When to choose monolith:** Team nhỏ (<5 người), MVP/prototype, low traffic

---

### Q3: Join data từ Employee và Attendance service?

**Answer:**
**Option 1: API Composition Pattern** (đang dùng)
```typescript
// Attendance service
async getAttendanceWithEmployee(attendanceId: string) {
  const attendance = await this.attendanceRepo.findById(attendanceId);
  
  // Call Employee service qua HTTP
  const employee = await this.employeeClient.get(attendance.employeeId);
  
  return { ...attendance, employee };
}
```

**Option 2: Data Replication** (cho Reporting)
```typescript
// Reporting service có bản copy của Employee data
// Sync qua RabbitMQ events: employee.created, employee.updated
@RabbitSubscribe({ routingKey: 'employee.updated' })
async syncEmployee(event: EmployeeUpdatedEvent) {
  await this.employeeRepo.upsert(event.data);
}
```

**Trade-offs:**
- API Composition: Fresh data nhưng slow (network calls)
- Data Replication: Fast nhưng eventually consistent

---

## Round 2: Event-Driven Architecture

### Q4: Leave approval failed ở step 2 (deduct balance) - Xử lý sao?

**Current implementation:**
```typescript
// ❌ Vấn đề: Không có rollback mechanism
async approveLeave(leaveId: string) {
  await this.leaveRepo.updateStatus(leaveId, 'APPROVED'); // ✅ Success
  await this.balanceService.deduct(employeeId, days);     // ❌ Failed
  await this.notificationService.send(employeeId);        // Not reached
  
  // Result: Leave approved nhưng balance chưa trừ → Inconsistent!
}
```

**Solution cần implement: Saga Pattern**
```typescript
class LeaveApprovalSaga {
  async execute(leaveId: string) {
    const steps = [];
    try {
      // Step 1
      await this.updateStatus(leaveId, 'APPROVED');
      steps.push(() => this.updateStatus(leaveId, 'PENDING')); // Compensate
      
      // Step 2
      await this.deductBalance(employeeId, days);
      steps.push(() => this.refundBalance(employeeId, days)); // Compensate
      
      // Step 3
      await this.sendNotification(employeeId);
    } catch (error) {
      // Rollback in reverse order
      for (const compensate of steps.reverse()) {
        await compensate();
      }
      throw error;
    }
  }
}
```

**Honest answer:** Hiện tại chưa implement Saga, đây là technical debt cần fix.

---

### Q5: RabbitMQ message loss prevention?

**Answer:**
**Hiện tại đã có:**
1. **Durable queues**: Messages persist to disk
```typescript
await channel.assertQueue('attendance.created', { durable: true });
```

2. **Message acknowledgment**: Confirm processing trước khi remove
```typescript
@RabbitSubscribe({ noAck: false })
async handleMessage(msg: any, amqpMsg: any) {
  try {
    await this.process(msg);
    this.channel.ack(amqpMsg); // ✅ Success
  } catch (error) {
    this.channel.nack(amqpMsg); // ❌ Requeue
  }
}
```

**Chưa có (cần implement):**
3. **Dead Letter Queue (DLQ)**: Messages failed nhiều lần
```typescript
arguments: {
  'x-dead-letter-exchange': 'dlx',
  'x-dead-letter-routing-key': 'dlq.attendance',
}
```

4. **Publisher confirms**: Ensure message reached RabbitMQ
```typescript
await channel.waitForConfirms();
```

---

### Q6: Eventual Consistency - Ví dụ cụ thể?

**Answer:**
**Scenario: Employee service update name**
```
t=0: Employee Service updates: "John" → "Johnny"
t=1: Publish event to RabbitMQ
t=2: Reporting Service consumes event (có thể delay 1-5s)
t=3: Reporting DB updated

Trong khoảng t=0 đến t=3:
- Employee Service: "Johnny"
- Reporting Service: "John" (stale)
```

**Mitigation strategies:**
1. **Idempotent consumers** + version checking
```typescript
async syncEmployee(event: EmployeeUpdatedEvent) {
  const existing = await this.repo.findById(event.employeeId);
  
  // Only update if event is newer
  if (!existing || event.version > existing.version) {
    await this.repo.upsert(event);
  }
}
```

2. **Reconciliation jobs** (daily cron)
```typescript
@Cron('0 2 * * *') // 2 AM
async reconcile() {
  const sourceData = await this.employeeService.getAll();
  const localData = await this.repo.findAll();
  
  const diff = this.compare(sourceData, localData);
  if (diff.length > 0) {
    await this.fix(diff);
    await this.alertOps(diff);
  }
}
```

---

## Round 3: Kubernetes & DevOps

### Q7: K8s cluster setup trên 2 EC2 nodes

**Answer:**
**Step-by-step:**
```bash
# Master node (t3.medium - 2 vCPU, 4GB RAM)
sudo kubeadm init --pod-network-cidr=10.244.0.0/16

# CNI: Calico cho network policies
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml

# Worker node
sudo kubeadm join <master-ip>:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>
```

**Storage:**
- **Local Path Provisioner** cho development
- **EBS CSI Driver** nếu production trên AWS
```yaml
storageClassName: local-path
# hoặc
storageClassName: ebs-sc
```

**Networking details:**
- CNI: Calico (support Network Policies)
- Service CIDR: 10.96.0.0/12
- Pod CIDR: 10.244.0.0/16

---

### Q8: HPA scale up nhưng user vẫn thấy timeout - Tại sao?

**Answer:**
**Vấn đề: Cold start time**
```
t=0: Traffic spike → CPU 80%
t=1: HPA detect → decide to scale 1→3 replicas
t=2: K8s schedule new pods
t=3: Pods starting (pulling image, container init)
t=4: Application boot (NestJS ~10-20s)
t=5: Ready to serve traffic

User timeout sau 5-10s → They see error!
```

**Solutions:**
1. **Pre-scaling** cho predictable spikes
```yaml
spec:
  replicas: 3  # Always run 3 (not scale from 1)
```

2. **Faster startup**
```dockerfile
# Multi-stage build → smaller image
FROM node:20-alpine
# Pre-compile TypeScript
RUN npm run build
```

3. **Readiness probe** delay
```yaml
readinessProbe:
  initialDelaySeconds: 15  # Đợi app ready
  periodSeconds: 5
```

4. **Connection pooling warm-up**
```typescript
async onModuleInit() {
  // Pre-create DB connections
  await this.dataSource.query('SELECT 1');
}
```

---

### Q9: Replica count cho mỗi service - Con số và lý do?

**Answer:**
**Current setup:**
```yaml
auth: 2 replicas       # Critical service, need HA
employee: 2 replicas   # Frequently accessed
attendance: 3 replicas # Highest traffic (check-in peak hours)
leave: 2 replicas
notification: 2 replicas
reporting: 1 replica   # Read-only, can tolerate downtime
face-recognition: 2 replicas # CPU intensive
```

**Reasoning:**
- **Minimum 2** for HA (1 node down vẫn serve traffic)
- **Attendance = 3** vì peak load lúc 8-9 AM (check-in time)
- **Reporting = 1** vì ít traffic, non-critical

**Cost vs Reliability:**
```
Current: ~7 services × 2 replicas = 14 pods
RAM: 14 pods × 256MB = 3.5GB

2 EC2 t3.medium: 4GB × 2 = 8GB total → Còn margin 4.5GB
Cost: $60/month

If scale to 3 replicas all: Need 3+ nodes → $90+/month
```

---

## Round 4: Database & Performance

### Q10: PostgreSQL HA setup?

**Current implementation:**
```yaml
# StatefulSet với 1 replica (Master only)
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  replicas: 1  # ❌ Single point of failure!
```

**Honest answer:** Chưa có HA, đây là risk. Master down → toàn bộ system down.

**Should implement: Patroni + etcd**
```yaml
# Master-Replica setup với auto-failover
postgres-0: Master (read/write)
postgres-1: Replica (read-only)
postgres-2: Replica (read-only)

etcd: Leader election
Patroni: Auto-failover khi master down
```

**Alternative:** Managed database (RDS Multi-AZ) nhưng tốn tiền hơn.

---

### Q11: Face Recognition query performance với 5000 employees?

**Answer:**
**Challenge:**
```sql
-- Naïve approach: ❌ Slow O(n)
SELECT * FROM face_embeddings;
-- Application compute cosine similarity với 5000 records
-- → 5000 calculations per verify request!
```

**Optimization 1: Vector indexing**
```sql
-- pgvector extension
CREATE EXTENSION vector;

CREATE TABLE face_embeddings (
  employee_id UUID,
  embedding vector(128),  -- FaceNet 128-d
  PRIMARY KEY (employee_id)
);

-- IVFFlat index cho approximate nearest neighbor
CREATE INDEX ON face_embeddings 
USING ivfflat (embedding vector_cosine_ops);

-- Query
SELECT employee_id, 1 - (embedding <=> '[0.1, 0.2, ...]') as similarity
FROM face_embeddings
ORDER BY embedding <=> '[0.1, 0.2, ...]'
LIMIT 5;
```

**Optimization 2: Pre-filtering**
```typescript
// Reduce search space
const candidates = await this.faceRepo.find({
  where: {
    department_id: employee.departmentId, // Same department
    active: true,
  }
}); // 5000 → 100 candidates

// Then compute similarity
```

**Performance:**
- Before: 5000 comparisons × 2ms = 10s
- After: 100 comparisons × 2ms = 200ms

---

### Q12: Redis cache hit rate 30% - Debug và optimize?

**Answer:**
**Step 1: Analyze**
```bash
redis-cli INFO stats
# keyspace_hits: 3000
# keyspace_misses: 7000
# hit_rate = 3000/(3000+7000) = 30%
```

```bash
# Monitor hot keys
redis-cli --hotkeys
```

**Step 2: Identify problems**
```typescript
// ❌ Bad: Random keys, không reuse
const cacheKey = `employee:${Date.now()}:${Math.random()}`;

// ❌ Bad: TTL quá ngắn (1 phút)
await redis.setex(key, 60, value);

// ❌ Bad: Cache entity riêng lẻ thay vì batch
for (const employeeId of employeeIds) {
  await redis.get(`employee:${employeeId}`); // N queries
}
```

**Step 3: Optimize**
```typescript
// ✅ Good: Consistent keys
const cacheKey = `employee:${employeeId}`;

// ✅ Good: Longer TTL cho static data
await redis.setex(key, 3600, value); // 1 hour

// ✅ Good: Batch get
const values = await redis.mget(keys); // Single query

// ✅ Good: Cache hot data on startup
async onModuleInit() {
  const employees = await this.db.getAll();
  await this.redis.mset(
    employees.flatMap(e => [`employee:${e.id}`, JSON.stringify(e)])
  );
}
```

**Results:** 30% → 80% hit rate, DB CPU 90% → 30%

---

## Round 5: Security

### Q13: JWT access token 15 phút - Tại sao ngắn?

**Answer:**
**Security reasoning:**
- Token stolen → Hacker chỉ dùng được 15 phút
- User logout → Token expired nhanh
- Permission revoke → Force re-auth sau 15 phút

**Trade-offs:**
- ✅ Security: Giảm risk nếu token bị leak
- ❌ UX: User phải refresh token thường xuyên
- ❌ Load: Nhiều refresh token requests

**Why not shorter (5 phút)?**
- Mobile app poor network → Refresh quá nhiều
- Battery drain (network requests)

**Why not longer (1 giờ)?**
- Token stolen → Hacker có 1 giờ để abuse
- Cannot revoke token (stateless JWT)

**Alternative: Token blacklist**
```typescript
// Revoke token immediately
await redis.sadd('blacklist', token);
await redis.expire('blacklist', 900); // 15 min

// Check on every request
if (await redis.sismember('blacklist', token)) {
  throw new UnauthorizedException('Token revoked');
}
```

---

### Q14: Permission check flow và caching?

**Answer:**
**Flow:**
```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('employee.create')
@Post()
async createEmployee() { ... }

// 1. JwtAuthGuard
// - Verify JWT signature
// - Extract user from token payload

// 2. PermissionsGuard
async canActivate(context) {
  const user = context.switchToHttp().getRequest().user;
  const required = this.reflector.get('permissions', handler);
  
  // Get user permissions từ DB/cache
  const userPermissions = await this.getPermissions(user.id);
  
  // Check
  return required.every(p => userPermissions.includes(p));
}
```

**Caching strategy:**
```typescript
async getPermissions(userId: string) {
  // L1: Memory cache (same process)
  if (this.memCache.has(userId)) {
    return this.memCache.get(userId);
  }
  
  // L2: Redis cache (cross-service)
  const cached = await this.redis.get(`permissions:${userId}`);
  if (cached) {
    this.memCache.set(userId, JSON.parse(cached), 60000); // 1 min
    return JSON.parse(cached);
  }
  
  // L3: Database
  const permissions = await this.db.getPermissions(userId);
  
  // Cache 5 minutes
  await this.redis.setex(`permissions:${userId}`, 300, JSON.stringify(permissions));
  this.memCache.set(userId, permissions, 60000);
  
  return permissions;
}
```

**Real-time revoke:**
```typescript
// Admin revoke permission
async revokePermission(userId: string, permission: string) {
  await this.db.deletePermission(userId, permission);
  
  // Invalidate cache
  await this.redis.del(`permissions:${userId}`);
  
  // Broadcast to all instances
  await this.pubsub.publish('permission.revoked', { userId });
}

// All instances listen
@Subscribe('permission.revoked')
handleRevoke({ userId }) {
  this.memCache.delete(userId);
}
```

**Trade-off:** Cache 5 phút → Revoke có thể trễ tối đa 5 phút. Critical permissions nên invalidate immediately.

---

### Q15: Defense против stolen JWT + deepfake?

**Answer:**
**Multi-layer defense:**

**Layer 1: Device binding**
```typescript
// Generate JWT với device fingerprint
const token = jwt.sign({
  userId: user.id,
  deviceId: deviceFingerprint(req), // IP + User-Agent hash
}, secret);

// Verify
if (jwt.deviceId !== deviceFingerprint(req)) {
  throw new UnauthorizedException('Token used from different device');
}
```

**Layer 2: IP whitelist (for sensitive ops)**
```typescript
@Post('check-in')
async checkIn(@Req() req) {
  const gpsLocation = req.body.location;
  const ipLocation = await this.geoip.lookup(req.ip);
  
  // GPS ở Hanoi nhưng IP từ Singapore → Suspicious
  const distance = this.calcDistance(gpsLocation, ipLocation);
  if (distance > 50) { // 50km
    await this.alertSecurity(req.user.id, 'Suspicious location');
    throw new ForbiddenException('Location mismatch');
  }
}
```

**Layer 3: Liveness detection enhanced**
```typescript
// Face Recognition service
async verifyLiveness(image: Buffer) {
  // Check 1: Blink detection
  const hasBlink = await this.detectBlink(image);
  
  // Check 2: Depth map (not flat 2D photo)
  const depthMap = await this.estimateDepth(image);
  const isFlat = this.analyzeDepth(depthMap);
  
  // Check 3: Challenge-response (random pose)
  // Server: "Please turn left"
  // User: Turn left → capture → verify
  
  if (!hasBlink || isFlat) {
    return { liveness: false, reason: 'Possible photo/video' };
  }
  
  return { liveness: true };
}
```

**Layer 4: Behavioral analytics**
```typescript
// Check-in pattern anomaly
const history = await this.getCheckInHistory(userId, 30); // 30 days

const avgTime = calculateAvg(history.map(h => h.time));
const stdDev = calculateStdDev(history.map(h => h.time));

// Thường check-in 8:00-8:30, hôm nay 6:00 → Anomaly
if (Math.abs(currentTime - avgTime) > 2 * stdDev) {
  await this.alertManager(userId, 'Unusual check-in time');
  // Require approval
  return { status: 'PENDING_APPROVAL' };
}
```

**Layer 5: Rate limiting (prevent brute force)**
```typescript
// Max 3 check-in attempts per hour
const attempts = await redis.incr(`checkin:${userId}`);
await redis.expire(`checkin:${userId}`, 3600);

if (attempts > 3) {
  throw new TooManyRequestsException();
}
```

**Honest answer:** Hiện tại có JWT + liveness detection cơ bản. Device binding, IP check, behavioral analytics chưa có → Nên implement.

---

## Round 6: Distributed Systems

### Q16: Network partition → Conflict resolution?

**Answer:**
**Scenario:**
```
Network split:
[Node 1: Auth, Employee] | [Node 2: Attendance, Leave]

t=0: Manager A (Node 1) approve leave LR-123 → APPROVED
t=0: Manager B (Node 2) reject leave LR-123 → REJECTED

Network heals at t=10:
→ Conflict! Final status = ???
```

**Current issue:** ❌ Không có conflict resolution, last-write-wins (bad!)

**Solution: Optimistic Locking**
```typescript
@Entity()
class LeaveRequest {
  @Column()
  id: string;
  
  @Column()
  status: LeaveStatus;
  
  @VersionColumn() // ⭐ Version number
  version: number;
}

// Update với version check
async approveLeave(id: string, expectedVersion: number) {
  const result = await this.db.query(`
    UPDATE leave_requests
    SET status = 'APPROVED', 
        version = version + 1
    WHERE id = $1 AND version = $2
  `, [id, expectedVersion]);
  
  if (result.affectedRows === 0) {
    throw new ConflictException('Leave request was modified by another user');
  }
}
```

**Alternative: Distributed Lock**
```typescript
// Acquire lock trước khi update
const lock = await this.redis.set(
  `lock:leave:${id}`,
  'locked',
  'NX',  // Only if not exists
  'EX', 30  // Expire 30s
);

if (!lock) {
  throw new ConflictException('Another process is updating this leave');
}

try {
  await this.updateLeave(id);
} finally {
  await this.redis.del(`lock:leave:${id}`);
}
```

**Network partition mitigation:**
- Kubernetes network policies giữa nodes
- Health checks detect partition nhanh
- Quorum-based decisions (majority wins)

---

### Q17: Clock skew giữa services?

**Answer:**
**Problem:**
```
Service A: 08:00:00 → Record "ON_TIME"
Service B: 07:59:55 → Record "EARLY"  
Service C: 08:00:05 → Record "LATE"

Same event, 3 different results!
```

**Current state:** ❌ Mỗi service dùng local time → Inconsistent

**Solution 1: Centralized timestamp**
```typescript
// Client gửi request không có timestamp
@Post('check-in')
async checkIn(@Body() body: CheckInDto) {
  // Server generate timestamp (single source of truth)
  const timestamp = new Date();
  
  return this.attendanceService.record({
    ...body,
    timestamp, // Unified time
  });
}
```

**Solution 2: NTP sync**
```bash
# All nodes sync với NTP server
sudo apt-get install ntp
sudo systemctl enable ntp

# /etc/ntp.conf
server time.google.com iburst
```

**Solution 3: Logical clocks (Lamport timestamp)**
```typescript
// Mỗi event có logical clock
class Event {
  logicalClock: number;  // Incrementing counter
  timestamp: Date;       // Physical time (reference only)
}

// Event ordering by logical clock, not wall clock
events.sort((a, b) => a.logicalClock - b.logicalClock);
```

**Best practice:**
- Timestamp tại entry point (API Gateway)
- Propagate qua headers: `X-Request-Timestamp`
- All services dùng timestamp này thay vì `Date.now()`

---

### Q18: Cascading failure - Circuit breaker pattern?

**Answer:**
**Current state:** ❌ Không có circuit breaker → Cascade failures

**Problem flow:**
```
Face Recognition slow (10s timeout)
→ Attendance service threads blocked waiting
→ Thread pool exhausted
→ Other requests queue up
→ Memory overflow
→ OOMKilled
→ Pod restart loop
```

**Solution: Circuit Breaker với Opossum**
```typescript
import CircuitBreaker from 'opossum';

@Injectable()
export class FaceRecognitionClient {
  private breaker: CircuitBreaker;
  
  constructor() {
    this.breaker = new CircuitBreaker(
      async (image: string) => {
        return this.httpClient.post('/verify', { image });
      },
      {
        timeout: 3000,              // 3s timeout
        errorThresholdPercentage: 50, // Open at 50% error rate
        resetTimeout: 30000,         // Try again after 30s
        volumeThreshold: 10,         // Need 10 requests to calculate
      }
    );
    
    // Fallback: Manual verification
    this.breaker.fallback(() => ({
      verified: 'MANUAL_REVIEW',
      message: 'Auto verification unavailable',
    }));
    
    // Monitoring
    this.breaker.on('open', () => {
      logger.error('Circuit OPEN - Face Recognition down');
      this.metrics.increment('circuit_breaker.open');
    });
  }
  
  async verify(image: string) {
    return this.breaker.fire(image);
  }
}
```

**Three states:**
```
CLOSED: Normal operation
  → If error rate > 50%
OPEN: Reject all requests immediately (fail fast)
  → After 30s
HALF-OPEN: Allow 1 request to test
  → If success → CLOSED
  → If fail → OPEN again
```

**Benefits:**
- Fail fast (3s timeout thay vì 30s)
- Prevent resource exhaustion
- Auto-recovery
- Graceful degradation (fallback)

---

## Round 7: Production Operations

### Q19: 2 AM alert - Pods crash-looping

**Answer:**
**Debug checklist:**

**Step 1: Check pod status**
```bash
kubectl get pods -n default
# OUTPUT: attendance-xxx  0/1  CrashLoopBackOff

kubectl describe pod attendance-xxx
# Look for: Exit Code, Reason
```

**Step 2: Check logs**
```bash
kubectl logs attendance-xxx --previous
# Previous container logs (crashed instance)

# Common errors:
# - "ECONNREFUSED" → Database connection failed
# - "Out of memory" → Memory leak
# - "Cannot find module" → Missing dependency
```

**Step 3: Check events**
```bash
kubectl get events --sort-by=.metadata.creationTimestamp
# Look for: OOMKilled, ImagePullBackOff, etc.
```

**Step 4: Check resources**
```bash
kubectl top nodes
kubectl top pods

# Node out of resources?
# Pod exceeding limits?
```

**Step 5: Common fixes**

**If OOMKilled:**
```yaml
# Increase memory limit
resources:
  limits:
    memory: 512Mi  # Was 256Mi
```

**If DB connection error:**
```bash
# Check PostgreSQL pod
kubectl get pods -n infrastructure
kubectl logs postgres-0

# Check service
kubectl get svc postgres-srv
```

**If config error:**
```bash
# Check configmap/secret
kubectl get configmap attendance-config -o yaml
kubectl get secret attendance-secret -o yaml

# Recreate pod to reload config
kubectl rollout restart deployment attendance
```

**Step 6: Emergency rollback**
```bash
# Rollback to previous version
kubectl rollout undo deployment attendance

# Check history
kubectl rollout history deployment attendance
```

---

### Q20: Memory leak - Debug và fix

**Answer:**
**Step 1: Confirm leak**
```bash
# Monitor memory growth
kubectl top pod employee-xxx --containers

# Result:
# t=0:   200MB
# t=1h:  400MB
# t=2h:  600MB
# → Clear upward trend
```

**Step 2: Take heap dump**
```bash
# Exec vào pod
kubectl exec -it employee-xxx -- sh

# Generate heap dump
node -e "console.log(process.memoryUsage())"
kill -USR2 <pid>  # Trigger heap dump

# Copy heap dump ra local
kubectl cp employee-xxx:/app/heapdump.heapsnapshot ./heapdump.heapsnapshot
```

**Step 3: Analyze với Chrome DevTools**
```
1. Open Chrome DevTools
2. Memory tab → Load heap snapshot
3. Look for:
   - Large retained size objects
   - Detached DOM nodes (trong web apps)
   - Stuck timers/intervals
   - Event listeners không được remove
```

**Step 4: Common causes**

**Cause 1: Event listeners leak**
```typescript
// ❌ Bad: Listener không được remove
@Injectable()
export class LeaveService {
  constructor() {
    this.eventEmitter.on('leave.created', this.handleCreated);
    // Never removed!
  }
}

// ✅ Good: Cleanup on destroy
@Injectable()
export class LeaveService implements OnModuleDestroy {
  private listener: Function;
  
  constructor() {
    this.listener = this.handleCreated.bind(this);
    this.eventEmitter.on('leave.created', this.listener);
  }
  
  onModuleDestroy() {
    this.eventEmitter.off('leave.created', this.listener);
  }
}
```

**Cause 2: Database connections không close**
```typescript
// ❌ Bad: Query builder không được released
async getData() {
  const qb = this.repo.createQueryBuilder();
  return qb.getMany(); // Missing .release()
}

// ✅ Good: Use repository methods hoặc release
async getData() {
  return this.repo.find(); // Auto-managed
}
```

**Cause 3: Cache không có TTL**
```typescript
// ❌ Bad: Unlimited cache growth
private cache = new Map();

async get(key: string) {
  if (!this.cache.has(key)) {
    const value = await this.db.find(key);
    this.cache.set(key, value); // Never expires!
  }
  return this.cache.get(key);
}

// ✅ Good: LRU cache với size limit
import LRU from 'lru-cache';

private cache = new LRU({ 
  max: 500,      // Max 500 items
  ttl: 1000 * 60 // 1 minute
});
```

**Step 5: Deploy fix**
```bash
kubectl set image deployment/employee employee=employee:v1.2.3-fixed
kubectl rollout status deployment/employee
```

---

### Q21: Database connection pool exhausted

**Answer:**
**Diagnosis:**
```sql
-- Check current connections
SELECT count(*) as connections
FROM pg_stat_activity;
-- Result: 102/100 (max_connections)

-- Who's holding connections?
SELECT pid, usename, application_name, state, query
FROM pg_stat_activity
WHERE state != 'idle';
```

**Solution 1: Fix connection leaks** (Root cause)
```typescript
// ❌ Bad: Manual connection không close
async getData() {
  const conn = await this.dataSource.getConnection();
  const result = await conn.query('SELECT ...');
  // Missing: await conn.close()
  return result;
}

// ✅ Good: Use Repository (auto-managed)
async getData() {
  return this.employeeRepo.find();
}

// ✅ Good: Use QueryRunner với try-finally
async getData() {
  const qr = this.dataSource.createQueryRunner();
  try {
    await qr.connect();
    return await qr.query('SELECT ...');
  } finally {
    await qr.release(); // Always release!
  }
}
```

**Solution 2: Optimize connection pool**
```typescript
// TypeORM config
{
  type: 'postgres',
  host: 'postgres-srv',
  port: 5432,
  
  // Connection pool settings
  extra: {
    max: 20,              // Max connections per service
    min: 5,               // Min idle connections
    idleTimeoutMillis: 30000,  // Close idle after 30s
    connectionTimeoutMillis: 5000, // Acquire timeout
  }
}

// Math: 7 services × 2 replicas × 20 max = 280 connections
// PostgreSQL max_connections = 300 → OK
```

**Solution 3: Connection pooler (PgBouncer)**
```yaml
# PgBouncer deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pgbouncer
spec:
  template:
    spec:
      containers:
      - name: pgbouncer
        image: pgbouncer/pgbouncer:latest
        env:
        - name: DATABASES_HOST
          value: postgres-srv
        - name: POOL_MODE
          value: transaction  # Important!
        - name: MAX_CLIENT_CONN
          value: "1000"       # Services can open 1000
        - name: DEFAULT_POOL_SIZE
          value: "25"         # But only 25 real DB connections
```

**Why PgBouncer helps:**
```
Without PgBouncer:
7 services × 2 replicas × 20 = 280 DB connections

With PgBouncer (transaction mode):
Services → PgBouncer (1000 client connections)
PgBouncer → PostgreSQL (25 connections)

Connections reused after each transaction!
```

**Answer to "Increase max_connections to 200?"**
❌ **No! Band-aid solution.**
- More connections = More RAM per connection
- PostgreSQL performance degrades với >100 connections
- Root cause là connection leak, không phải limit
- Use PgBouncer thay vì tăng max_connections

---

## Round 8: Design Decisions

### Q22: Tại sao .NET Core cho Face Recognition?

**Answer:**
**Technical reasons:**

1. **ML.NET ecosystem**
```csharp
// ML.NET có pre-trained models tốt
var model = MLContext.Model.Load("facenet.zip");
var predictions = model.Transform(imageData);
```

2. **Performance: C# vs Node.js cho CPU-intensive**
```
Benchmark: 1000 face embeddings
Node.js: 15s
.NET Core: 3s (5x faster!)

Reason: 
- .NET JIT compiler tốt hơn V8 cho numerical computing
- SIMD optimizations
- Better memory management
```

3. **Emgu.CV (OpenCV wrapper)**
```csharp
// Image preprocessing
using Emgu.CV;
var image = CvInvoke.Imread("face.jpg");
var gray = new Mat();
CvInvoke.CvtColor(image, gray, ColorConversion.Bgr2Gray);
```

4. **Math libraries**
- MathNet.Numerics cho matrix operations
- Accord.NET cho ML algorithms

**Why not Node.js?**
- TensorFlow.js có nhưng slower cho inference
- Node.js single-threaded → Bad cho CPU-intensive
- Python tốt nhưng deployment phức tạp hơn .NET

**Trade-offs:**
- ✅ Performance, ML ecosystem
- ❌ Thêm 1 tech stack (team phải biết C#)
- ❌ Docker image lớn hơn (500MB vs 200MB Node.js)

---

### Q23: shared-common versioning strategy?

**Answer:**
**Current approach: Workspace monorepo**
```json
// services/auth/package.json
{
  "dependencies": {
    "@graduate-project/shared-common": "workspace:*"
  }
}
```

**Problem: Breaking changes**
```typescript
// shared-common v1.0.0
export interface User {
  name: string;
}

// shared-common v1.1.0 (breaking!)
export interface User {
  firstName: string;
  lastName: string;
}

// If update shared-common → All services break!
```

**Solution 1: Semantic versioning + separate releases**
```json
// shared-common/package.json
{
  "name": "@graduate-project/shared-common",
  "version": "1.2.3"  // Explicit version
}

// services/auth/package.json
{
  "dependencies": {
    "@graduate-project/shared-common": "^1.2.0"
  }
}
```

**Solution 2: Gradual migration**
```typescript
// shared-common - Support both old and new
export interface User {
  // Deprecated
  /** @deprecated Use firstName + lastName */
  name?: string;
  
  // New
  firstName: string;
  lastName: string;
}

// Migration helper
export function migrateUser(old: UserV1): UserV2 {
  const [firstName, lastName] = old.name.split(' ');
  return { firstName, lastName };
}
```

**Solution 3: Feature flags trong shared lib**
```typescript
// shared-common
export const FEATURES = {
  USE_NEW_USER_SCHEMA: process.env.USE_NEW_USER_SCHEMA === 'true',
};

// Usage
if (FEATURES.USE_NEW_USER_SCHEMA) {
  // Use new schema
} else {
  // Use old schema
}
```

**Best practice:**
1. Avoid breaking changes nếu có thể
2. Deprecation warnings trước khi remove
3. Test all services sau khi update shared
4. CI/CD test integration

---

### Q24: Cost optimization - Giảm xuống 1 node?

**Answer:**
**Trade-off analysis:**

**Cost:**
```
Current: 2 nodes × $30/month = $60
Proposed: 1 node × $30/month = $30
Savings: $30/month ($360/year)
```

**Risks:**

**1. ❌ Zero High Availability**
```
1 node down → Toàn bộ system down
No rolling updates (pod restart → downtime)
Maintenance → Scheduled downtime
```

**2. ❌ Resource constraints**
```
Current: 8GB RAM total, ~4GB used → 50% utilization ✅
With 1 node: 4GB RAM, ~4GB used → 100% utilization ❌

Memory spike → OOMKilled → CrashLoop
```

**3. ❌ No fault tolerance**
```
Current: Pod on Node 1 crash → Reschedule to Node 2 (10s downtime)
With 1 node: Pod crash → Reschedule on same node (30s+ downtime)
```

**Recommendation: NO**
```
$30/month savings không đáng để:
- 99% → 95% uptime (lose revenue > $30)
- User trust
- Production incidents

Alternative cost savings:
1. Reserved instances: $60 → $40/month
2. Spot instances for dev: $60 → $35/month
3. Use t3.small thay vì t3.medium (if sufficient)
4. Kubernetes cluster autoscaling (scale down off-hours)
```

**If forced to 1 node** (dev environment only):
```yaml
# Use Pod Disruption Budget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: attendance-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: attendance

# At least 1 pod always up during updates
```

---

## Round 9: Future Scaling

### Q25: Scale 10,000 employees, 50,000 check-ins/day - Bottlenecks?

**Answer:**
**Current capacity:**
```
Employees: ~500
Check-ins: ~1,000/day
Peak: 8-9 AM (500 check-ins/hour)

Proposed:
Employees: 10,000 (20x)
Check-ins: 50,000/day (50x)
Peak: 25,000 check-ins/hour (50x)
```

**Bottleneck 1: Face Recognition**
```
Current: 2 replicas, 1 request = 1s
Capacity: 2 req/s × 3600s = 7,200 req/hour

Needed: 25,000 req/hour
→ Need 25,000 / 7,200 = 4 replicas minimum
→ With buffer: 8 replicas

Resource:
8 pods × 1 CPU × 512MB = 8 CPU, 4GB RAM
→ Need 3-4 nodes (t3.large)
```

**Bottleneck 2: PostgreSQL**
```
10,000 employees × 128-dim embeddings
= 10,000 rows × 512 bytes = 5MB (small!)

Attendance records:
50,000/day × 365 days = 18M records/year
= ~10GB data

Queries:
SELECT * FROM attendance WHERE employee_id = ? AND date = ?
With index: <10ms → Not a bottleneck

BUT: Write throughput
50,000 check-ins/day = ~35 writes/second peak
→ Need write replica / sharding
```

**Bottleneck 3: RabbitMQ**
```
Each check-in → 3 events:
- attendance.created
- notification.send
- reporting.sync

Total: 50,000 × 3 = 150,000 messages/day
Peak: 75,000 messages/hour = 21 msg/s

RabbitMQ capacity: >10,000 msg/s (not a bottleneck)
```

**Migration plan:**

**Phase 1: Vertical scaling (1 tháng)**
```
- Scale nodes: t3.medium → t3.large
- Scale PostgreSQL: Increase connection pool
- Scale Redis: More memory
```

**Phase 2: Horizontal scaling (2-3 tháng)**
```
- Face Recognition: 2 → 8 replicas
- Attendance: 3 → 10 replicas
- Database read replicas: 1 master + 2 read replicas
```

**Phase 3: Architecture changes (3-6 tháng)**
```
- CDN cho face images
- Caching layer (Redis Cluster)
- Database sharding (by department_id)
- Async processing (queue-based check-in)
```

---

### Q26: Multi-tenancy (SaaS) - Data isolation?

**Answer:**
**3 approaches comparison:**

**Option 1: Database per tenant**
```
Company A → Database A
Company B → Database B
Company C → Database C
```

**Pros:**
- ✅ Strong isolation (data leak impossible)
- ✅ Easy backup/restore per tenant
- ✅ Custom schema per tenant
- ✅ Easy to migrate tenant

**Cons:**
- ❌ High cost (100 companies = 100 databases)
- ❌ Hard to maintain (schema changes = 100 migrations)
- ❌ Resource waste (small tenant = underutilized DB)

**When to use:** Enterprise customers (high-value)

---

**Option 2: Schema per tenant**
```
Database: shared_db
Schemas:
  - company_a.employees
  - company_b.employees
  - company_c.employees
```

**Pros:**
- ✅ Good isolation
- ✅ Lower cost (1 database instance)
- ✅ Can set per-schema resource limits

**Cons:**
- ❌ Schema sprawl (100 companies = 100 schemas)
- ❌ PostgreSQL max schemas limit
- ❌ Complex migrations

**When to use:** Mid-sized customers (100-500 users)

---

**Option 3: Row-level security (shared database)**
```
Database: shared_db
Tables:
  employees (tenant_id, ...)
  attendance (tenant_id, ...)
```

**Implementation:**
```sql
-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY tenant_isolation ON employees
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Set tenant context per request
SET app.current_tenant = 'company-a-uuid';

-- Query (automatic filtering)
SELECT * FROM employees;
-- WHERE tenant_id = 'company-a-uuid' (implicit)
```

**Pros:**
- ✅ Lowest cost
- ✅ Easy maintenance (1 schema)
- ✅ Easy to add tenants
- ✅ Good for small tenants

**Cons:**
- ❌ Weaker isolation (bugs can leak data)
- ❌ Hard to migrate 1 tenant
- ❌ Cannot customize schema per tenant
- ❌ Need bulletproof tenant_id filtering

**When to use:** Small customers (<100 users), high volume

---

**Recommendation: Hybrid**
```
Tier 1 (Enterprise): Database per tenant
- >1000 users
- Custom SLA
- High value contracts

Tier 2 (Business): Schema per tenant
- 100-1000 users
- Standard SLA

Tier 3 (Starter): Row-level security
- <100 users
- Shared resources
```

**Implementation:**
```typescript
@Injectable()
export class TenantService {
  async getTenantStrategy(tenantId: string): Promise<DataSource> {
    const tenant = await this.tenantRepo.findById(tenantId);
    
    switch (tenant.tier) {
      case 'ENTERPRISE':
        // Dedicated database
        return this.createDataSource({
          host: `db-${tenantId}.internal`,
          database: `tenant_${tenantId}`,
        });
        
      case 'BUSINESS':
        // Shared database, different schema
        return this.createDataSource({
          host: 'shared-db.internal',
          database: 'multi_tenant_db',
          schema: `tenant_${tenantId}`,
        });
        
      case 'STARTER':
        // Shared database + RLS
        const ds = this.createDataSource({
          host: 'shared-db.internal',
          database: 'multi_tenant_db',
        });
        // Set tenant context
        await ds.query(`SET app.current_tenant = '${tenantId}'`);
        return ds;
    }
  }
}
```

---

## 🎯 Summary

### Đã trả lời được:
- ✅ Architecture decisions và trade-offs
- ✅ Technical implementations chi tiết
- ✅ Production scenarios và debugging
- ✅ Scaling strategies
- ✅ Security considerations

### Honest về gaps:
- ❌ Saga pattern chưa có
- ❌ Circuit breaker chưa implement
- ❌ Distributed tracing chưa có
- ❌ PostgreSQL HA chưa setup
- ❌ Some edge cases chưa handle

### Next steps:
1. Implement missing patterns (4-6 tuần)
2. Load testing và optimization
3. Document runbooks
4. Share knowledge (blog posts)

**Level assessment sau interview này: Mid-level (75-80%)**
- Hiểu architecture rõ ràng
- Có hands-on experience với production
- Honest về limitations
- Know what to improve

Cần thêm: Production battle scars, resilience patterns implementation.
