-- Database setup script for University Management System
-- Run this script to initialize the database with schema and stored procedures

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS university_management_system;
USE university_management_system;

-- Import schema
SOURCE /path/to/mysql/schema.sql;

-- Import stored procedures
SOURCE /path/to/mysql/stored-procedures.sql;

-- Import triggers
SOURCE /path/to/mysql/triggers.sql;

-- Create replication user (run on master)
-- Uncomment and adjust for your setup
-- CREATE USER 'replication_user'@'%' IDENTIFIED BY 'your_password';
-- GRANT REPLICATION SLAVE ON *.* TO 'replication_user'@'%';

-- Enable binary logging (MySQL configuration)
-- Set in my.cnf:
-- [mysqld]
-- server-id = 1
-- log_bin = mysql-bin
-- binlog_do_db = university_management_system

-- Setup slave replication (run on slave)
-- CHANGE MASTER TO
-- MASTER_HOST='master_host',
-- MASTER_USER='replication_user',
-- MASTER_PASSWORD='your_password',
-- MASTER_LOG_FILE='mysql-bin.000001',
-- MASTER_LOG_POS=154;
-- START SLAVE;

-- Verify replication status
-- SHOW SLAVE STATUS\G;
