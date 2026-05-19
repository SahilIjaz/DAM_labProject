# Redis Cluster Setup for Distributed Caching

## Architecture

```
┌─────────────────────────────────────────────┐
│ Next.js Frontend + App (port 3000)          │
│ Connected to Redis Cluster                  │
└─────────────────────────────────────────────┘
         ↓ (reads/writes via client)
┌─────────────────────────────────────────────┐
│ Redis Cluster (3 nodes + 3 replicas)        │
├─────────────────────────────────────────────┤
│ Node 1: 192.168.1.50:6379 (Islamabad)       │
│ Node 2: 192.168.2.50:6379 (Karachi)         │
│ Node 3: 192.168.3.50:6379 (Peshawar)        │
└─────────────────────────────────────────────┘
  ↓ (each node has a replica for failover)
  Replica 1: 192.168.1.51:6380
  Replica 2: 192.168.2.51:6380
  Replica 3: 192.168.3.51:6380
```

## Installation

### 1. Install Redis on Each Node

```bash
# On each server (Islamabad, Karachi, Peshawar)
sudo apt-get update
sudo apt-get install -y redis-server redis-tools

# Verify installation
redis-server --version
```

### 2. Configure Redis for Cluster Mode

Create `/etc/redis/redis-cluster.conf` on each node:

**Node 1 (Islamabad - 192.168.1.50:6379)**
```conf
port 6379
bind 192.168.1.50 127.0.0.1
cluster-enabled yes
cluster-config-file /var/lib/redis/nodes-6379.conf
cluster-node-timeout 5000
appendonly yes
appendfsync everysec
dir /var/lib/redis
logfile /var/log/redis/redis-cluster.log
daemonize yes
pidfile /var/run/redis_6379.pid

# Replica configuration
min-slaves-to-write 1
min-slaves-max-lag 10

# Memory management
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
```

**Node 2 (Karachi - 192.168.2.50:6379)**
```conf
port 6379
bind 192.168.2.50 127.0.0.1
cluster-enabled yes
cluster-config-file /var/lib/redis/nodes-6379.conf
cluster-node-timeout 5000
appendonly yes
appendfsync everysec
dir /var/lib/redis
logfile /var/log/redis/redis-cluster.log
daemonize yes
pidfile /var/run/redis_6379.pid
min-slaves-to-write 1
min-slaves-max-lag 10
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

**Node 3 (Peshawar - 192.168.3.50:6379)**
```conf
port 6379
bind 192.168.3.50 127.0.0.1
cluster-enabled yes
cluster-config-file /var/lib/redis/nodes-6379.conf
cluster-node-timeout 5000
appendonly yes
appendfsync everysec
dir /var/lib/redis
logfile /var/log/redis/redis-cluster.log
daemonize yes
pidfile /var/run/redis_6379.pid
min-slaves-to-write 1
min-slaves-max-lag 10
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 3. Create Redis Directories

```bash
# On each node
sudo mkdir -p /var/lib/redis /var/log/redis
sudo chown -R redis:redis /var/lib/redis /var/log/redis
sudo chmod -R 755 /var/lib/redis /var/log/redis
```

### 4. Start Redis Cluster Nodes

```bash
# On each node
sudo systemctl enable redis-server
sudo systemctl start redis-server
sudo systemctl status redis-server

# Verify each node is listening
redis-cli -h 192.168.1.50 ping
redis-cli -h 192.168.2.50 ping
redis-cli -h 192.168.3.50 ping
# All should respond with PONG
```

### 5. Initialize Cluster

Run on **any one node** (e.g., Islamabad):

```bash
redis-cli --cluster create \
  192.168.1.50:6379 \
  192.168.2.50:6379 \
  192.168.3.50:6379 \
  192.168.1.51:6380 \
  192.168.2.51:6380 \
  192.168.3.51:6380 \
  --cluster-replicas 1
```

This creates:
- 3 primary nodes (one per campus)
- 3 replica nodes (failover copies on alternate port 6380)
- Each primary has 1 replica for high availability

**When prompted:** Type `yes` to accept the configuration

### 6. Verify Cluster Status

```bash
redis-cli -h 192.168.1.50 cluster info
# Expected output:
# cluster_state:ok
# cluster_slots_assigned:16384
# cluster_slots_ok:16384
# cluster_slots_pfail:0
# cluster_slots_fail:0
# cluster_known_nodes:6
# cluster_size:3

redis-cli -h 192.168.1.50 cluster nodes
# Lists all 6 nodes with their roles (master/slave) and status
```

## Application Integration

Update `src/lib/db/redis.ts`:

```typescript
import redis from 'redis';

// Redis Cluster client
const cluster = redis.createCluster({
  modules: [],
  nodes: [
    {
      host: '192.168.1.50',
      port: 6379,
    },
    {
      host: '192.168.2.50',
      port: 6379,
    },
    {
      host: '192.168.3.50',
      port: 6379,
    },
  ],
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error('Max retries exceeded');
      return retries * 100;
    },
  },
});

cluster.on('error', (err) => console.log('Redis Client Error', err));

export async function initRedis() {
  await cluster.connect();
}

export async function cacheGet(key: string): Promise<string | null> {
  return await cluster.get(key);
}

export async function cacheSet(
  key: string,
  value: string,
  ttl?: number
): Promise<void> {
  if (ttl) {
    await cluster.setEx(key, ttl, value);
  } else {
    await cluster.set(key, value);
  }
}

export async function cacheDel(key: string): Promise<number> {
  return await cluster.del(key);
}

export async function cacheIncrBy(key: string, increment: number): Promise<number> {
  return await cluster.incrBy(key, increment);
}

// Batch operations
export async function cacheMget(keys: string[]): Promise<(string | null)[]> {
  return await cluster.mGet(keys);
}

export async function cacheMset(keyValues: { key: string; value: string }[]): Promise<void> {
  const flat = keyValues.flatMap((kv) => [kv.key, kv.value]);
  await cluster.mSet(flat);
}

export async function cacheFlushAll(): Promise<void> {
  // Warning: This flushes all nodes in cluster
  const nodes = cluster.nodes;
  for (const node of nodes) {
    await node.flushAll();
  }
}

export async function closeRedis() {
  await cluster.quit();
}

export default cluster;
```

