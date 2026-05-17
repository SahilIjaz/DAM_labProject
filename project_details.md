# Database Administration & Management - Enterprise Implementation Guide
## Complete Full-Stack Project: University Management System (Distributed & Decentralized)

---

## 📋 Project Overview

**Project Name:** Distributed University Management System (DUMS)  
**Framework:** Distributed & Decentralized Database Architecture (DDAF)  
**Technology Stack:**
- **Backend Database (Primary):** MySQL 8.0+ with replication
- **Backend Database (Secondary):** PostgreSQL 14+ with JSON/NoSQL capabilities
- **Frontend:** Next.js 14+ with TypeScript
- **API Layer:** Node.js + Express
- **Authentication:** JWT + Role-Based Access Control
- **Cache:** Redis
- **File Storage:** Cloudinary / Cloud Storage

---

## 🎯 Real-World Scenario: University Management System

### Business Context
A large university with multiple campuses across different cities needs to manage:
- Student enrollment and academic records
- Faculty information and course assignments
- Course schedules and classroom allocations
- Exam results and performance tracking
- Department management and resource allocation
- User authentication with role-based access
- Data backup, recovery, and disaster management
- Advanced logging, analytics, and audit trails

### System Requirements
The system must handle:
- **Multiple distributed databases** across different campuses (Lahore, Islamabad, Karachi)
- **High availability** with failover mechanisms
- **Data consistency** and synchronization
- **Security** with role-based permissions
- **Performance optimization** for thousands of concurrent users
- **Automated backups** and disaster recovery
- **Audit trails** for compliance
- **Complex analytics** and reporting

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Next.js)                    │
│        (Web & Mobile Responsive Dashboard)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway (Node.js/Express)               │
│              (Authentication, Authorization)                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│               Business Logic Layer (Services)                │
│      (Transactions, Procedures, Validations)                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ Primary │  Linked  │Secondary│  Linked  │Tertiary │
   │  MySQL  │◄────────►│ MySQL   │◄────────►│ MySQL   │
   │Lahore   │ Servers  │Islamabad│ Servers  │Karachi  │
   │(Master) │          │(Slave1) │          │(Slave2) │
   └─────────┘          └─────────┘          └─────────┘
        ↓                     ↓                     ↓
   (Active-Active Replication, Read Replicas)
        │
        ├─────────────────────┬─────────────────────┐
        ↓                     ↓                     ↓
   ┌──────────┐          ┌──────────┐          ┌─────────┐
   │PostgreSQL│          │  Redis   │          │Backup   │
   │(Logs,    │          │(Cache)   │          │Storage  │
   │Analytics)│          │          │          │         │
   └──────────┘          └──────────┘          └─────────┘
```

---

## 📊 Database Schema Design

### 1. Primary Database: MySQL (Main Campus - Lahore)

#### Core Tables for Transactional Data

```
USERS
├── user_id (INT, Primary Key, AUTO_INCREMENT)
├── username (VARCHAR 255, UNIQUE)
├── email (VARCHAR 255, UNIQUE)
├── password_hash (VARCHAR 255)
├── first_name (VARCHAR 100)
├── last_name (VARCHAR 100)
├── role_id (INT, Foreign Key → ROLES)
├── department_id (INT, Foreign Key → DEPARTMENTS)
├── campus_id (INT, Foreign Key → CAMPUSES)
├── status (ENUM: active, inactive, suspended)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
├── last_login (DATETIME)
└── INDEX: idx_email, idx_role_id, idx_department_id

ROLES
├── role_id (INT, Primary Key)
├── role_name (VARCHAR 100, UNIQUE)
├── description (TEXT)
└── created_at (TIMESTAMP)

PERMISSIONS
├── permission_id (INT, Primary Key)
├── permission_name (VARCHAR 100, UNIQUE)
├── resource (VARCHAR 100)
├── action (VARCHAR 50)
└── description (TEXT)

ROLE_PERMISSIONS
├── role_id (INT, Foreign Key → ROLES)
├── permission_id (INT, Foreign Key → PERMISSIONS)
└── PRIMARY KEY: (role_id, permission_id)

DEPARTMENTS
├── department_id (INT, Primary Key)
├── dept_name (VARCHAR 150, UNIQUE)
├── dept_code (VARCHAR 10, UNIQUE)
├── campus_id (INT, Foreign Key → CAMPUSES)
├── head_of_dept (INT, Foreign Key → USERS)
├── budget (DECIMAL 10,2)
├── created_at (TIMESTAMP)
└── INDEX: idx_campus_id

CAMPUSES
├── campus_id (INT, Primary Key)
├── campus_name (VARCHAR 150, UNIQUE)
├── location (VARCHAR 255)
├── city (VARCHAR 100)
├── country (VARCHAR 100)
├── server_ip (VARCHAR 15)
├── replication_type (ENUM: master, slave, distributed)
└── created_at (TIMESTAMP)

STUDENTS
├── student_id (INT, Primary Key, AUTO_INCREMENT)
├── enrollment_id (VARCHAR 50, UNIQUE) [Generated by SEQUENCE]
├── user_id (INT, Foreign Key → USERS)
├── department_id (INT, Foreign Key → DEPARTMENTS)
├── enrollment_date (DATE)
├── current_semester (INT)
├── gpa (DECIMAL 3,2)
├── status (ENUM: active, graduated, suspended, dropped)
├── created_at (TIMESTAMP)
└── INDEX: idx_user_id, idx_enrollment_id, idx_department_id

FACULTY
├── faculty_id (INT, Primary Key, AUTO_INCREMENT)
├── faculty_code (VARCHAR 50, UNIQUE) [Generated by SEQUENCE]
├── user_id (INT, Foreign Key → USERS)
├── department_id (INT, Foreign Key → DEPARTMENTS)
├── qualification (VARCHAR 255)
├── specialization (VARCHAR 255)
├── hiring_date (DATE)
├── status (ENUM: active, on-leave, inactive)
└── created_at (TIMESTAMP)

COURSES
├── course_id (INT, Primary Key)
├── course_code (VARCHAR 20, UNIQUE)
├── course_name (VARCHAR 150)
├── department_id (INT, Foreign Key → DEPARTMENTS)
├── faculty_id (INT, Foreign Key → FACULTY)
├── credit_hours (INT)
├── capacity (INT)
├── semester (INT)
├── syllabus (LONGTEXT)
├── created_at (TIMESTAMP)
└── INDEX: idx_department_id, idx_faculty_id

ENROLLMENTS
├── enrollment_id (INT, Primary Key)
├── student_id (INT, Foreign Key → STUDENTS)
├── course_id (INT, Foreign Key → COURSES)
├── semester (INT)
├── enrollment_date (DATE)
├── status (ENUM: enrolled, dropped, completed)
├── grade (VARCHAR 2)
└── PRIMARY KEY: (student_id, course_id, semester)

EXAM_RESULTS
├── result_id (INT, Primary Key)
├── enrollment_id (INT, Foreign Key → ENROLLMENTS)
├── exam_type (ENUM: midterm, final, quiz)
├── marks_obtained (INT)
├── total_marks (INT)
├── percentage (DECIMAL 5,2)
├── exam_date (DATE)
├── created_at (TIMESTAMP)
└── INDEX: idx_enrollment_id
```

#### Normalization: Third Normal Form (3NF)
- ✅ Atomic values (1NF)
- ✅ No partial dependencies (2NF)
- ✅ No transitive dependencies (3NF)
- ✅ Primary/Foreign keys properly defined
- ✅ Referential integrity constraints

---

### 2. Secondary Database: PostgreSQL (Analytics, Logs, Audit Trails)

#### PostgreSQL Advantages for Analytics:
- **Advanced JSON/JSONB support** for flexible data structures
- **Full-text search** capabilities
- **Window functions** for analytics
- **Array and composite data types**
- **LISTEN/NOTIFY** for event-driven architecture
- **Better query optimization** for complex analytics
- **Native UUID support** for distributed systems
- **Range types** for time-based partitioning

#### PostgreSQL Tables for Logging & Analytics

```
-- Audit and Compliance Tables
audit_logs
├── log_id (BIGSERIAL, Primary Key)
├── user_id (INTEGER, Foreign Key)
├── action (VARCHAR 255)
├── table_name (VARCHAR 100)
├── record_id (INTEGER)
├── old_value (JSONB)
├── new_value (JSONB)
├── ip_address (INET)
├── user_agent (TEXT)
├── timestamp (TIMESTAMPTZ DEFAULT NOW())
├── duration_ms (INTEGER)
└── INDEX: idx_user_id, idx_timestamp, idx_action

