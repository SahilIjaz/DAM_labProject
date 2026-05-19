# MySQL Master-Slave Replication Setup

## Architecture

```
Primary Campus (Islamabad)
├── MySQL Master (Main Database)
│   ├── Replicates to: Secondary (Karachi)
│   └── Replicates to: Tertiary (Peshawar)
│
Secondary Campus (Karachi)
├── MySQL Slave 1 (Read-only, receives updates from Master)
│
Tertiary Campus (Peshawar)
└── MySQL Slave 2 (Read-only, receives updates from Master)
```

## Server Configuration

### Primary Master (Islamabad) - 192.168.1.100

```sql
-- MySQL Configuration: /etc/mysql/mysql.conf.d/mysqld.cnf

[mysqld]
# Replication Configuration
server-id = 1
log_bin = /var/log/mysql/mysql-bin.log
binlog_format = ROW
binlog_do_db = university_main
relay-log = /var/log/mysql/mysql-relay-bin
relay-log-index = /var/log/mysql/mysql-relay-bin.index

# Performance
max_connections = 500
max_allowed_packet = 256M
bind-address = 0.0.0.0

# Other
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 2
```

### Secondary Slave 1 (Karachi) - 192.168.2.100

```sql
[mysqld]
server-id = 2
log_bin = /var/log/mysql/mysql-bin.log
binlog_format = ROW
relay-log = /var/log/mysql/mysql-relay-bin
relay-log-index = /var/log/mysql/mysql-relay-bin.index
read_only = ON

max_connections = 500
max_allowed_packet = 256M
bind-address = 0.0.0.0

# Replication user (optional - for slave to master)
relay-log-purge = 1
relay-log-recovery = 1
```

### Tertiary Slave 2 (Peshawar) - 192.168.3.100

```sql
[mysqld]
server-id = 3
log_bin = /var/log/mysql/mysql-bin.log
binlog_format = ROW
relay-log = /var/log/mysql/mysql-relay-bin
relay-log-index = /var/log/mysql/mysql-relay-bin.index
read_only = ON

max_connections = 500
max_allowed_packet = 256M
bind-address = 0.0.0.0

relay-log-purge = 1
relay-log-recovery = 1
```

## Setup Steps

### 1. Create Replication User on Master (Islamabad)

```sql
-- Run on Master only
CREATE USER 'replication_user'@'%' IDENTIFIED BY 'replication_password';
GRANT REPLICATION SLAVE ON *.* TO 'replication_user'@'%';
FLUSH PRIVILEGES;

-- Get current binary log position
SHOW MASTER STATUS;
-- Note: File name and Position (e.g., mysql-bin.000001, 1234)
```

### 2. Backup Master Database

```bash
# On Master (Islamabad)
mysqldump -u root -p --all-databases --master-data=2 --single-transaction \
  > /tmp/master_backup.sql

# Transfer to Slave 1 and Slave 2
scp /tmp/master_backup.sql user@192.168.2.100:/tmp/
scp /tmp/master_backup.sql user@192.168.3.100:/tmp/
```

### 3. Restore Backup on Slaves

```bash
# On Slave 1 (Karachi)
mysql -u root -p < /tmp/master_backup.sql

# On Slave 2 (Peshawar)
mysql -u root -p < /tmp/master_backup.sql
```

### 4. Configure Replication on Slaves

```sql
-- On Slave 1 (Karachi) - 192.168.2.100
CHANGE MASTER TO
  MASTER_HOST='192.168.1.100',
  MASTER_USER='replication_user',
  MASTER_PASSWORD='replication_password',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=1234;

START SLAVE;
SHOW SLAVE STATUS\G

-- Repeat same on Slave 2 (Peshawar) with same values
```

### 5. Monitor Replication

```sql
-- Check on Master
SHOW MASTER STATUS;

-- Check on each Slave
SHOW SLAVE STATUS\G

-- Key fields to verify:
-- Slave_IO_Running: Yes
-- Slave_SQL_Running: Yes
-- Seconds_Behind_Master: 0 (or small number)
```

## Application Configuration

