# Disaster Recovery and Failover Procedures

## Overview

This document covers procedures for handling failures in the distributed architecture:
- MySQL Master failure → Promote MySQL Slave
- Redis Node failure → Automatic cluster failover
- PostgreSQL Primary failure → Promote PostgreSQL Replica
- Entire campus failure → Redirect to secondary campus

## MySQL Master Failover

### Scenario: Primary MySQL Master (Islamabad) Goes Down

#### Quick Health Check

```bash
#!/bin/bash
# distributed/check-mysql-health.sh

echo "=== Checking MySQL Master (Islamabad) ==="
mysql -h 192.168.1.100 -u root -p -e "SHOW MASTER STATUS\G" 2>/dev/null || echo "MASTER UNREACHABLE"

echo -e "\n=== Checking MySQL Slave 1 (Karachi) ==="
mysql -h 192.168.2.100 -u root -p -e "SHOW SLAVE STATUS\G" 2>/dev/null || echo "SLAVE 1 UNREACHABLE"

echo -e "\n=== Checking MySQL Slave 2 (Peshawar) ==="
mysql -h 192.168.3.100 -u root -p -e "SHOW SLAVE STATUS\G" 2>/dev/null || echo "SLAVE 2 UNREACHABLE"
```

#### Automated Failover Script

```bash
#!/bin/bash
# distributed/mysql-failover.sh
# Promotes a MySQL slave to master when primary fails

MASTER_HOST="192.168.1.100"
SLAVE1_HOST="192.168.2.100"
SLAVE2_HOST="192.168.3.100"
MYSQL_USER="root"
MYSQL_PASS="password"

# Function to check if MySQL is responding
check_mysql() {
  mysql -h $1 -u $MYSQL_USER -p$MYSQL_PASS -e "SELECT 1" > /dev/null 2>&1
  return $?
}

# Function to promote slave to master
promote_slave() {
  local slave_host=$1
  echo "Promoting $slave_host to master..."
  
  # Stop replication
  mysql -h $slave_host -u $MYSQL_USER -p$MYSQL_PASS -e "STOP SLAVE;"
  
  # Remove read-only flag
  mysql -h $slave_host -u $MYSQL_USER -p$MYSQL_PASS -e "SET GLOBAL read_only = OFF;"
  
  # Reset slave status
  mysql -h $slave_host -u $MYSQL_USER -p$MYSQL_PASS -e "RESET SLAVE ALL;"
  
  echo "$slave_host is now MASTER"
}

# Function to make server a slave
make_slave() {
  local new_slave_host=$1
  local new_master_host=$2
  
  echo "Configuring $new_slave_host as slave of $new_master_host..."
  
  # Get master position
  master_status=$(mysql -h $new_master_host -u $MYSQL_USER -p$MYSQL_PASS \
    -e "SHOW MASTER STATUS\G" 2>/dev/null)
  
  master_file=$(echo "$master_status" | grep "File:" | awk '{print $2}')
  master_pos=$(echo "$master_status" | grep "Position:" | awk '{print $2}')
  
  # Configure replication
  mysql -h $new_slave_host -u $MYSQL_USER -p$MYSQL_PASS -e \
    "CHANGE MASTER TO MASTER_HOST='$new_master_host', MASTER_USER='replication_user', MASTER_PASSWORD='replication_password', MASTER_LOG_FILE='$master_file', MASTER_LOG_POS=$master_pos;"
  
  # Start replication
  mysql -h $new_slave_host -u $MYSQL_USER -p$MYSQL_PASS -e "START SLAVE;"
  
  # Set read-only
  mysql -h $new_slave_host -u $MYSQL_USER -p$MYSQL_PASS -e "SET GLOBAL read_only = ON;"
  
  echo "$new_slave_host is now SLAVE of $new_master_host"
}

# Main failover logic
main() {
  echo "=== MySQL Failover Check ==="
  
  # Check if master is down
  if ! check_mysql $MASTER_HOST; then
    echo "ERROR: Master $MASTER_HOST is unreachable!"
    echo "Initiating failover..."
    
    # Check slave1 (Karachi) - prefer this as new master
    if check_mysql $SLAVE1_HOST; then
      promote_slave $SLAVE1_HOST
      
      # Make slave2 a slave of new master
      make_slave $SLAVE2_HOST $SLAVE1_HOST
      
      # Update application configuration
      echo "UPDATE APPLICATION: Change MYSQL_MASTER_HOST to $SLAVE1_HOST"
      
      exit 0
    else
      echo "ERROR: Both master and slave1 are unreachable!"
      
      # Fall back to slave2 (Peshawar)
      if check_mysql $SLAVE2_HOST; then
        promote_slave $SLAVE2_HOST
        echo "CRITICAL: Only slave2 is available. Database may be inconsistent."
        echo "UPDATE APPLICATION: Change MYSQL_MASTER_HOST to $SLAVE2_HOST"
        exit 1
      else
        echo "CRITICAL: All MySQL servers are unreachable!"
        exit 2
      fi
    fi
  else
    echo "Master is healthy. No failover needed."
    exit 0
  fi
}

main
```