-- System and Performance Logs
system_logs
├── log_id (BIGSERIAL, Primary Key)
├── log_level (VARCHAR 20) -- INFO, WARNING, ERROR
├── component (VARCHAR 100) -- database, api, service
├── message (TEXT)
├── error_details (JSONB)
├── context_data (JSONB)
├── timestamp (TIMESTAMPTZ DEFAULT NOW())
└── INDEX: idx_timestamp, idx_component, idx_log_level

-- API Request Logs
api_request_logs
├── request_id (UUID, Primary Key DEFAULT gen_random_uuid())
├── user_id (INTEGER)
├── endpoint (VARCHAR 255)
├── method (VARCHAR 10) -- GET, POST, PUT, DELETE
├── status_code (INTEGER)
├── response_time_ms (INTEGER)
├── request_body (JSONB)
├── response_body (JSONB)
├── error_message (TEXT)
├── ip_address (INET)
├── user_agent (TEXT)
├── timestamp (TIMESTAMPTZ DEFAULT NOW())
└── INDEX: idx_user_id, idx_endpoint, idx_timestamp, idx_status_code

-- Database Performance Metrics
db_performance_metrics
├── metric_id (BIGSERIAL, Primary Key)
├── database_name (VARCHAR 100)
├── table_name (VARCHAR 100)
├── metric_type (VARCHAR 50) -- query_time, row_count, index_usage
├── metric_value (NUMERIC)
├── recorded_at (TIMESTAMPTZ DEFAULT NOW())
└── INDEX: idx_table_name, idx_recorded_at

-- Backup and Restore Logs
backup_logs
├── backup_id (BIGSERIAL, Primary Key)
├── backup_type (VARCHAR 20) -- full, differential, incremental
├── source_database (VARCHAR 100)
├── backup_file_name (VARCHAR 255)
├── backup_size_bytes (BIGINT)
├── backup_path (TEXT)
├── backup_start (TIMESTAMPTZ)
├── backup_end (TIMESTAMPTZ)
├── duration_seconds (INTEGER)
├── status (VARCHAR 20) -- success, failed, pending
├── error_message (TEXT)
├── verified (BOOLEAN DEFAULT FALSE)
├── restore_test_date (TIMESTAMPTZ)
└── INDEX: idx_backup_date, idx_status, idx_source_database

-- User Activity Analytics
user_activity_analytics
├── activity_id (BIGSERIAL, Primary Key)
├── user_id (INTEGER)
├── action_type (VARCHAR 50) -- login, logout, view, edit, create
├── resource_type (VARCHAR 50) -- student, course, exam
├── resource_id (INTEGER)
├── campus_id (INTEGER)
├── timestamp (TIMESTAMPTZ DEFAULT NOW())
├── activity_metadata (JSONB) -- Extra contextual data
└── INDEX: idx_user_id, idx_timestamp, idx_action_type

-- Replication Status Monitoring
replication_status
├── status_id (BIGSERIAL, Primary Key)
├── primary_server (VARCHAR 100)
├── replica_server (VARCHAR 100)
├── last_sync_time (TIMESTAMPTZ)
├── replication_lag_ms (INTEGER)
├── binlog_position (VARCHAR 255)
├── sync_status (VARCHAR 50) -- in_sync, lagging, error
├── error_message (TEXT)
├── checked_at (TIMESTAMPTZ DEFAULT NOW())
└── INDEX: idx_replica_server, idx_checked_at

-- Data Quality Metrics
data_quality_metrics
├── metric_id (BIGSERIAL, Primary Key)
├── table_name (VARCHAR 100)
├── total_records (INTEGER)
├── duplicate_records (INTEGER)
├── null_values (INTEGER)
├── integrity_violations (INTEGER)
├── last_checked (TIMESTAMPTZ DEFAULT NOW())
├── quality_score (NUMERIC)
└── INDEX: idx_table_name, idx_last_checked

-- System Events and Alerts
system_events
├── event_id (BIGSERIAL, Primary Key)
├── event_type (VARCHAR 100)
├── severity (VARCHAR 20) -- critical, warning, info
├── message (TEXT)
├── event_metadata (JSONB)
├── created_at (TIMESTAMPTZ DEFAULT NOW())
├── resolved_at (TIMESTAMPTZ)
├── resolved_by (INTEGER)
└── INDEX: idx_event_type, idx_severity, idx_created_at

-- Disaster Recovery Tracking
disaster_recovery_events
├── dr_event_id (BIGSERIAL, Primary Key)
├── event_type (VARCHAR 50) -- failover, restore, sync
├── source_campus (VARCHAR 100)
├── target_campus (VARCHAR 100)
├── initiated_at (TIMESTAMPTZ DEFAULT NOW())
├── completed_at (TIMESTAMPTZ)
├── status (VARCHAR 50) -- initiated, in_progress, completed, failed
├── error_details (JSONB)
├── recovery_time_seconds (INTEGER)
├── data_loss_records (INTEGER)
└── INDEX: idx_initiated_at, idx_status

-- Student Academic Analytics
student_performance_analytics
├── analytics_id (BIGSERIAL, Primary Key)
├── student_id (INTEGER)
├── semester (INTEGER)
├── total_courses (INTEGER)
├── average_percentage (NUMERIC)
├── highest_score (NUMERIC)
├── lowest_score (NUMERIC)
├── passing_courses (INTEGER)
├── failing_courses (INTEGER)
├── trend_analysis (JSONB) -- Historical trends
├── computed_at (TIMESTAMPTZ DEFAULT NOW())
└── INDEX: idx_student_id, idx_semester

-- Course Performance Analytics
course_performance_analytics
├── analytics_id (BIGSERIAL, Primary Key)
├── course_id (INTEGER)
├── semester (INTEGER)
├── total_enrolled (INTEGER)
├── avg_score (NUMERIC)
├── pass_rate (NUMERIC)
├── fail_rate (NUMERIC)
├── student_feedback (JSONB)
├── difficulty_level (VARCHAR 20)
├── computed_at (TIMESTAMPTZ DEFAULT NOW())
└── INDEX: idx_course_id, idx_semester
```

#### PostgreSQL Features Utilized:
- **JSONB columns** for flexible semi-structured data
- **TIMESTAMPTZ** for precise timezone-aware timestamps
- **INET** data type for IP addresses
- **UUID** for distributed system identifiers
- **BIGSERIAL** for high-volume logging
- **Window functions** for analytics calculations
- **Partitioning** for large tables (time-based or range-based)

---

## 🔐 Distributed System Configuration

### 1. MySQL Replication Setup (Primary + Replicas)

```sql
-- Master Server Configuration (Lahore)
-- Server: lahore-mysql.campus.db
-- Port: 3306
-- Database: university_main

-- Enable Binary Logging
[mysqld]
server-id = 1
log_bin = /var/log/mysql/mysql-bin.log
binlog_format = ROW
expire_logs_days = 10

-- Create Replication User
CREATE USER 'replication'@'%.campus.db' IDENTIFIED BY 'repl_password_123';
GRANT REPLICATION SLAVE ON *.* TO 'replication'@'%.campus.db';

-- View Master Status
SHOW MASTER STATUS;
```

### 2. Slave Server Configuration (Islamabad)

```sql
-- Slave 1 Configuration
[mysqld]
server-id = 2
log_bin = /var/log/mysql/mysql-bin.log
relay_log = /var/log/mysql/mysql-relay-bin
relay_log_index = /var/log/mysql/mysql-relay-bin.index
master_user = 'replication'
master_password = 'repl_password_123'
master_host = 'lahore-mysql.campus.db'
master_port = 3306

-- Configure as Slave
CHANGE MASTER TO
  MASTER_HOST = 'lahore-mysql.campus.db',
  MASTER_USER = 'replication',
  MASTER_PASSWORD = 'repl_password_123',
  MASTER_LOG_FILE = 'mysql-bin.000001',
  MASTER_LOG_POS = 154;

START SLAVE;
SHOW SLAVE STATUS;
```

### 3. PostgreSQL Replication Setup (Streaming Replication)

```sql
-- Primary Server Configuration (PostgreSQL)
-- postgresql.conf
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1GB
hot_standby = on

-- Create Replication Slot
SELECT * FROM pg_create_physical_replication_slot('replica_slot');

-- Replication User
CREATE USER replication_user WITH REPLICATION ENCRYPTED PASSWORD 'postgres_repl_pwd';