Update `.env.local` to use master for writes and slaves for reads:

```env
# Master (Islamabad) - Used for INSERT, UPDATE, DELETE
MYSQL_MASTER_HOST=192.168.1.100
MYSQL_MASTER_PORT=3306
MYSQL_MASTER_USER=root
MYSQL_MASTER_PASSWORD=password
MYSQL_MASTER_DATABASE=university_main

# Slaves (Read-only) - Used for SELECT
MYSQL_SLAVE_HOST_1=192.168.2.100  # Karachi
MYSQL_SLAVE_PORT_1=3306
MYSQL_SLAVE_HOST_2=192.168.3.100  # Peshawar
MYSQL_SLAVE_PORT_2=3306
MYSQL_SLAVE_USER=root
MYSQL_SLAVE_PASSWORD=password
MYSQL_SLAVE_DATABASE=university_main
```

## Create Read/Write Split Connection

Update `src/lib/db/mysql.ts`:

```typescript
import mysql from 'mysql2/promise';

// Master connection pool (writes)
const masterPool = mysql.createPool({
  host: process.env.MYSQL_MASTER_HOST,
  port: parseInt(process.env.MYSQL_MASTER_PORT || '3306'),
  user: process.env.MYSQL_MASTER_USER,
  password: process.env.MYSQL_MASTER_PASSWORD,
  database: process.env.MYSQL_MASTER_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});

// Slave connection pools (reads)
const slavePools = [
  mysql.createPool({
    host: process.env.MYSQL_SLAVE_HOST_1,
    port: parseInt(process.env.MYSQL_SLAVE_PORT_1 || '3306'),
    user: process.env.MYSQL_SLAVE_USER,
    password: process.env.MYSQL_SLAVE_PASSWORD,
    database: process.env.MYSQL_SLAVE_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
  }),
  mysql.createPool({
    host: process.env.MYSQL_SLAVE_HOST_2,
    port: parseInt(process.env.MYSQL_SLAVE_PORT_2 || '3306'),
    user: process.env.MYSQL_SLAVE_USER,
    password: process.env.MYSQL_SLAVE_PASSWORD,
    database: process.env.MYSQL_SLAVE_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
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
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(query, params);
    return results as T[];
  } finally {
    connection.release();
  }
}

export { masterPool, slavePools };
```

## Monitoring

### Script to check replication status

```bash
#!/bin/bash
# distributed/check-replication.sh

echo "=== Master Status ==="
mysql -h 192.168.1.100 -u root -p -e "SHOW MASTER STATUS\G"

echo -e "\n=== Slave 1 Status (Karachi) ==="
mysql -h 192.168.2.100 -u root -p -e "SHOW SLAVE STATUS\G"

echo -e "\n=== Slave 2 Status (Peshawar) ==="
mysql -h 192.168.3.100 -u root -p -e "SHOW SLAVE STATUS\G"
```

## Troubleshooting

### Slave replication stopped

```sql
-- Check error
SHOW SLAVE STATUS\G

-- Fix: Skip problematic event
SET GLOBAL SQL_SLAVE_SKIP_COUNTER = 1;
START SLAVE;
```

### Resync slave from master

```sql
-- On slave
STOP SLAVE;
RESET SLAVE ALL;

-- Get master position
-- SHOW MASTER STATUS on master;

-- Reconfigure
CHANGE MASTER TO
  MASTER_HOST='192.168.1.100',
  MASTER_USER='replication_user',
  MASTER_PASSWORD='replication_password',
  MASTER_LOG_FILE='mysql-bin.000001',
  MASTER_LOG_POS=1234;

START SLAVE;
```

## Key Points

- **Master (Islamabad)** handles all writes (INSERT, UPDATE, DELETE)
- **Slaves (Karachi, Peshawar)** handle reads only (SELECT queries)
- **Replication lag** - Usually < 1 second, monitor with `Seconds_Behind_Master`
- **Data consistency** - Eventually consistent (slaves catch up to master)
- **Failover** - If master fails, promote a slave to master
- **Read scaling** - Add more slaves for better read performance
