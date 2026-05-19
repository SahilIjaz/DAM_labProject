# PostgreSQL Replication Setup for Analytics

## Architecture

```
Primary Campus (Islamabad)
├── PostgreSQL Primary (192.168.1.200:5432)
│   ├── Binary Logs enabled
│   └── Replication user configured
│
Secondary Campus (Karachi)
├── PostgreSQL Replica 1 (192.168.2.200:5432)
│   └── Streaming replication from Primary
│
Tertiary Campus (Peshawar)
└── PostgreSQL Replica 2 (192.168.3.200:5432)
    └── Streaming replication from Primary
```

## Installation

### 1. Install PostgreSQL on All Nodes

```bash
# On all three servers (Islamabad, Karachi, Peshawar)
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Verify installation
psql --version
```

### 2. Create Analytics Database on Primary

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database
CREATE DATABASE university_analytics
  OWNER postgres
  ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8';

# Create replication user
CREATE USER replication_user WITH REPLICATION PASSWORD 'replication_password';

# Grant privileges
GRANT CONNECT ON DATABASE university_analytics TO replication_user;

# Exit psql
\q
```

## Primary Server Configuration (Islamabad - 192.168.1.200)

### 1. Edit PostgreSQL Configuration

Edit `/etc/postgresql/15/main/postgresql.conf`:

```conf
# Connection settings
listen_addresses = '*'
max_connections = 200
max_wal_senders = 10
max_replication_slots = 10

# WAL (Write-Ahead Log) settings
wal_level = replica
wal_keep_size = 1GB
wal_retention_size = 2GB

# Archiving (optional, for PITR)
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'
archive_timeout = 300

# Hot standby feedback
hot_standby = on
hot_standby_feedback = on

# Replication timeout
wal_receiver_timeout = 60s
wal_receiver_status_interval = 10s

# Logging
log_replication_commands = on
log_min_duration_statement = 1000  # Log queries > 1 second
log_connections = on
log_disconnections = on
```

### 2. Configure Host-Based Authentication

Edit `/etc/postgresql/15/main/pg_hba.conf`:

```conf
# Allow replication from other servers
host    replication     replication_user    192.168.2.200/32    md5
host    replication     replication_user    192.168.3.200/32    md5

# Allow analytics app to connect from any internal network
host    university_analytics    all    192.168.0.0/16    md5

# Standard local connections
local   all             postgres                          peer
local   all             all                               peer
host    all             all             127.0.0.1/32      md5
host    all             all             ::1/128           md5
```

### 3. Create Archive Directory

```bash
# Create archive directory for WAL files
sudo mkdir -p /var/lib/postgresql/archive
sudo chown postgres:postgres /var/lib/postgresql/archive
sudo chmod 700 /var/lib/postgresql/archive
```

### 4. Restart PostgreSQL Primary

```bash
sudo systemctl restart postgresql
sudo systemctl status postgresql

# Verify it's listening on all interfaces
sudo netstat -tlpn | grep 5432
```

## Replica Server Configuration (Karachi & Peshawar)

### 1. Backup Primary Database

Run on **Primary (Islamabad)**:

```bash
# Create base backup
sudo -u postgres pg_basebackup \
  -h 192.168.1.200 \
  -D /var/lib/postgresql/15/main \
  -U replication_user \
  -v \
  -P \
  -W \
  --wal-method=stream \
  --format=plain

# When prompted, enter: replication_password
```

**For Karachi Replica:**
```bash
# On Karachi server
sudo -u postgres pg_basebackup \
  -h 192.168.1.200 \
  -D /var/lib/postgresql/15/main \
  -U replication_user \
  -v \
  -P \
  -W \
  --wal-method=stream \
  --format=plain
```

**For Peshawar Replica:**
```bash
# On Peshawar server
sudo -u postgres pg_basebackup \
  -h 192.168.1.200 \
  -D /var/lib/postgresql/15/main \
  -U replication_user \
  -v \
  -P \
  -W \
  --wal-method=stream \
  --format=plain
```

### 2. Configure Replica Standby Settings

Create `/var/lib/postgresql/15/main/recovery.conf` on **both replicas**:

**Karachi (192.168.2.200):**
```conf
standby_mode = 'on'
primary_conninfo = 'host=192.168.1.200 port=5432 user=replication_user password=replication_password application_name=replica_karachi'
recovery_target_timeline = 'latest'