-- pg_hba.conf entry
host    replication     replication_user    192.168.1.0/24    md5
```

### 4. PostgreSQL Standby Configuration

```sql
-- Standby Server Setup
-- recovery.conf
standby_mode = 'on'
primary_conninfo = 'host=primary-pg.campus.db port=5432 user=replication_user password=postgres_repl_pwd'
recovery_target_timeline = 'latest'

-- Start replication
pg_ctl start
```

### 5. Linked Servers Concept (Cross-Database Queries)

```sql
-- MySQL: Query PostgreSQL via Foreign Data Wrapper
-- First, install mysql_fdw extension on PostgreSQL

CREATE SERVER postgresql_server 
  FOREIGN DATA WRAPPER mysql_fdw 
  OPTIONS (host 'postgresql-server.campus.db', port '5432', db_name 'university_analytics');

CREATE USER MAPPING FOR current_user SERVER postgresql_server 
  OPTIONS (username 'replication_user', password 'postgres_repl_pwd');

-- Create foreign tables to access PostgreSQL data from MySQL
CREATE FOREIGN TABLE ft_audit_logs (
  log_id BIGINT,
  user_id INT,
  action VARCHAR(255),
  timestamp TIMESTAMP
) SERVER postgresql_server OPTIONS (table_name 'audit_logs');

-- Query cross-database
SELECT * FROM ft_audit_logs WHERE timestamp > DATE_SUB(NOW(), INTERVAL 1 DAY);
```

---

## 🛡️ Security & Authentication Implementation

### 1. User Authentication & Roles

```sql
-- Role Hierarchy
- Super Admin (Full system access)
  └─ Database Administrator
  └─ System Administrator

- Faculty (Course management)
  └─ Department Head
  └─ Instructor

- Student (Limited access)
  └─ View results, Enroll courses

- Support Staff (Administrative tasks)
  └─ Support Personnel
  └─ Data Entry Operator

- Guest (Read-only)
  └─ Public Information Viewer
```

### 2. Permission Matrix

| Role | Users | Students | Courses | Exam Results | Reports | Admin |
|------|-------|----------|---------|--------------|---------|-------|
| Super Admin | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD |
| DBA | R | R | R | R | R | CRUD |
| Faculty | R | R | CRUD | CRUD | R | - |
| Student | - | R* | R | R* | R | - |
| Support | R | C,U | R | R | R | - |
| Guest | - | - | R | - | - | - |

*Limited to own records

### 3. Access Control Lists (ACL)

```sql
-- MySQL Access Control
GRANT SELECT, INSERT, UPDATE ON university_main.students TO 'faculty'@'%.campus.db';
GRANT SELECT ON university_main.exam_results TO 'student'@'%.campus.db';
GRANT ALL PRIVILEGES ON university_main.* TO 'admin'@'%.campus.db' WITH GRANT OPTION;
REVOKE DELETE ON university_main.students FROM 'support'@'%.campus.db';

-- PostgreSQL Access Control
GRANT CONNECT ON DATABASE university_analytics TO replication_user;
GRANT USAGE ON SCHEMA public TO replication_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replication_user;
GRANT INSERT, UPDATE ON audit_logs, system_logs TO api_user;
ALTER DEFAULT PRIVILEGES FOR USER postgres IN SCHEMA public GRANT SELECT ON TABLES TO analyst_user;
```

---

## 💾 Core Database Implementation

### 1. SQL Sequences (Student & Faculty ID Generation)

```sql
-- MySQL: Student ID Sequence: BULC_IT_F21_0001
CREATE TABLE id_sequences (
    sequence_name VARCHAR(100) PRIMARY KEY,
    current_value INT DEFAULT 0,
    prefix VARCHAR(50),
    suffix VARCHAR(50),
    increment INT DEFAULT 1
);

INSERT INTO id_sequences VALUES 
('student_seq', 0, 'BULC_', '', 1),
('faculty_seq', 0, 'FAC_', '', 1);

-- Procedure to generate sequential IDs
DELIMITER $$
CREATE PROCEDURE sp_generate_enrollment_id(
    OUT p_enrollment_id VARCHAR(50)
)
BEGIN
    DECLARE v_current_value INT;
    
    START TRANSACTION;
    
    SELECT current_value INTO v_current_value 
    FROM id_sequences 
    WHERE sequence_name = 'student_seq' 
    FOR UPDATE;
    
    SET v_current_value = v_current_value + 1;
    
    UPDATE id_sequences 
    SET current_value = v_current_value 
    WHERE sequence_name = 'student_seq';
    
    SET p_enrollment_id = CONCAT('BULC_IT_F21_', LPAD(v_current_value, 4, '0'));
    
    COMMIT;
END$$
DELIMITER ;

-- PostgreSQL: Native Sequence Support
CREATE SEQUENCE student_id_seq START 1 INCREMENT 1;
CREATE SEQUENCE faculty_id_seq START 1 INCREMENT 1;

-- Function to generate enrollment ID
CREATE OR REPLACE FUNCTION fn_generate_enrollment_id()
RETURNS VARCHAR AS $$
DECLARE
    v_sequence_num INT;
    v_enrollment_id VARCHAR(50);
BEGIN
    v_sequence_num := nextval('student_id_seq');
    v_enrollment_id := 'BULC_IT_F21_' || LPAD(v_sequence_num::TEXT, 4, '0');
    RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql;