#### Application Update After Failover

Once a slave is promoted to master:

1. **Update environment variables** in `.env`:
```env
# Old (now down)
# MYSQL_MASTER_HOST=192.168.1.100

# New (promoted slave)
MYSQL_MASTER_HOST=192.168.2.100  # Karachi is now master
```

2. **Restart application** to use new master:
```bash
npm run dev
```

3. **Verify connectivity**:
```bash
curl http://localhost:3000/api/health
# Should return 200 OK
```

#### Recovering Failed Master (Islamabad)

```bash
#!/bin/bash
# distributed/mysql-recover-primary.sh

PRIMARY_HOST="192.168.1.100"
NEW_MASTER_HOST="192.168.2.100"
MYSQL_USER="root"
MYSQL_PASS="password"

echo "Recovering primary server at $PRIMARY_HOST..."

# 1. Hardware/network repair (manual step)
echo "Step 1: Ensure $PRIMARY_HOST is back online and MySQL is running"
echo "  - Check power, network connectivity, MySQL service"
echo "  - Run: sudo systemctl start mysql on $PRIMARY_HOST"
echo ""

# 2. Wait for it to come online
echo "Step 2: Waiting for server to respond..."
for i in {1..30}; do
  if mysql -h $PRIMARY_HOST -u $MYSQL_USER -p$MYSQL_PASS -e "SELECT 1" > /dev/null 2>&1; then
    echo "Server is online!"
    break
  fi
  echo "  Attempt $i/30..."
  sleep 10
done

# 3. Get new master position
echo "Step 3: Getting replication position from new master..."
master_status=$(mysql -h $NEW_MASTER_HOST -u $MYSQL_USER -p$MYSQL_PASS \
  -e "SHOW MASTER STATUS\G")
master_file=$(echo "$master_status" | grep "File:" | awk '{print $2}')
master_pos=$(echo "$master_status" | grep "Position:" | awk '{print $2}')

echo "New master position: $master_file / $master_pos"

# 4. Configure recovered server as slave
echo "Step 4: Configuring recovered server as slave of $NEW_MASTER_HOST..."
mysql -h $PRIMARY_HOST -u $MYSQL_USER -p$MYSQL_PASS -e \
  "CHANGE MASTER TO MASTER_HOST='$NEW_MASTER_HOST', MASTER_USER='replication_user', MASTER_PASSWORD='replication_password', MASTER_LOG_FILE='$master_file', MASTER_LOG_POS=$master_pos;"

# 5. Start replication
mysql -h $PRIMARY_HOST -u $MYSQL_USER -p$MYSQL_PASS -e "START SLAVE;"

# 6. Verify
echo "Step 5: Verifying replication status..."
mysql -h $PRIMARY_HOST -u $MYSQL_USER -p$MYSQL_PASS -e "SHOW SLAVE STATUS\G" | grep -E "Slave_IO_Running|Slave_SQL_Running|Seconds_Behind_Master"

echo "Recovery complete!"
```