# Streaming replication
wal_retrieve_retry_interval = 5s

# Hot standby allows read-only queries
hot_standby = on
```

**Peshawar (192.168.3.200):**
```conf
standby_mode = 'on'
primary_conninfo = 'host=192.168.1.200 port=5432 user=replication_user password=replication_password application_name=replica_peshawar'
recovery_target_timeline = 'latest'
wal_retrieve_retry_interval = 5s
hot_standby = on
```

### 3. Configure PostgreSQL on Replicas

Edit `/etc/postgresql/15/main/postgresql.conf` on **both replicas**:

```conf
listen_addresses = '*'
max_connections = 200

# Hot standby
hot_standby = on
hot_standby_feedback = on

# Recovery settings
recovery_target_timeline = 'latest'

# Logging
log_replication_commands = on
log_min_duration_statement = 1000
log_connections = on
```

### 4. Ensure File Permissions

```bash
# On each replica server
sudo chown postgres:postgres /var/lib/postgresql/15/main/recovery.conf
sudo chmod 600 /var/lib/postgresql/15/main/recovery.conf
```

### 5. Start Replica PostgreSQL

```bash
# On Karachi replica
sudo systemctl start postgresql
sudo systemctl status postgresql

# On Peshawar replica
sudo systemctl start postgresql
sudo systemctl status postgresql
```

## Monitoring Replication

### Check Primary Status

```bash
# On Primary (Islamabad)
sudo -u postgres psql -c "SELECT * FROM pg_stat_replication;"

# Expected output shows connected replicas with names: replica_karachi, replica_peshawar
```

### Check Replica Status

```bash
# On Replica (Karachi or Peshawar)
sudo -u postgres psql -c "SELECT pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn();"

# Query to verify replication is working
sudo -u postgres psql -d university_analytics -c "SELECT COUNT(*) FROM pg_stat_activity;"
```

### Replication Lag Query

```bash
# On Primary
sudo -u postgres psql -c "
  SELECT 
    application_name,
    state,
    EXTRACT(EPOCH FROM (NOW() - pg_last_xact_replay_timestamp())) as lag_seconds
  FROM pg_stat_replication;
"

# Should show lag < 1 second for healthy replicas
```

### Monitor Script

```bash
#!/bin/bash
# distributed/check-postgres-replication.sh

echo "=== Primary Status (Islamabad) ==="
sudo -u postgres psql -h 192.168.1.200 -c "SELECT version();"
sudo -u postgres psql -h 192.168.1.200 -c "SELECT * FROM pg_stat_replication;"

echo -e "\n=== Replica Status (Karachi) ==="
sudo -u postgres psql -h 192.168.2.200 -c "SELECT pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn();"
sudo -u postgres psql -h 192.168.2.200 -d university_analytics -c "SELECT COUNT(*) FROM pg_stat_activity;"

echo -e "\n=== Replica Status (Peshawar) ==="
sudo -u postgres psql -h 192.168.3.200 -c "SELECT pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn();"
sudo -u postgres psql -h 192.168.3.200 -d university_analytics -c "SELECT COUNT(*) FROM pg_stat_activity;"
```

## Application Configuration

Update `.env` to use replica for read-only analytics:

```env
# Primary (writes) - Islamabad
PG_MASTER_HOST=192.168.1.200
PG_MASTER_PORT=5432
PG_MASTER_USER=postgres
PG_MASTER_PASSWORD=password
PG_MASTER_DATABASE=university_analytics

# Replicas (reads) - Karachi and Peshawar
PG_SLAVE_HOST_1=192.168.2.200  # Karachi
PG_SLAVE_PORT_1=5432
PG_SLAVE_HOST_2=192.168.3.200  # Peshawar
PG_SLAVE_PORT_2=5432
PG_SLAVE_USER=postgres
PG_SLAVE_PASSWORD=password
PG_SLAVE_DATABASE=university_analytics
```

Create `src/lib/db/postgres.ts` for read/write splitting:

```typescript
import pg from 'pg';

