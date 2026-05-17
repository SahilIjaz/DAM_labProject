-- PostgreSQL Schema for Analytics, Logs, and Audit Trails
-- Database: university_analytics

CREATE DATABASE IF NOT EXISTS university_analytics;

-- Connect to the analytics database
\c university_analytics

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- AUDIT AND COMPLIANCE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(255),
    table_name VARCHAR(100),
    record_id INTEGER,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs(table_name);

-- ============================================================================
-- SYSTEM AND PERFORMANCE LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_logs (
    log_id BIGSERIAL PRIMARY KEY,
    log_level VARCHAR(20),
    component VARCHAR(100),
    message TEXT,
    error_details JSONB,
    context_data JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_timestamp ON system_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_component ON system_logs(component);
CREATE INDEX IF NOT EXISTS idx_system_log_level ON system_logs(log_level);

-- ============================================================================
-- API REQUEST LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_request_logs (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INTEGER,
    response_time_ms INTEGER,
    request_body JSONB,
    response_body JSONB,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_user_id ON api_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_endpoint ON api_request_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_timestamp ON api_request_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_status_code ON api_request_logs(status_code);

-- ============================================================================
-- DATABASE PERFORMANCE METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS db_performance_metrics (
    metric_id BIGSERIAL PRIMARY KEY,
    database_name VARCHAR(100),
    table_name VARCHAR(100),
    metric_type VARCHAR(50),
    metric_value NUMERIC,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_db_metrics_table ON db_performance_metrics(table_name);
CREATE INDEX IF NOT EXISTS idx_db_metrics_timestamp ON db_performance_metrics(recorded_at);

-- ============================================================================
-- BACKUP AND RESTORE LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS backup_logs (
    backup_id BIGSERIAL PRIMARY KEY,
    backup_type VARCHAR(20),
    source_database VARCHAR(100),
    backup_file_name VARCHAR(255),
    backup_size_bytes BIGINT,
    backup_path TEXT,
    backup_start TIMESTAMPTZ,
    backup_end TIMESTAMPTZ,
    duration_seconds INTEGER,
    status VARCHAR(20),
    error_message TEXT,
    verified BOOLEAN DEFAULT FALSE,
    restore_test_date TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_backup_date ON backup_logs(backup_start);
CREATE INDEX IF NOT EXISTS idx_backup_status ON backup_logs(status);
CREATE INDEX IF NOT EXISTS idx_backup_source ON backup_logs(source_database);

-- ============================================================================
-- USER ACTIVITY ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_activity_analytics (
    activity_id BIGSERIAL PRIMARY KEY,
    user_id INTEGER,
    action_type VARCHAR(50),
    resource_type VARCHAR(50),
    resource_id INTEGER,
    campus_id INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    activity_metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON user_activity_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_type ON user_activity_analytics(action_type);

-- ============================================================================
-- REPLICATION STATUS MONITORING
-- ============================================================================

CREATE TABLE IF NOT EXISTS replication_status (
    status_id BIGSERIAL PRIMARY KEY,
    primary_server VARCHAR(100),
    replica_server VARCHAR(100),
    last_sync_time TIMESTAMPTZ,
    replication_lag_ms INTEGER,
    binlog_position VARCHAR(255),
    sync_status VARCHAR(50),
    error_message TEXT,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_replication_replica ON replication_status(replica_server);
CREATE INDEX IF NOT EXISTS idx_replication_checked ON replication_status(checked_at);

-- ============================================================================
-- DATA QUALITY METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_quality_metrics (
    metric_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100),
    total_records INTEGER,
    duplicate_records INTEGER,
    null_values INTEGER,
    integrity_violations INTEGER,
    last_checked TIMESTAMPTZ DEFAULT NOW(),
    quality_score NUMERIC
);

CREATE INDEX IF NOT EXISTS idx_quality_table ON data_quality_metrics(table_name);
CREATE INDEX IF NOT EXISTS idx_quality_checked ON data_quality_metrics(last_checked);

-- ============================================================================
-- SYSTEM EVENTS AND ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_events (
    event_id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100),
    severity VARCHAR(20),
    message TEXT,
    event_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by INTEGER
);

CREATE INDEX IF NOT EXISTS idx_events_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_severity ON system_events(severity);
CREATE INDEX IF NOT EXISTS idx_events_created ON system_events(created_at);

-- ============================================================================
-- DISASTER RECOVERY TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS disaster_recovery_events (
    dr_event_id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50),
    source_campus VARCHAR(100),
    target_campus VARCHAR(100),
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(50),
    error_details JSONB,
    recovery_time_seconds INTEGER,
    data_loss_records INTEGER
);

CREATE INDEX IF NOT EXISTS idx_dr_initiated ON disaster_recovery_events(initiated_at);
CREATE INDEX IF NOT EXISTS idx_dr_status ON disaster_recovery_events(status);

-- ============================================================================
-- STUDENT ACADEMIC ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_performance_analytics (
    analytics_id BIGSERIAL PRIMARY KEY,
    student_id INTEGER,
    semester INTEGER,
    total_courses INTEGER,
    average_percentage NUMERIC,
    highest_score NUMERIC,
    lowest_score NUMERIC,
    passing_courses INTEGER,
    failing_courses INTEGER,
    trend_analysis JSONB,
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_perf_id ON student_performance_analytics(student_id);
CREATE INDEX IF NOT EXISTS idx_student_perf_semester ON student_performance_analytics(semester);

-- ============================================================================
-- COURSE PERFORMANCE ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS course_performance_analytics (
    analytics_id BIGSERIAL PRIMARY KEY,
    course_id INTEGER,
    semester INTEGER,
    total_enrolled INTEGER,
    avg_score NUMERIC,
    pass_rate NUMERIC,
    fail_rate NUMERIC,
    student_feedback JSONB,
    difficulty_level VARCHAR(20),
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_perf_id ON course_performance_analytics(course_id);
CREATE INDEX IF NOT EXISTS idx_course_perf_semester ON course_performance_analytics(semester);

-- ============================================================================
-- FACULTY PERFORMANCE ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS faculty_performance_analytics (
    analytics_id BIGSERIAL PRIMARY KEY,
    faculty_id INTEGER,
    course_id INTEGER,
    total_students INTEGER,
    avg_student_score NUMERIC,
    pass_rate NUMERIC,
    student_satisfaction NUMERIC,
    performance_rating VARCHAR(50),
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faculty_perf_id ON faculty_performance_analytics(faculty_id);

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

CREATE OR REPLACE VIEW v_audit_summary AS
SELECT
    DATE(timestamp) as audit_date,
    action,
    COUNT(*) as action_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT table_name) as tables_affected
FROM audit_logs
GROUP BY DATE(timestamp), action;

CREATE OR REPLACE VIEW v_api_performance AS
SELECT
    endpoint,
    method,
    COUNT(*) as request_count,
    AVG(response_time_ms) as avg_response_time,
    MAX(response_time_ms) as max_response_time,
    MIN(response_time_ms) as min_response_time,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
FROM api_request_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY endpoint, method;

CREATE OR REPLACE VIEW v_system_health AS
SELECT
    (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
    (SELECT COUNT(*) FROM students WHERE status = 'active') as active_students,
    (SELECT COUNT(*) FROM courses) as total_courses,
    (SELECT COUNT(*) FROM enrollments WHERE status = 'enrolled') as current_enrollments,
    (SELECT AVG(gpa) FROM students WHERE status = 'active') as avg_student_gpa,
    NOW() as last_updated;