## Redis Cluster Failover

### Automatic Recovery (Redis handles this)

Redis Cluster **automatically** handles node failures:

```bash
#!/bin/bash
# distributed/check-redis-cluster-health.sh

echo "=== Redis Cluster Health Check ==="

# Check if cluster is healthy
redis-cli -h 192.168.1.50 cluster info | grep cluster_state

# If cluster_state is not "ok", investigate
if redis-cli -h 192.168.1.50 cluster info | grep -q "cluster_state:fail"; then
  echo "ALERT: Redis Cluster is in FAIL state!"
  echo "Running diagnostic..."
  
  redis-cli -h 192.168.1.50 cluster nodes
fi

# Check each node
for node in "192.168.1.50" "192.168.2.50" "192.168.3.50"; do
  echo -e "\n=== Node $node ==="
  redis-cli -h $node ping
done
```

### Manual Recovery if Node Fails

```bash
#!/bin/bash
# distributed/redis-node-recovery.sh
# Recovers a failed Redis node

FAILED_NODE="192.168.1.50"
HEALTHY_NODE="192.168.2.50"

echo "Recovering Redis node at $FAILED_NODE..."

# 1. Restart the failed node
echo "Step 1: Restarting Redis on $FAILED_NODE..."
ssh redis@$FAILED_NODE "sudo systemctl restart redis-server"

# 2. Wait for node to come online
echo "Step 2: Waiting for node to come online..."
for i in {1..30}; do
  if redis-cli -h $FAILED_NODE ping > /dev/null 2>&1; then
    echo "Node is online!"
    break
  fi
  echo "  Attempt $i/30..."
  sleep 2
done

# 3. Rejoin cluster
echo "Step 3: Rejoining cluster..."
redis-cli -h $FAILED_NODE cluster meet 192.168.1.50 6379

# 4. Verify cluster is healthy
echo "Step 4: Verifying cluster health..."
redis-cli -h $HEALTHY_NODE cluster info

echo "Recovery complete!"
```

## PostgreSQL Primary Failover

### Automatic Detection and Manual Promotion

```bash
#!/bin/bash
# distributed/postgres-failover.sh
# Promotes PostgreSQL replica to primary

PRIMARY_HOST="192.168.1.200"
REPLICA1_HOST="192.168.2.200"  # Karachi
REPLICA2_HOST="192.168.3.200"  # Peshawar

echo "=== PostgreSQL Failover Check ==="

# Check if primary is responsive
if ! sudo -u postgres psql -h $PRIMARY_HOST -c "SELECT 1" > /dev/null 2>&1; then
  echo "ERROR: Primary $PRIMARY_HOST is unreachable!"
  echo "Promoting replica at $REPLICA1_HOST to primary..."
  
  # Promote Karachi replica
  ssh postgres@$REPLICA1_HOST "sudo -u postgres psql -d university_analytics -c \"SELECT pg_promote();\""
  
  echo "Karachi replica is now PRIMARY"
  echo ""
  echo "Next steps:"
  echo "1. Update environment variables:"
  echo "   PG_MASTER_HOST=192.168.2.200"
  echo "2. Restart application"
  echo "3. Reconfigure Peshawar as replica of Karachi"
  
else
  echo "Primary is healthy. No failover needed."
fi
```

### Recovery Script for Failed Primary