// Master connection (for writes)
const masterPool = new pg.Pool({
  host: process.env.PG_MASTER_HOST || 'localhost',
  port: parseInt(process.env.PG_MASTER_PORT || '5432'),
  user: process.env.PG_MASTER_USER || 'postgres',
  password: process.env.PG_MASTER_PASSWORD,
  database: process.env.PG_MASTER_DATABASE || 'university_analytics',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Slave connection pools (for reads)
const slavePools = [
  new pg.Pool({
    host: process.env.PG_SLAVE_HOST_1 || 'localhost',
    port: parseInt(process.env.PG_SLAVE_PORT_1 || '5432'),
    user: process.env.PG_SLAVE_USER || 'postgres',
    password: process.env.PG_SLAVE_PASSWORD,
    database: process.env.PG_SLAVE_DATABASE || 'university_analytics',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }),
  new pg.Pool({
    host: process.env.PG_SLAVE_HOST_2 || 'localhost',
    port: parseInt(process.env.PG_SLAVE_PORT_2 || '5432'),
    user: process.env.PG_SLAVE_USER || 'postgres',
    password: process.env.PG_SLAVE_PASSWORD,
    database: process.env.PG_SLAVE_DATABASE || 'university_analytics',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }),
];

let currentSlaveIndex = 0;

function getSlavePool() {
  const pool = slavePools[currentSlaveIndex];
  currentSlaveIndex = (currentSlaveIndex + 1) % slavePools.length;
  return pool;
}

export async function executeQuery<T>(
  query: string,
  params?: any[],
  isWrite: boolean = false
): Promise<T[]> {
  const pool = isWrite ? masterPool : getSlavePool();
  try {
    const result = await pool.query(query, params);
    return result.rows as T[];
  } catch (error) {
    console.error('PostgreSQL query error:', error);
    throw error;
  }
}

export async function executeTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await masterPool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function closePools() {
  await masterPool.end();
  for (const pool of slavePools) {
    await pool.end();
  }
}

export { masterPool, slavePools };
```

## Failover Procedures

### If Primary (Islamabad) Goes Down

```bash
# On one of the replicas (e.g., Karachi)
sudo -u postgres psql -d universe_analytics -c "SELECT pg_promote();"

# This promotes the Karachi replica to primary
# Update connection strings to point to new primary
```

### Resync Failed Primary After Recovery

```bash
# On recovered primary (Islamabad)
# First, remove recovery.conf (if it exists)
sudo rm /var/lib/postgresql/15/main/recovery.conf

# Get current LSN from new primary (Karachi)
sudo -u postgres psql -h 192.168.2.200 -c "SELECT pg_current_wal_lsn();"

# Create new base backup from Karachi
sudo -u postgres pg_basebackup \
  -h 192.168.2.200 \
  -D /var/lib/postgresql/15/main \
  -U replication_user \
  -v \
  -P \
  -W \
  --wal-method=stream

# Create recovery.conf to make it a replica of new primary
# ... (point primary_conninfo to Karachi)

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## Key Points

- **Master-Slave Replication:** One primary (Islamabad) replicates to two read-only replicas
- **Streaming Replication:** WAL files stream in real-time (sub-second lag)
- **Hot Standby:** Replicas accept read-only queries while replicating
- **Automatic Failover:** Manual failover required; consider patroni/pg_auto_failover for automatic
- **Data Persistence:** WAL archives + base backups provide recovery point
- **Replication Slots:** Ensures replicas don't fall behind primary
- **Network Resilience:** Handles temporary disconnections gracefully with automatic reconnect

## Testing Analytics Replication

```bash
# On Primary (Islamabad), insert test data
sudo -u postgres psql -d university_analytics -c "
  CREATE TABLE test_replication (id SERIAL PRIMARY KEY, data TEXT);
  INSERT INTO test_replication (data) VALUES ('test data');
"

# On Replica (Karachi), query the data
sudo -u postgres psql -h 192.168.2.200 -d university_analytics -c "
  SELECT * FROM test_replication;
"
# Should see the inserted row

# On Replica (Peshawar), verify replication
sudo -u postgres psql -h 192.168.3.200 -d university_analytics -c "
  SELECT * FROM test_replication;
"
# Should also see the data
```