```

### 2. Stored Procedures Implementation (MySQL)

#### A. User Management Procedures

```sql
-- SP1: Create New User with Role Assignment
DELIMITER $$
CREATE PROCEDURE sp_create_user(
    IN p_username VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_role_id INT,
    IN p_department_id INT,
    IN p_campus_id INT,
    OUT p_user_id INT,
    OUT p_error_message VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 @p1 = MESSAGE_TEXT;
        SET p_error_message = CONCAT('Error creating user: ', @p1);
        SET p_user_id = -1;
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        SET p_error_message = 'Email already exists';
        SET p_user_id = -1;
        ROLLBACK;
    ELSE
        INSERT INTO users (username, email, password_hash, first_name, last_name, 
                          role_id, department_id, campus_id, status, created_at)
        VALUES (p_username, p_email, p_password_hash, p_first_name, p_last_name, 
                p_role_id, p_department_id, p_campus_id, 'active', NOW());
        
        SET p_user_id = LAST_INSERT_ID();
        SET p_error_message = 'User created successfully';
        
        -- Log to PostgreSQL
        -- INSERT INTO postgresql_server.audit_logs (user_id, action, table_name, record_id, new_value)
        
        COMMIT;
    END IF;
END$$
DELIMITER ;
```

#### B. Student Enrollment Procedure

```sql
-- SP2: Enroll Student in Course
DELIMITER $$
CREATE PROCEDURE sp_enroll_student(
    IN p_student_id INT,
    IN p_course_id INT,
    IN p_semester INT,
    OUT p_enrollment_id INT,
    OUT p_status VARCHAR(100)
)
BEGIN
    DECLARE v_course_capacity INT;
    DECLARE v_enrolled_count INT;
    DECLARE v_student_exists BOOLEAN;
    
    START TRANSACTION;
    
    -- Verify student exists
    SELECT COUNT(*) INTO v_student_exists FROM students WHERE student_id = p_student_id;
    
    IF v_student_exists = 0 THEN
        ROLLBACK;
        SET p_status = 'Student not found';
        SET p_enrollment_id = -1;
    ELSE
        -- Check course capacity
        SELECT capacity INTO v_course_capacity FROM courses WHERE course_id = p_course_id;
        
        SELECT COUNT(*) INTO v_enrolled_count 
        FROM enrollments 
        WHERE course_id = p_course_id AND semester = p_semester AND status = 'enrolled';
        
        IF v_enrolled_count >= v_course_capacity THEN
            ROLLBACK;
            SET p_status = 'Course is full';
            SET p_enrollment_id = -1;
        ELSE
            INSERT INTO enrollments (student_id, course_id, semester, enrollment_date, status)
            VALUES (p_student_id, p_course_id, p_semester, CURDATE(), 'enrolled');
            
            SET p_enrollment_id = LAST_INSERT_ID();
            SET p_status = 'Enrollment successful';
            
            COMMIT;
        END IF;
    END IF;
END$$
DELIMITER ;
```

#### C. Data Validation Procedure

```sql
-- SP3: Validate Student Password
DELIMITER $$
CREATE PROCEDURE sp_validate_credentials(
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    OUT p_user_id INT,
    OUT p_role_id INT,
    OUT p_is_valid BOOLEAN
)
BEGIN
    DECLARE v_password_hash VARCHAR(255);
    DECLARE v_user_exists INT;
    
    SELECT COUNT(*) INTO v_user_exists FROM users 
    WHERE email = p_email AND status = 'active';
    
    IF v_user_exists = 0 THEN
        SET p_is_valid = FALSE;
        SET p_user_id = -1;
        SET p_role_id = -1;
    ELSE
        SELECT user_id, role_id, password_hash INTO p_user_id, p_role_id, v_password_hash
        FROM users
        WHERE email = p_email AND status = 'active';
        
        SET p_is_valid = (v_password_hash = p_password_hash);
        
        IF p_is_valid THEN
            UPDATE users SET last_login = NOW() WHERE user_id = p_user_id;
        END IF;
    END IF;
END$$
DELIMITER ;
```

#### D. Transaction & Update Procedures

```sql
-- SP4: Update Exam Results with Transaction
DELIMITER $$
CREATE PROCEDURE sp_update_exam_result(
    IN p_enrollment_id INT,
    IN p_exam_type VARCHAR(50),
    IN p_marks_obtained INT,
    IN p_total_marks INT,
    OUT p_grade VARCHAR(2),
    OUT p_result_id INT
)
BEGIN
    DECLARE v_percentage DECIMAL(5,2);
    DECLARE v_student_id INT;
    
    START TRANSACTION;
    
    -- Calculate percentage
    SET v_percentage = (p_marks_obtained / p_total_marks) * 100;
    
    -- Determine grade
    CASE 
        WHEN v_percentage >= 90 THEN SET p_grade = 'A';
        WHEN v_percentage >= 80 THEN SET p_grade = 'B';
        WHEN v_percentage >= 70 THEN SET p_grade = 'C';
        WHEN v_percentage >= 60 THEN SET p_grade = 'D';
        ELSE SET p_grade = 'F';
    END CASE;
    
    INSERT INTO exam_results 
    (enrollment_id, exam_type, marks_obtained, total_marks, percentage, exam_date)
    VALUES (p_enrollment_id, p_exam_type, p_marks_obtained, p_total_marks, v_percentage, CURDATE());
    
    SET p_result_id = LAST_INSERT_ID();
    
    -- Get student ID
    SELECT student_id INTO v_student_id FROM enrollments WHERE enrollment_id = p_enrollment_id;
    
    -- Update student GPA
    UPDATE students 
    SET gpa = (
        SELECT AVG(percentage) / 20 FROM exam_results 
        WHERE enrollment_id IN (
            SELECT enrollment_id FROM enrollments 
            WHERE student_id = v_student_id
        )
    )
    WHERE student_id = v_student_id;
    
    COMMIT;
END$$
DELIMITER ;
```

#### E. Delete with Cascade Procedure

```sql
-- SP5: Delete Student (with validation)
DELIMITER $$
CREATE PROCEDURE sp_delete_student(
    IN p_student_id INT,
    OUT p_delete_status VARCHAR(100)
)
BEGIN
    DECLARE v_enrollment_count INT;
    DECLARE v_user_id INT;
    
    START TRANSACTION;
    
    -- Get user_id first
    SELECT user_id INTO v_user_id FROM students WHERE student_id = p_student_id;
    
    -- Check if student has active enrollments
    SELECT COUNT(*) INTO v_enrollment_count 
    FROM enrollments 
    WHERE student_id = p_student_id AND status = 'enrolled';
    
    IF v_enrollment_count > 0 THEN
        ROLLBACK;
        SET p_delete_status = 'Cannot delete: Student has active enrollments';
    ELSE
        -- Delete from enrollments first (FK constraint)
        DELETE FROM enrollments WHERE student_id = p_student_id;
        
        -- Delete exam results
        DELETE FROM exam_results 
        WHERE enrollment_id NOT IN (SELECT enrollment_id FROM enrollments);
        
        -- Delete from students
        DELETE FROM students WHERE student_id = p_student_id;
        
        -- Delete from users
        DELETE FROM users WHERE user_id = v_user_id;
        
        SET p_delete_status = 'Student deleted successfully';
        COMMIT;
    END IF;
END$$
DELIMITER ;
```

### 3. PostgreSQL Functions (Advanced Analytics)

```sql
-- PG Function 1: Calculate Student Performance Score
CREATE OR REPLACE FUNCTION fn_calculate_student_score(p_student_id INT)
RETURNS NUMERIC AS $$
DECLARE
    v_avg_percentage NUMERIC;
    v_course_count INT;
    v_weighted_score NUMERIC;
BEGIN
    SELECT 
        AVG(percentage),
        COUNT(DISTINCT course_id)
    INTO 
        v_avg_percentage,
        v_course_count
    FROM exam_results er
    JOIN enrollments e ON er.enrollment_id = e.enrollment_id
    WHERE e.student_id = p_student_id;
    
    -- Weighted calculation
    v_weighted_score := (v_avg_percentage * 0.7) + (v_course_count * 2);
    
    RETURN v_weighted_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- PG Function 2: Analyze Course Effectiveness
CREATE OR REPLACE FUNCTION fn_analyze_course_effectiveness(p_course_id INT)
RETURNS TABLE (
    course_name VARCHAR,
    total_students INT,
    avg_score NUMERIC,
    pass_rate NUMERIC,
    effectiveness_rating VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.course_name,
        COUNT(DISTINCT e.student_id)::INT,
        AVG(er.percentage)::NUMERIC(5,2),
        (COUNT(CASE WHEN er.percentage >= 60 THEN 1 END)::NUMERIC / 
         COUNT(*)::NUMERIC * 100)::NUMERIC(5,2),
        CASE 
            WHEN AVG(er.percentage) >= 85 THEN 'Excellent'
            WHEN AVG(er.percentage) >= 75 THEN 'Good'
            WHEN AVG(er.percentage) >= 60 THEN 'Average'
            ELSE 'Below Average'
        END::VARCHAR
    FROM courses c
    LEFT JOIN enrollments e ON c.course_id = e.course_id
    LEFT JOIN exam_results er ON e.enrollment_id = er.enrollment_id
    WHERE c.course_id = p_course_id
    GROUP BY c.course_id, c.course_name;
END;
$$ LANGUAGE plpgsql;

-- PG Function 3: Generate Performance Report
CREATE OR REPLACE FUNCTION fn_generate_performance_report(p_semester INT)
RETURNS TABLE (
    student_enrollment_id VARCHAR,
    student_name VARCHAR,
    gpa NUMERIC,
    total_courses INT,
    avg_percentage NUMERIC,
    performance_status VARCHAR,
    report_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.enrollment_id,
        CONCAT(u.first_name, ' ', u.last_name),
        s.gpa,
        COUNT(DISTINCT e.course_id)::INT,
        AVG(er.percentage)::NUMERIC(5,2),
        CASE 
            WHEN s.gpa >= 3.7 THEN 'Excellent'
            WHEN s.gpa >= 3.3 THEN 'Very Good'
            WHEN s.gpa >= 2.7 THEN 'Good'
            WHEN s.gpa >= 2.0 THEN 'Satisfactory'
            ELSE 'Needs Improvement'
        END::VARCHAR,
        NOW()::TIMESTAMPTZ
    FROM students s
    JOIN users u ON s.user_id = u.user_id
    LEFT JOIN enrollments e ON s.student_id = e.student_id AND e.semester = p_semester
    LEFT JOIN exam_results er ON e.enrollment_id = er.enrollment_id
    GROUP BY s.student_id, s.enrollment_id, u.first_name, u.last_name, s.gpa
    ORDER BY s.gpa DESC;
END;
$$ LANGUAGE plpgsql;

-- PG Function 4: Detect Data Anomalies
CREATE OR REPLACE FUNCTION fn_detect_anomalies()
RETURNS TABLE (
    anomaly_type VARCHAR,
    description TEXT,
    affected_records INT,
    severity VARCHAR,
    detected_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Check for duplicate enrollments
    RETURN QUERY
    SELECT 
        'Duplicate Enrollment'::VARCHAR,
        'Student enrolled multiple times in same course'::TEXT,
        COUNT(*)::INT,
        'High'::VARCHAR,
        NOW()::TIMESTAMPTZ
    FROM (
        SELECT student_id, course_id, semester
        FROM enrollments
        WHERE status = 'enrolled'
        GROUP BY student_id, course_id, semester
        HAVING COUNT(*) > 1
    ) dup;
    
    -- Check for missing exam results
    RETURN QUERY
    SELECT 
        'Missing Exam Results'::VARCHAR,
        'Enrolled students without exam results'::TEXT,
        COUNT(*)::INT,
        'Medium'::VARCHAR,
        NOW()::TIMESTAMPTZ
    FROM enrollments e
    WHERE e.status = 'completed' 
      AND NOT EXISTS (
          SELECT 1 FROM exam_results WHERE enrollment_id = e.enrollment_id
      );
END;
$$ LANGUAGE plpgsql;
```

### 4. Triggers in MySQL

#### A. DDL Trigger: Table Modification Audit

```sql
-- TRG1: Audit Table Structure Changes
DELIMITER $$
CREATE TRIGGER trg_audit_table_changes
AFTER CREATE ON DATABASE
FOR EACH STATEMENT
BEGIN
    INSERT INTO mysql.event (definer, db, name, type, execute_at, interval_value, status)
    SELECT USER(), DATABASE(), OBJECT_NAME(), 1, NOW(), 0, 'ENABLED';
END$$
DELIMITER ;
```

#### B. DML Trigger: Insert Audit

```sql
-- TRG2: Audit Student Inserts with PostgreSQL Logging
DELIMITER $$
CREATE TRIGGER trg_student_insert
AFTER INSERT ON students FOR EACH ROW
BEGIN
    -- Log to MySQL audit table
    INSERT INTO audit_logs_temp 
    (user_id, action, table_name, record_id, new_value, timestamp)
    VALUES 
    (CURRENT_USER(), 'INSERT', 'students', NEW.student_id, 
     CONCAT('Enrollment ID: ', NEW.enrollment_id), NOW());
     
    -- Replicate to PostgreSQL via trigger
    -- Can be done via application code or CDC (Change Data Capture)
END$$
DELIMITER ;
```

#### C. DML Trigger: Update Audit

```sql
-- TRG3: Audit Exam Results Updates
DELIMITER $$
CREATE TRIGGER trg_exam_result_update
AFTER UPDATE ON exam_results FOR EACH ROW
BEGIN
    IF OLD.marks_obtained != NEW.marks_obtained OR OLD.percentage != NEW.percentage THEN
        INSERT INTO audit_logs_temp 
        (user_id, action, table_name, record_id, old_value, new_value, timestamp)
        VALUES 
        (CURRENT_USER(), 'UPDATE', 'exam_results', NEW.result_id,
         CONCAT('Marks: ', OLD.marks_obtained, ', Grade: ', 
                CASE WHEN OLD.percentage >= 80 THEN 'A' ELSE 'B' END),
         CONCAT('Marks: ', NEW.marks_obtained, ', Grade: ', 
                CASE WHEN NEW.percentage >= 80 THEN 'A' ELSE 'B' END),
         NOW());
    END IF;
END$$
DELIMITER ;
```

#### D. DML Trigger: Delete Audit

```sql
-- TRG4: Audit Course Deletions
DELIMITER $$
CREATE TRIGGER trg_course_delete
BEFORE DELETE ON courses FOR EACH ROW
BEGIN
    INSERT INTO audit_logs_temp 
    (user_id, action, table_name, record_id, old_value, timestamp)
    VALUES 
    (CURRENT_USER(), 'DELETE', 'courses', OLD.course_id,
     CONCAT('Course: ', OLD.course_name, ', Code: ', OLD.course_code),
     NOW());
END$$
DELIMITER ;
```

### 5. PostgreSQL Triggers

```sql
-- PG Trigger: Auto-update timestamp
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.timestamp := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();

-- PG Trigger: Validate data quality
CREATE OR REPLACE FUNCTION fn_validate_data_quality()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_records < 0 OR NEW.duplicate_records < 0 THEN
        RAISE EXCEPTION 'Invalid metric values';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_quality_metrics
BEFORE INSERT OR UPDATE ON data_quality_metrics
FOR EACH ROW
EXECUTE FUNCTION fn_validate_data_quality();

-- PG Trigger: Log system events
CREATE OR REPLACE FUNCTION fn_log_system_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO system_events (event_type, severity, message, event_metadata)
    VALUES (
        'BACKUP_EVENT',
        CASE 
            WHEN NEW.status = 'success' THEN 'info'
            ELSE 'warning'
        END,
        'Backup ' || NEW.backup_type || ' ' || NEW.status,
        jsonb_build_object(
            'backup_id', NEW.backup_id,
            'duration_seconds', NEW.duration_seconds,
            'backup_size_bytes', NEW.backup_size_bytes
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_backup_event_log
AFTER INSERT ON backup_logs
FOR EACH ROW
EXECUTE FUNCTION fn_log_system_event();
```

---

## 📥 Complex Queries with Joins & Optimization

### Q1: Student Academic Performance Report

```sql
SELECT 
    s.enrollment_id,
    u.first_name,
    u.last_name,
    d.dept_name,
    c.course_name,
    c.course_code,
    er.marks_obtained,
    er.total_marks,
    er.percentage,
    CASE 
        WHEN er.percentage >= 90 THEN 'A'
        WHEN er.percentage >= 80 THEN 'B'
        WHEN er.percentage >= 70 THEN 'C'
        ELSE 'D'
    END AS grade,
    f.faculty_code,
    ca.campus_name
FROM students s
INNER JOIN users u ON s.user_id = u.user_id
INNER JOIN departments d ON s.department_id = d.department_id
INNER JOIN campuses ca ON d.campus_id = ca.campus_id
INNER JOIN enrollments e ON s.student_id = e.student_id
INNER JOIN courses c ON e.course_id = c.course_id
LEFT JOIN exam_results er ON e.enrollment_id = er.enrollment_id
LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
WHERE s.status = 'active' 
  AND er.exam_type = 'final'
ORDER BY s.enrollment_id, er.percentage DESC;

-- Add index for optimization
CREATE INDEX idx_student_enrollment ON students(student_id, enrollment_id);
CREATE INDEX idx_exam_results_lookup ON exam_results(enrollment_id, exam_type);
```

### Q2: Faculty Course Load Analysis

```sql
SELECT 
    f.faculty_code,
    u.first_name,
    u.last_name,
    COUNT(DISTINCT c.course_id) AS total_courses,
    SUM(c.credit_hours) AS total_credit_hours,
    COUNT(DISTINCT e.student_id) AS total_students,
    d.dept_name,
    ca.campus_name,
    ROUND(AVG(er.percentage), 2) AS avg_student_score
FROM faculty f
INNER JOIN users u ON f.user_id = u.user_id
INNER JOIN departments d ON f.department_id = d.department_id
INNER JOIN campuses ca ON d.campus_id = ca.campus_id
LEFT JOIN courses c ON f.faculty_id = c.faculty_id
LEFT JOIN enrollments e ON c.course_id = e.course_id
LEFT JOIN exam_results er ON e.enrollment_id = er.enrollment_id
WHERE f.status = 'active'
GROUP BY f.faculty_id, f.faculty_code, u.user_id, d.department_id, ca.campus_id
HAVING total_courses > 0
ORDER BY total_credit_hours DESC;
```

### Q3: Cross-Campus Enrollment Statistics

```sql
SELECT 
    ca.campus_name,
    da.dept_name,
    COUNT(DISTINCT s.student_id) AS active_students,
    COUNT(DISTINCT c.course_id) AS available_courses,
    COUNT(DISTINCT e.enrollment_id) AS total_enrollments,
    ROUND(AVG(s.gpa), 2) AS avg_student_gpa,
    COUNT(DISTINCT f.faculty_id) AS total_faculty
FROM campuses ca
INNER JOIN departments da ON ca.campus_id = da.campus_id
LEFT JOIN students s ON da.department_id = s.department_id AND s.status = 'active'
LEFT JOIN courses c ON da.department_id = c.department_id
LEFT JOIN enrollments e ON c.course_id = e.course_id
LEFT JOIN faculty f ON da.department_id = f.department_id AND f.status = 'active'
GROUP BY ca.campus_id, da.department_id
ORDER BY ca.campus_name, active_students DESC;
```

---

## 📈 Views for Data Consistency

### MySQL Views:

```sql
-- View 1: Student Dashboard Data
CREATE VIEW v_student_dashboard AS
SELECT 
    u.user_id,
    u.username,
    u.email,
    s.enrollment_id,
    d.dept_name,
    COUNT(e.enrollment_id) AS enrolled_courses,
    AVG(er.percentage) AS avg_percentage,
    s.gpa,
    s.status
FROM users u
INNER JOIN students s ON u.user_id = s.user_id
INNER JOIN departments d ON s.department_id = d.department_id
LEFT JOIN enrollments e ON s.student_id = e.student_id
LEFT JOIN exam_results er ON e.enrollment_id = er.enrollment_id
GROUP BY u.user_id;

-- View 2: Faculty Course Summary
CREATE VIEW v_faculty_courses AS
SELECT 
    f.faculty_id,
    u.first_name,
    u.last_name,
    c.course_code,
    c.course_name,
    COUNT(e.student_id) AS enrollment_count,
    c.capacity,
    ROUND((COUNT(e.student_id) / c.capacity) * 100, 2) AS occupancy_percentage
FROM faculty f
INNER JOIN users u ON f.user_id = u.user_id
LEFT JOIN courses c ON f.faculty_id = c.faculty_id
LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'enrolled'
GROUP BY f.faculty_id, c.course_id;

-- View 3: Campus Performance Metrics
CREATE VIEW v_campus_metrics AS
SELECT 
    ca.campus_name,
    COUNT(DISTINCT s.student_id) AS total_students,
    COUNT(DISTINCT f.faculty_id) AS total_faculty,
    COUNT(DISTINCT c.course_id) AS total_courses,
    AVG(s.gpa) AS avg_student_gpa,
    ca.replication_type
FROM campuses ca
LEFT JOIN departments d ON ca.campus_id = d.campus_id
LEFT JOIN students s ON d.department_id = s.department_id
LEFT JOIN faculty f ON d.department_id = f.department_id
LEFT JOIN courses c ON d.department_id = c.department_id
GROUP BY ca.campus_id;
```

### PostgreSQL Views (Materialized for Analytics):

```sql
-- Materialized View: Student Performance Rankings
CREATE MATERIALIZED VIEW mv_student_performance_rankings AS
SELECT 
    s.enrollment_id,
    u.first_name || ' ' || u.last_name AS full_name,
    s.gpa,
    d.dept_name,
    COUNT(DISTINCT e.course_id) AS total_courses,
    AVG(er.percentage) AS avg_score,
    ROW_NUMBER() OVER (PARTITION BY d.department_id ORDER BY s.gpa DESC) AS rank_in_dept,
    ROW_NUMBER() OVER (ORDER BY s.gpa DESC) AS overall_rank,
    CASE 
        WHEN s.gpa >= 3.7 THEN 'Honors'
        WHEN s.gpa >= 3.3 THEN 'Dean''s List'
        ELSE 'Regular'
    END AS academic_status,
    NOW() AS last_updated
FROM students s
JOIN users u ON s.user_id = u.user_id
JOIN departments d ON s.department_id = d.department_id
LEFT JOIN enrollments e ON s.student_id = e.student_id
LEFT JOIN exam_results er ON e.enrollment_id = er.enrollment_id
WHERE s.status = 'active'
GROUP BY s.student_id, u.user_id, d.department_id;

CREATE INDEX idx_mv_student_perf_gpa ON mv_student_performance_rankings(gpa DESC);
CREATE INDEX idx_mv_student_perf_dept ON mv_student_performance_rankings(dept_name);

-- Materialized View: Faculty Effectiveness Metrics
CREATE MATERIALIZED VIEW mv_faculty_effectiveness AS
SELECT 
    f.faculty_code,
    u.first_name || ' ' || u.last_name AS full_name,
    c.course_code,
    c.course_name,
    COUNT(DISTINCT e.student_id) AS total_students,
    ROUND(AVG(er.percentage)::NUMERIC, 2) AS avg_student_score,
    ROUND((COUNT(CASE WHEN er.percentage >= 60 THEN 1 END)::NUMERIC / 
           COUNT(*)::NUMERIC * 100)::NUMERIC, 2) AS pass_rate,
    MAX(er.percentage) AS highest_score,
    MIN(er.percentage) AS lowest_score,
    ROUND(STDDEV(er.percentage)::NUMERIC, 2) AS score_std_dev,
    CASE 
        WHEN AVG(er.percentage) >= 85 THEN 'Excellent'
        WHEN AVG(er.percentage) >= 75 THEN 'Good'
        WHEN AVG(er.percentage) >= 65 THEN 'Average'
        ELSE 'Below Average'
    END AS performance_rating,
    NOW() AS last_calculated
FROM faculty f
JOIN users u ON f.user_id = u.user_id
LEFT JOIN courses c ON f.faculty_id = c.faculty_id
LEFT JOIN enrollments e ON c.course_id = e.course_id
LEFT JOIN exam_results er ON e.enrollment_id = er.enrollment_id
GROUP BY f.faculty_id, f.faculty_code, u.user_id, c.course_id;

CREATE INDEX idx_mv_faculty_perf ON mv_faculty_effectiveness(performance_rating);
```

---

## 🔄 Transaction Management

### A. ACID Compliance Example

```sql
-- MySQL Transaction: Transfer Student Between Departments
DELIMITER $$
CREATE PROCEDURE sp_transfer_student(
    IN p_student_id INT,
    IN p_new_department_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        GET DIAGNOSTICS CONDITION 1 @msg = MESSAGE_TEXT;
        SET p_message = CONCAT('Transfer failed: ', @msg);
    END;
    
    START TRANSACTION;
    
    -- Atomicity: All or nothing
    -- Consistency: Validate department exists and is active
    IF NOT EXISTS (SELECT 1 FROM departments WHERE department_id = p_new_department_id) THEN
        SET p_success = FALSE;
        SET p_message = 'Department not found';
        ROLLBACK;
    ELSE
        -- Get old department for logging
        DECLARE v_old_dept_id INT;
        SELECT department_id INTO v_old_dept_id FROM students WHERE student_id = p_student_id;
        
        -- Update student record
        UPDATE students SET department_id = p_new_department_id WHERE student_id = p_student_id;
        
        -- Update user department
        UPDATE users 
        SET department_id = p_new_department_id 
        WHERE user_id = (SELECT user_id FROM students WHERE student_id = p_student_id);
        
        -- Log the transaction (Durability)
        INSERT INTO audit_logs_temp (user_id, action, table_name, record_id, old_value, new_value, timestamp)
        VALUES (CURRENT_USER(), 'TRANSFER', 'students', p_student_id,
                CONCAT('Dept: ', v_old_dept_id), CONCAT('Dept: ', p_new_department_id), NOW());
        
        COMMIT;
        SET p_success = TRUE;
        SET p_message = 'Student transferred successfully';
    END IF;
END$$
DELIMITER ;
```

### B. Deadlock Handling & Resolution

```sql
-- MySQL: Deadlock Avoidance
DELIMITER $$
CREATE PROCEDURE sp_bulk_update_grades(
    IN p_semester INT
)
BEGIN
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_enrollment_id INT;
    DECLARE v_new_grade VARCHAR(2);
    
    DECLARE enrollment_cursor CURSOR FOR
        SELECT e.enrollment_id 
        FROM enrollments e
        WHERE e.semester = p_semester
        ORDER BY e.enrollment_id;  -- Always same order to avoid deadlock
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
    
    OPEN enrollment_cursor;
    
    process_loop: LOOP
        FETCH enrollment_cursor INTO v_enrollment_id;
        IF v_done THEN LEAVE process_loop; END IF;
        
        START TRANSACTION;
        
        -- Lock in consistent order (always ENROLLMENTS first, then EXAM_RESULTS)
        SELECT e.enrollment_id FROM enrollments e 
        WHERE e.enrollment_id = v_enrollment_id FOR UPDATE;
        
        SELECT er.result_id FROM exam_results er 
        WHERE er.enrollment_id = v_enrollment_id FOR UPDATE;
        
        -- Update grade
        UPDATE enrollments SET grade = v_new_grade WHERE enrollment_id = v_enrollment_id;
        
        COMMIT;
        
    END LOOP;
    
    CLOSE enrollment_cursor;
END$$
DELIMITER ;

-- PostgreSQL: Deadlock Monitoring
CREATE OR REPLACE FUNCTION fn_monitor_deadlocks()
RETURNS TABLE (
    blocked_pid INT,
    blocking_pid INT,
    blocked_statement TEXT,
    blocking_statement TEXT,
    wait_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        blocked_locks.pid,
        blocking_locks.pid,
        blocked_activity.query,
        blocking_activity.query,
        blocked_activity.query_start - blocking_activity.query_start AS wait_time
    FROM pg_catalog.pg_locks blocked_locks
    JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
    JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
    JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
    WHERE NOT blocked_locks.granted;
END;
$$ LANGUAGE plpgsql;
```

---

## 📤 Set Operations

```sql
-- UNION: Combine Active Students and Faculty
SELECT 
    u.user_id,
    u.username,
    u.email,
    'Student' AS user_type,
    d.dept_name
FROM users u
INNER JOIN students s ON u.user_id = s.user_id
INNER JOIN departments d ON s.department_id = d.department_id
WHERE s.status = 'active'

UNION

SELECT 
    u.user_id,
    u.username,
    u.email,
    'Faculty' AS user_type,
    d.dept_name
FROM users u
INNER JOIN faculty f ON u.user_id = f.user_id
INNER JOIN departments d ON f.department_id = d.department_id
WHERE f.status = 'active'

ORDER BY user_type, username;

-- EXCEPT: Departments with no active students
SELECT d.department_id, d.dept_name
FROM departments d
WHERE NOT EXISTS (
    SELECT 1 FROM students s 
    WHERE s.department_id = d.department_id AND s.status = 'active'
);
```

---

## 💻 Cursor Operations

```sql
-- MySQL: Batch Process Student Results
DELIMITER $$
CREATE PROCEDURE sp_process_semester_results(
    IN p_semester INT
)
BEGIN
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_enrollment_id INT;
    DECLARE v_marks INT;
    DECLARE v_total_marks INT := 100;
    DECLARE v_grade VARCHAR(2);
    
    DECLARE enrollment_cursor CURSOR FOR
        SELECT e.enrollment_id
        FROM enrollments e
        WHERE e.semester = p_semester AND e.status = 'enrolled'
        ORDER BY e.enrollment_id;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
    
    OPEN enrollment_cursor;
    
    read_loop: LOOP
        FETCH enrollment_cursor INTO v_enrollment_id;
        
        IF v_done THEN
            LEAVE read_loop;
        END IF;
        
        -- Simulate random marks
        SET v_marks := FLOOR(RAND() * 100) + 1;
        
        -- Calculate grade
        CASE 
            WHEN (v_marks / v_total_marks) >= 0.9 THEN SET v_grade = 'A';
            WHEN (v_marks / v_total_marks) >= 0.8 THEN SET v_grade = 'B';
            WHEN (v_marks / v_total_marks) >= 0.7 THEN SET v_grade = 'C';
            WHEN (v_marks / v_total_marks) >= 0.6 THEN SET v_grade = 'D';
            ELSE SET v_grade = 'F';
        END CASE;
        
        -- Insert results
        INSERT INTO exam_results (enrollment_id, exam_type, marks_obtained, total_marks, percentage, exam_date)
        VALUES (v_enrollment_id, 'final', v_marks, v_total_marks, 
                (v_marks / v_total_marks) * 100, CURDATE());
        
    END LOOP;
    
    CLOSE enrollment_cursor;
END$$
DELIMITER ;

-- PostgreSQL: Cursor with SCROLL option
CREATE OR REPLACE FUNCTION fn_process_students()
RETURNS INT AS $$
DECLARE
    v_student_record RECORD;
    v_count INT := 0;
    student_cursor CURSOR WITH HOLD FOR
        SELECT s.student_id, s.enrollment_id, s.gpa
        FROM students s
        WHERE s.status = 'active'
        ORDER BY s.gpa DESC;
BEGIN
    OPEN student_cursor;
    
    LOOP
        FETCH NEXT FROM student_cursor INTO v_student_record;
        EXIT WHEN NOT FOUND;
        
        -- Process each student
        UPDATE students SET gpa = v_student_record.gpa * 1.05
        WHERE student_id = v_student_record.student_id;
        
        v_count := v_count + 1;
    END LOOP;
    
    CLOSE student_cursor;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔌 Backend Database Connections (Node.js)

### 1. MySQL Connection Pool

```javascript
// lib/db/mysql.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'university_main',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
  multipleStatements: false,
});

export async function executeQuery<T>(query: string, values?: any[]): Promise<T[]> {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.execute(query, values);
    return results as T[];
  } finally {
    connection.release();
  }
}

export default pool;
```

### 2. PostgreSQL Connection Pool

```typescript
// lib/db/postgresql.ts
import { Pool, QueryResult } from 'pg';

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'university_analytics',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function executeQuery<T>(query: string, values?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result: QueryResult<T> = await client.query(query, values);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function executeTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Connection monitoring
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
```

### 3. Cross-Database Query Handler

```typescript
// lib/db/query-router.ts
import mysqlPool from './mysql';
import pgPool from './postgresql';

export class QueryRouter {
  async queryMySQL<T>(query: string, values?: any[]): Promise<T[]> {
    const connection = await mysqlPool.getConnection();
    try {
      const [results] = await connection.execute(query, values);
      return results as T[];
    } finally {
      connection.release();
    }
  }

  async queryPostgreSQL<T>(query: string, values?: any[]): Promise<T[]> {
    const result = await pgPool.query(query, values);
    return result.rows as T[];
  }

  async syncDataToAnalytics<T>(
    mysqlQuery: string,
    pgInsertQuery: string,
    mysqlValues?: any[],
    pgValues?: any[]
  ): Promise<void> {
    // Fetch from MySQL
    const mysqlData = await this.queryMySQL<T>(mysqlQuery, mysqlValues);
    
    // Insert to PostgreSQL for analytics
    if (mysqlData.length > 0) {
      await this.queryPostgreSQL(pgInsertQuery, pgValues);
    }
  }
}

export default new QueryRouter();
```

### 4. Redis Cache Connection

```typescript
// lib/cache/redis.ts
import redis from 'redis';

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: 0,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  },
});

client.on('error', (err) => console.log('Redis Client Error', err));
client.on('connect', () => console.log('Redis Connected'));

export async function cacheGet(key: string) {
  return await client.get(key);
}

export async function cacheSet(key: string, value: string, ttl: number = 3600) {
  await client.setEx(key, ttl, value);
}

export async function cacheDelete(key: string) {
  await client.del(key);
}

export async function cacheClear(pattern: string) {
  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    await client.del(keys);
  }
}

await client.connect();
export default client;
```

---

## 🎨 Frontend Structure (Next.js)

### 1. Project Directory Structure

```
university-management-system/
├── public/
│   ├── assets/
│   └── images/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   ├── students/
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── route.ts
│   │   │   ├── courses/
│   │   │   │   ├── [id]/route.ts
│   │   │   │   ├── enroll/route.ts
│   │   │   │   └── route.ts
│   │   │   ├── faculty/
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── route.ts
│   │   │   ├── exams/
│   │   │   │   ├── results/route.ts
│   │   │   │   └── route.ts
│   │   │   └── admin/
│   │   │       ├── users/route.ts
│   │   │       ├── backup/route.ts
│   │   │       ├── analytics/route.ts
│   │   │       └── reports/route.ts
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── students/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── layout.tsx
│   │   ├── courses/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── layout.tsx
│   │   ├── admin/
│   │   │   ├── users/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   ├── backup/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   └── layout.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── dashboard/
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── FacultyDashboard.tsx
│   │   │   └── AdminDashboard.tsx
│   │   ├── students/
│   │   │   ├── StudentList.tsx
│   │   │   ├── StudentForm.tsx
│   │   │   └── StudentDetail.tsx
│   │   ├── courses/
│   │   │   ├── CourseList.tsx
│   │   │   ├── CourseForm.tsx
│   │   │   └── CourseDetail.tsx
│   │   ├── exams/
│   │   │   ├── ExamForm.tsx
│   │   │   ├── ResultsList.tsx
│   │   │   └── ResultAnalysis.tsx
│   │   ├── admin/
│   │   │   ├── UserManagement.tsx
│   │   │   ├── BackupManager.tsx
│   │   │   ├── ReplicationMonitor.tsx
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   └── ReportsGenerator.tsx
│   │   ├── common/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── tables/
│   │       ├── DataTable.tsx
│   │       └── Pagination.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── students.ts
│   │   │   ├── courses.ts
│   │   │   ├── faculty.ts
│   │   │   ├── admin.ts
│   │   │   └── analytics.ts
│   │   ├── db/
│   │   │   ├── mysql.ts
│   │   │   ├── postgresql.ts
│   │   │   ├── redis.ts
│   │   │   └── query-router.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useStudents.ts
│   │   │   ├── useCourses.ts
│   │   │   ├── useAnalytics.ts
│   │   │   └── useAPI.ts
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── user.ts
│   │   │   ├── student.ts
│   │   │   ├── course.ts
│   │   │   ├── exam.ts
│   │   │   ├── analytics.ts
│   │   │   └── api.ts
│   │   ├── utils/
│   │   │   ├── auth.ts
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   ├── api-handlers.ts
│   │   │   └── export-utils.ts
│   │   └── middleware/
│   │       ├── auth.ts
│   │       ├── errorHandler.ts
│   │       ├── roleCheck.ts
│   │       └── requestLogger.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── layout.module.css
│   │   └── components/
│   └── context/
│       ├── AuthContext.tsx
│       ├── ThemeContext.tsx
│       └── NotificationContext.tsx
├── .env.local
├── next.config.js
├── tsconfig.json
├── package.json
└── README.md
```

### 2. TypeScript Types

```typescript
// lib/types/index.ts
export interface User {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  department_id: number;
  campus_id: number;
  status: 'active' | 'inactive' | 'suspended';
  created_at: Date;
  last_login: Date;
}

export interface Student extends User {
  student_id: number;
  enrollment_id: string;
  enrollment_date: Date;
  current_semester: number;
  gpa: number;
}

export interface Course {
  course_id: number;
  course_code: string;
  course_name: string;
  department_id: number;
  faculty_id: number;
  credit_hours: number;
  capacity: number;
  semester: number;
  enrollment_count?: number;
}

export interface Analytics {
  metric_id: number;
  metric_type: string;
  metric_value: number;
  recorded_at: Date;
}

export interface BackupLog {
  backup_id: number;
  backup_type: 'full' | 'differential' | 'incremental';
  backup_file_name: string;
  backup_size_bytes: bigint;
  status: 'success' | 'failed' | 'pending';
  backup_start: Date;
  backup_end: Date;
}

export interface AuditLog {
  log_id: number;
  user_id: number;
  action: string;
  table_name: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  timestamp: Date;
}
```

---

## 📋 API Endpoints

### Analytics Endpoints (PostgreSQL)
```
GET    /api/admin/analytics/dashboard    - Overall system metrics
GET    /api/admin/analytics/students     - Student performance analytics
GET    /api/admin/analytics/courses      - Course effectiveness metrics
GET    /api/admin/analytics/faculty      - Faculty performance metrics
GET    /api/admin/analytics/anomalies    - Data quality & anomalies
```

### Monitoring Endpoints
```
GET    /api/admin/monitoring/replication - Replication status
GET    /api/admin/monitoring/performance - Database performance metrics
GET    /api/admin/monitoring/deadlocks   - Active deadlocks
GET    /api/admin/monitoring/system-health - Overall system health
```

---

## 🗂️ Key Configuration Files

### 1. Environment Variables (.env.local)

```env
# MySQL Database (Primary)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=university_main

# MySQL Secondary Databases (Linked Servers)
MYSQL_SECONDARY_HOST=islamabad-db.campus.local
MYSQL_SECONDARY_USER=replication_user
MYSQL_SECONDARY_PASSWORD=replication_password

MYSQL_TERTIARY_HOST=karachi-db.campus.local
MYSQL_TERTIARY_USER=replication_user
MYSQL_TERTIARY_PASSWORD=replication_password

# PostgreSQL Database (Analytics, Logs)
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=postgres_password
PG_DATABASE=university_analytics

# PostgreSQL Replication
PG_REPLICATION_USER=replication_user
PG_REPLICATION_PASSWORD=postgres_repl_pwd

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# API
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
API_SECRET_KEY=your_api_secret

# File Storage (Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_password

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=University Management System
```

### 2. Database Connection Configuration

```typescript
// lib/config/database.ts
export const databaseConfig = {
  mysql: {
    primary: {
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      connectionLimit: 10,
    },
    secondary: {
      host: process.env.MYSQL_SECONDARY_HOST,
      port: 3306,
      user: process.env.MYSQL_SECONDARY_USER,
      password: process.env.MYSQL_SECONDARY_PASSWORD,
      database: 'university_secondary',
      connectionLimit: 5,
    },
  },
  postgresql: {
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT || '5432'),
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
};
```

---

## 📊 PostgreSQL Partitioning for Large Tables

```sql
-- Partition audit_logs by month
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Partition api_request_logs by day
CREATE TABLE api_request_logs_2024_01_01 PARTITION OF api_request_logs
  FOR VALUES FROM ('2024-01-01') TO ('2024-01-02');

-- Automatic partition creation
CREATE OR REPLACE FUNCTION fn_create_monthly_partitions()
RETURNS void AS $$
DECLARE
  v_new_month DATE;
  v_partition_name TEXT;
BEGIN
  v_new_month := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
  v_partition_name := 'audit_logs_' || TO_CHAR(v_new_month, 'YYYY_MM');
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = v_partition_name
  ) THEN
    EXECUTE 'CREATE TABLE ' || v_partition_name || 
      ' PARTITION OF audit_logs FOR VALUES FROM (''' || v_new_month || 
      ''') TO (''' || (v_new_month + INTERVAL '1 month') || ''')';
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## 🚀 Deployment Requirements

### Frontend (Next.js)
- Node.js 18+ with npm/yarn
- Vercel, Netlify, or self-hosted server
- Environment variables configured
- SSL certificate for HTTPS

### Backend Databases
- **MySQL 8.0+** (Primary + 2 Replicas)
- **PostgreSQL 14+** (Analytics & Logs)
- **Redis 6.0+** (Caching)
- Nginx/Apache reverse proxy
- SSL certificates for all services

### Replication & High Availability
- Configure MySQL master-slave replication
- Set up PostgreSQL streaming replication
- Implement automatic failover
- Monitor replication lag
- Regular backup verification

---

## 📋 Implementation Checklist

### Database Setup
- [ ] Install and configure MySQL 8.0+
- [ ] Install and configure PostgreSQL 14+
- [ ] Set up Redis cache
- [ ] Create MySQL primary and replica databases
- [ ] Create PostgreSQL primary and standby databases

### MySQL Configuration
- [ ] Create all transactional tables
- [ ] Implement sequences for ID generation
- [ ] Create 5+ stored procedures
- [ ] Create 4+ triggers (DDL & DML)
- [ ] Set up binary logging for replication
- [ ] Configure master-slave replication

### PostgreSQL Configuration
- [ ] Create audit and logging tables
- [ ] Create analytics tables
- [ ] Implement materialized views
- [ ] Create PostgreSQL functions (5+)
- [ ] Set up streaming replication
- [ ] Configure table partitioning

### Security
- [ ] Create user roles and permissions
- [ ] Implement role-based access control
- [ ] Configure MySQL ACLs
- [ ] Configure PostgreSQL ACLs
- [ ] Set up password hashing
- [ ] Implement JWT authentication

### Backup & Recovery
- [ ] Configure automated backups
- [ ] Set up backup validation
- [ ] Test restoration procedures
- [ ] Document disaster recovery plan
- [ ] Create backup monitoring alerts

### Frontend Development
- [ ] Set up Next.js project
- [ ] Create authentication system
- [ ] Build dashboard components
- [ ] Create CRUD pages
- [ ] Implement analytics dashboard
- [ ] Add reporting features

### Testing & Deployment
- [ ] Unit tests for APIs
- [ ] Integration tests
- [ ] Load testing
- [ ] Security testing
- [ ] User acceptance testing
- [ ] Production deployment

---

## 📚 References

**All Lab Concepts Implemented:**
- ✅ Lab 1: SQL Installation & Database Schema
- ✅ Lab 2: Execution Plans & Complex Joins
- ✅ Lab 2.1: User Authentication & Role-Based Access Control
- ✅ Lab 3: Distributed Architecture & Linked Servers
- ✅ Lab 5: System Queries & SQL Services Monitoring
- ✅ Lab 6: 5+ Stored Procedures
- ✅ Lab 7: Sequences, SQL Injection Prevention, Cursors
- ✅ Lab 8: 4+ Complex Triggers (DDL & DML)
- ✅ Lab 9: Transaction Management & ACID Compliance
- ✅ Lab 10: Deadlock Detection & Resolution Strategies
- ✅ Lab 11: Database Scripting & Automation
- ✅ Lab 12: Full, Differential & Incremental Backups
- ✅ Lab 13: Database Migration Strategies
- ✅ Lab 14: Disaster Recovery Planning & Failover

**Technology Stack:**
- MySQL 8.0+ with Replication
- PostgreSQL 14+ with Analytics
- Next.js 14+ with TypeScript
- Node.js Express API
- Redis Caching
- JWT Authentication

---

**Next Steps:**
1. Review this comprehensive guide with your development team
2. Set up development environment with all database systems
3. Create MySQL schema for transactional data
4. Create PostgreSQL schema for analytics and logging
5. Implement backend APIs with Node.js
6. Build frontend components with Next.js
7. Configure replication and failover mechanisms
8. Set up monitoring and alerting
9. Perform comprehensive testing
10. Deploy to production environment