```bash
#!/bin/bash
# distributed/postgres-recover-primary.sh

OLD_PRIMARY="192.168.1.200"
NEW_PRIMARY="192.168.2.200"

echo "Recovering PostgreSQL primary at $OLD_PRIMARY..."

# 1. Ensure server is reachable
echo "Step 1: Waiting for server to come online..."
for i in {1..30}; do
  if ssh postgres@$OLD_PRIMARY "sudo systemctl status postgresql" > /dev/null 2>&1; then
    echo "Server is online!"
    break
  fi
  echo "  Attempt $i/30..."
  sleep 10
done

# 2. Create base backup from new primary
echo "Step 2: Creating base backup from new primary..."
ssh postgres@$OLD_PRIMARY << 'EOF'
sudo -u postgres pg_basebackup \
  -h 192.168.2.200 \
  -D /var/lib/postgresql/15/main \
  -U replication_user \
  -v -P -W \
  --wal-method=stream
EOF

# 3. Create recovery configuration
echo "Step 3: Creating recovery configuration..."
ssh postgres@$OLD_PRIMARY << 'EOF'
sudo tee /var/lib/postgresql/15/main/recovery.conf > /dev/null << 'CONF'
standby_mode = 'on'
primary_conninfo = 'host=192.168.2.200 port=5432 user=replication_user password=replication_password application_name=replica_islamabad'
recovery_target_timeline = 'latest'
hot_standby = on
CONF

sudo chown postgres:postgres /var/lib/postgresql/15/main/recovery.conf
sudo chmod 600 /var/lib/postgresql/15/main/recovery.conf
EOF

# 4. Restart PostgreSQL
echo "Step 4: Restarting PostgreSQL..."
ssh postgres@$OLD_PRIMARY "sudo systemctl restart postgresql"

# 5. Verify replication
echo "Step 5: Verifying replication..."
ssh postgres@$OLD_PRIMARY "sudo -u postgres psql -c \"SELECT pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn();\""

echo "Recovery complete!"
```

## Complete Campus Failure

### Scenario: Entire Islamabad Campus Goes Down

Network and power infrastructure failure requires geographic failover.

```bash
#!/bin/bash
# distributed/campus-failover.sh
# Handles complete campus failure - redirects all traffic to remaining campuses

PRIMARY_CAMPUS="192.168.1.0/24"   # Islamabad
SECONDARY_CAMPUS="192.168.2.0/24" # Karachi
TERTIARY_CAMPUS="192.168.3.0/24"  # Peshawar

echo "=== Complete Campus Failover Check ==="

# Ping primary campus gateway
if ! ping -c 1 192.168.1.1 > /dev/null 2>&1; then
  echo "CRITICAL: Primary Campus (Islamabad) is unreachable!"
  echo ""
  echo "Initiating campus-wide failover..."
  
  # Step 1: Promote Karachi MySQL slave to master
  echo "Step 1: Promoting Karachi MySQL slave to master..."
  mysql -h 192.168.2.100 -u root -p -e "STOP SLAVE;"
  mysql -h 192.168.2.100 -u root -p -e "SET GLOBAL read_only = OFF;"
  mysql -h 192.168.2.100 -u root -p -e "RESET SLAVE ALL;"
  echo "  ✓ Karachi MySQL is now MASTER"
  
  # Step 2: Make Peshawar a slave of Karachi
  echo "Step 2: Configuring Peshawar as slave of Karachi..."
  mysql -h 192.168.2.100 -u root -p -e "SHOW MASTER STATUS\G" > /tmp/master_status.txt
  master_file=$(grep "File:" /tmp/master_status.txt | awk '{print $2}')
  master_pos=$(grep "Position:" /tmp/master_status.txt | awk '{print $2}')
  
  mysql -h 192.168.3.100 -u root -p -e \
    "CHANGE MASTER TO MASTER_HOST='192.168.2.100', MASTER_USER='replication_user', MASTER_PASSWORD='replication_password', MASTER_LOG_FILE='$master_file', MASTER_LOG_POS=$master_pos;"
  mysql -h 192.168.3.100 -u root -p -e "START SLAVE;"
  echo "  ✓ Peshawar is now slave of Karachi"
  
  # Step 3: Promote PostgreSQL replica
  echo "Step 3: Promoting Karachi PostgreSQL replica to primary..."
  ssh postgres@192.168.2.200 "sudo -u postgres psql -d university_analytics -c \"SELECT pg_promote();\""
  echo "  ✓ Karachi PostgreSQL is now PRIMARY"
  
  # Step 4: Reconfigure Peshawar as PostgreSQL slave
  echo "Step 4: Configuring Peshawar as PostgreSQL slave of Karachi..."
  # (use recovery script from above, adjust primary IP)
  echo "  ✓ Peshawar PostgreSQL configured as replica"
  
  # Step 5: Update DNS/Load Balancer
  echo ""
  echo "Step 5: Update DNS and Load Balancer Configuration"
  echo "  ⚠ MANUAL STEP: Update load balancer to:"
  echo "    - Primary: 192.168.2.10 (Karachi)"
  echo "    - Secondary: 192.168.3.10 (Peshawar)"
  echo "    - Remove: 192.168.1.10 (Islamabad - DOWN)"
  echo ""
  echo "  Update .env:"
  echo "    MYSQL_MASTER_HOST=192.168.2.100"
  echo "    PG_MASTER_HOST=192.168.2.200"
  echo ""
  
  echo "Failover complete! System is now running on Karachi + Peshawar"
  
else
  echo "Primary Campus is healthy. No failover needed."
fi
```