## Key Namespacing Strategy

Prevent cache collisions by using service-specific prefixes:

```typescript
// Cache key naming convention
const PREFIX = {
  STUDENT: 'student:',
  COURSE: 'course:',
  FACULTY: 'faculty:',
  ENROLLMENT: 'enrollment:',
  EXAM: 'exam:',
  GRADE: 'grade:',
  ADMIN: 'admin:',
  ANALYTICS: 'analytics:',
};

// Example usage
async function getStudentCache(studentId: number) {
  const key = `${PREFIX.STUDENT}${studentId}`;
  const cached = await cacheGet(key);
  if (cached) return JSON.parse(cached);

  // Fetch from DB
  const student = await db.query('SELECT * FROM students WHERE id = ?', [studentId]);
  
  // Cache for 5 minutes
  await cacheSet(key, JSON.stringify(student), 300);
  return student;
}

async function invalidateStudentCache(studentId: number) {
  const key = `${PREFIX.STUDENT}${studentId}`;
  await cacheDel(key);
  
  // Also invalidate list cache
  await cacheDel(`${PREFIX.STUDENT}list`);
}
```

## Monitoring Cluster Health

### Script to check cluster status

```bash
#!/bin/bash
# distributed/check-redis-cluster.sh

echo "=== Redis Cluster Status ==="
redis-cli -h 192.168.1.50 cluster info

echo -e "\n=== Cluster Nodes ==="
redis-cli -h 192.168.1.50 cluster nodes

echo -e "\n=== Node Info (Islamabad) ==="
redis-cli -h 192.168.1.50 info server

echo -e "\n=== Node Info (Karachi) ==="
redis-cli -h 192.168.2.50 info server

echo -e "\n=== Node Info (Peshawar) ==="
redis-cli -h 192.168.3.50 info server

echo -e "\n=== Memory Usage ==="
redis-cli -h 192.168.1.50 info memory
```

### Redis CLI cluster commands

```bash
# Check slot distribution
redis-cli -h 192.168.1.50 cluster slots

# Check specific node
redis-cli -h 192.168.1.50 cluster nodes | grep 192.168.1.50

# Test write (will be distributed across cluster)
redis-cli -h 192.168.1.50 set test-key "test-value"
redis-cli -h 192.168.2.50 get test-key  # Should return value (read from any node)

# Check replication status
redis-cli -h 192.168.1.50 role  # Returns "master" or "slave" info
redis-cli -h 192.168.1.51 role  # Replica node info
```

## Failover Behavior

### If a node goes down

Redis Cluster automatically:
1. Detects node failure (within 15 seconds by default)
2. Promotes replica to master (if available)
3. Continues serving requests using remaining nodes
4. No manual intervention needed

### To manually repair a failed node

```bash
# 1. Fix the failed node (restart, hardware repair, etc.)
sudo systemctl restart redis-server

# 2. Rejoin cluster (Redis will resync)
redis-cli -h 192.168.X.50 cluster meet 192.168.1.50 6379

# 3. Verify rebalancing
redis-cli -h 192.168.1.50 cluster info
```

## Performance Tuning

### Connection pooling in application

```typescript
// Use connection pool to avoid exhausting Redis connections
const cluster = redis.createCluster({
  nodes: [...],
  socket: {
    maxConnections: 20,
    minConnections: 5,
  },
});
```

### Cache warming on startup

```typescript
async function warmCache() {
  // Pre-load frequently accessed data
  const courses = await db.query('SELECT * FROM courses LIMIT 100');
  for (const course of courses) {
    await cacheSet(
      `${PREFIX.COURSE}${course.id}`,
      JSON.stringify(course),
      3600  // 1 hour TTL
    );
  }
}
```

## Persistence Strategy

- **AOF (Append-Only File):** Every write is logged to disk for durability
- **RDB (Snapshot):** Periodic snapshots every 15 minutes
- Replicas automatically sync with masters
- If all nodes fail, data recovers from disk

## Environment Variables

Add to `.env`:

```
REDIS_CLUSTER_NODES=192.168.1.50:6379,192.168.2.50:6379,192.168.3.50:6379
REDIS_CLUSTER_PASSWORD=          # Optional: if cluster requires auth
REDIS_TTL_STUDENT=300            # 5 minutes
REDIS_TTL_COURSE=600             # 10 minutes
REDIS_TTL_ANALYTICS=3600         # 1 hour
```

## Testing Cache Across Locations

```bash
# From Islamabad
redis-cli -h 192.168.1.50 set campus:islamabad "test-data"

# From Karachi (should be accessible)
redis-cli -h 192.168.2.50 get campus:islamabad
# Returns: "test-data"

# From Peshawar (should be accessible)
redis-cli -h 192.168.3.50 get campus:islamabad
# Returns: "test-data"
```

## Key Points

- **Automatic sharding:** Redis Cluster distributes data across 3 nodes (16384 slots)
- **High availability:** Each node has a replica for automatic failover
- **No single point of failure:** Can lose 1 master or 1 replica per shard without data loss
- **Geo-distributed:** One primary node per campus ensures local latency
- **Eventually consistent:** All nodes converge to same state within milliseconds
- **Backup:** Replicas provide automatic backup, plus RDB snapshots
