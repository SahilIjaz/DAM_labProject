#!/bin/bash

# University Management System - Database Backup Script
# Creates timestamped backups of MySQL and PostgreSQL databases

BACKUP_DIR="/var/backups/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$BACKUP_DIR/backup_$TIMESTAMP.log"

# MySQL Configuration
MYSQL_HOST="localhost"
MYSQL_USER="backup_user"
MYSQL_PASSWORD="backup_password"
MYSQL_DB="university_management_system"

# PostgreSQL Configuration
PG_HOST="localhost"
PG_USER="backup_user"
PG_DB="university_analytics"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting backup at $(date)" > $LOG_FILE

# MySQL Backup
echo "Backing up MySQL database..." >> $LOG_FILE
MYSQL_BACKUP="$BACKUP_DIR/mysql_$TIMESTAMP.sql.gz"
mysqldump -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD \
  --single-transaction --quick --lock-tables=false \
  $MYSQL_DB | gzip > $MYSQL_BACKUP

if [ $? -eq 0 ]; then
  MYSQL_SIZE=$(du -h $MYSQL_BACKUP | awk '{print $1}')
  echo "✓ MySQL backup completed: $MYSQL_BACKUP ($MYSQL_SIZE)" >> $LOG_FILE
else
  echo "✗ MySQL backup failed" >> $LOG_FILE
fi

# PostgreSQL Backup
echo "Backing up PostgreSQL database..." >> $LOG_FILE
PG_BACKUP="$BACKUP_DIR/postgresql_$TIMESTAMP.sql.gz"
pg_dump -h $PG_HOST -U $PG_USER $PG_DB | gzip > $PG_BACKUP

if [ $? -eq 0 ]; then
  PG_SIZE=$(du -h $PG_BACKUP | awk '{print $1}')
  echo "✓ PostgreSQL backup completed: $PG_BACKUP ($PG_SIZE)" >> $LOG_FILE
else
  echo "✗ PostgreSQL backup failed" >> $LOG_FILE
fi

# Clean up old backups (keep last 30 days)
echo "Cleaning up old backups..." >> $LOG_FILE
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
echo "✓ Old backups cleaned up" >> $LOG_FILE

# Verify backups
echo "Verifying backups..." >> $LOG_FILE
if [ -f $MYSQL_BACKUP ] && [ -f $PG_BACKUP ]; then
  echo "✓ All backups verified successfully" >> $LOG_FILE
else
  echo "✗ Backup verification failed" >> $LOG_FILE
fi

echo "Backup completed at $(date)" >> $LOG_FILE

# Optional: Send backup notification
# echo "Backup completed. Check $LOG_FILE for details" | mail -s "Database Backup Report" admin@university.edu

cat $LOG_FILE
