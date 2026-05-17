#!/bin/bash

# University Management System - MySQL Replication Setup Script
# This script sets up MySQL master-slave replication for the system

# Configuration
MASTER_HOST="192.168.1.100"
MASTER_USER="replication_user"
MASTER_PASSWORD="secure_password"
MASTER_PORT="3306"

SLAVE_1_HOST="192.168.1.101"
SLAVE_2_HOST="192.168.1.102"

DB_NAME="university_management_system"
BACKUP_DIR="/var/backups/mysql"

echo "================================"
echo "MySQL Replication Setup Script"
echo "================================"

# Step 1: Backup master database
echo "Step 1: Backing up master database..."
mysqldump -h $MASTER_HOST -u $MASTER_USER -p$MASTER_PASSWORD \
  --single-transaction --master-data=2 \
  $DB_NAME > $BACKUP_DIR/master_backup.sql

if [ $? -eq 0 ]; then
  echo "✓ Backup completed successfully"
else
  echo "✗ Backup failed"
  exit 1
fi

# Step 2: Extract binary log position
echo "Step 2: Extracting binary log position..."
BINLOG_FILE=$(grep "CHANGE MASTER TO" $BACKUP_DIR/master_backup.sql | grep -oP "MASTER_LOG_FILE='\K[^']+")
BINLOG_POS=$(grep "CHANGE MASTER TO" $BACKUP_DIR/master_backup.sql | grep -oP "MASTER_LOG_POS=\K[0-9]+")

echo "Binary Log File: $BINLOG_FILE"
echo "Binary Log Position: $BINLOG_POS"

# Step 3: Create replication user on master
echo "Step 3: Creating replication user on master..."
mysql -h $MASTER_HOST -u $MASTER_USER -p$MASTER_PASSWORD << EOF
CREATE USER IF NOT EXISTS 'replication_user'@'%' IDENTIFIED BY '$MASTER_PASSWORD';
GRANT REPLICATION SLAVE ON *.* TO 'replication_user'@'%';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
  echo "✓ Replication user created"
else
  echo "✗ Failed to create replication user"
  exit 1
fi

# Step 4: Restore backup on slaves
echo "Step 4: Restoring backup on slaves..."
for SLAVE_HOST in $SLAVE_1_HOST $SLAVE_2_HOST; do
  echo "Restoring on $SLAVE_HOST..."
  mysql -h $SLAVE_HOST -u root -p << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME;
EOF

  mysql -h $SLAVE_HOST -u root -p $DB_NAME < $BACKUP_DIR/master_backup.sql

  if [ $? -eq 0 ]; then
    echo "✓ Restore completed on $SLAVE_HOST"
  else
    echo "✗ Restore failed on $SLAVE_HOST"
  fi
done

# Step 5: Configure slave replication
echo "Step 5: Configuring slave replication..."
for SLAVE_HOST in $SLAVE_1_HOST $SLAVE_2_HOST; do
  echo "Configuring $SLAVE_HOST..."
  mysql -h $SLAVE_HOST -u root -p << EOF
CHANGE MASTER TO
  MASTER_HOST='$MASTER_HOST',
  MASTER_USER='$MASTER_USER',
  MASTER_PASSWORD='$MASTER_PASSWORD',
  MASTER_LOG_FILE='$BINLOG_FILE',
  MASTER_LOG_POS=$BINLOG_POS,
  MASTER_PORT=$MASTER_PORT;

START SLAVE;

SHOW SLAVE STATUS\G
EOF
done

echo ""
echo "================================"
echo "Replication setup completed!"
echo "================================"
echo ""
echo "Verify replication status on slaves:"
echo "mysql -h <SLAVE_HOST> -u root -p -e 'SHOW SLAVE STATUS\G'"