## Health Check Monitoring

```bash
#!/bin/bash
# distributed/health-check-monitor.sh
# Run on monitoring server, checks all services every 5 minutes

LOG_FILE="/var/log/distributed-health.log"
ALERT_EMAIL="admin@university.edu"

check_health() {
  echo "[$(date)] Running health checks..." >> $LOG_FILE
  
  # MySQL checks
  echo "  Checking MySQL..." >> $LOG_FILE
  for host in "192.168.1.100" "192.168.2.100" "192.168.3.100"; do
    if ! mysql -h $host -u root -p -e "SELECT 1" > /dev/null 2>&1; then
      echo "    ERROR: MySQL on $host is DOWN" >> $LOG_FILE
      send_alert "MySQL on $host is DOWN"
    fi
  done
  
  # Redis checks
  echo "  Checking Redis Cluster..." >> $LOG_FILE
  if ! redis-cli -h 192.168.1.50 cluster info | grep -q "cluster_state:ok"; then
    echo "    ERROR: Redis Cluster is NOT OK" >> $LOG_FILE
    send_alert "Redis Cluster is NOT OK"
  fi
  
  # PostgreSQL checks
  echo "  Checking PostgreSQL..." >> $LOG_FILE
  for host in "192.168.1.200" "192.168.2.200" "192.168.3.200"; do
    if ! sudo -u postgres psql -h $host -c "SELECT 1" > /dev/null 2>&1; then
      echo "    ERROR: PostgreSQL on $host is DOWN" >> $LOG_FILE
      send_alert "PostgreSQL on $host is DOWN"
    fi
  done
  
  # Application checks
  echo "  Checking application..." >> $LOG_FILE
  if ! curl -s http://192.168.2.10:3000/health | grep -q "ok"; then
    echo "    ERROR: Application health check failed" >> $LOG_FILE
    send_alert "Application is DOWN"
  fi
}

send_alert() {
  local message=$1
  echo "Sending alert: $message"
  echo "$message" | mail -s "⚠️ ALERT: Distributed System Failure" $ALERT_EMAIL
}

# Run health checks every 5 minutes
while true; do
  check_health
  sleep 300
done
```

## Key Takeaways

- **MySQL:** Manual promotion of slave to master required
- **Redis:** Automatic failover; manual recovery if needed
- **PostgreSQL:** Manual promotion of replica to primary
- **DNS/LB:** Update pointing to secondary campus on primary failure
- **Monitoring:** Run health check script to detect failures early
- **Recovery:** Use recovery scripts to restore failed nodes
- **Documentation:** Keep .env configs synced across all servers
