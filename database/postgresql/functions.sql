

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
    FROM (
        SELECT er.percentage, e.course_id
        FROM exam_results er
        JOIN enrollments e ON er.enrollment_id = e.enrollment_id
        WHERE e.student_id = p_student_id
    ) subq;

    v_weighted_score := COALESCE(v_avg_percentage, 0) * 0.7 + COALESCE(v_course_count, 0) * 2;

    RETURN v_weighted_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION fn_detect_anomalies()
RETURNS TABLE (
    anomaly_type VARCHAR,
    description TEXT,
    affected_records INT,
    severity VARCHAR,
    detected_at TIMESTAMPTZ
) AS $$
BEGIN

    RETURN QUERY
    SELECT
        'Duplicate_Records'::VARCHAR,
        'Multiple entries with same timestamp and user'::TEXT,
        COUNT(*)::INT,
        'High'::VARCHAR,
        NOW()::TIMESTAMPTZ
    FROM audit_logs
    GROUP BY user_id, timestamp, table_name
    HAVING COUNT(*) > 1
    LIMIT 10;


    RETURN QUERY
    SELECT
        'Missing_Metrics'::VARCHAR,
        'Data quality not checked in 24 hours'::TEXT,
        COUNT(*)::INT,
        'Medium'::VARCHAR,
        NOW()::TIMESTAMPTZ
    FROM data_quality_metrics
    WHERE last_checked < NOW() - INTERVAL '24 hours'
    GROUP BY table_name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_generate_performance_report(p_semester INT)
RETURNS TABLE (
    student_id INTEGER,
    student_name VARCHAR,
    total_courses INT,
    avg_percentage NUMERIC,
    performance_status VARCHAR,
    report_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        spa.student_id,
        spa.student_id::VARCHAR,
        spa.total_courses,
        spa.average_percentage,
        CASE
            WHEN spa.average_percentage >= 85 THEN 'Excellent'
            WHEN spa.average_percentage >= 75 THEN 'Very Good'
            WHEN spa.average_percentage >= 65 THEN 'Good'
            WHEN spa.average_percentage >= 50 THEN 'Satisfactory'
            ELSE 'Needs Improvement'
        END::VARCHAR,
        NOW()::TIMESTAMPTZ
    FROM student_performance_analytics spa
    WHERE spa.semester = p_semester
    ORDER BY spa.average_percentage DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_monitor_replication_lag()
RETURNS TABLE (
    primary_server VARCHAR,
    replica_server VARCHAR,
    lag_ms INTEGER,
    status VARCHAR,
    last_check TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        rs.primary_server,
        rs.replica_server,
        rs.replication_lag_ms,
        rs.sync_status,
        rs.checked_at
    FROM replication_status rs
    WHERE rs.checked_at > NOW() - INTERVAL '1 hour'
    ORDER BY rs.replication_lag_ms DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_calculate_data_quality_score(p_table_name VARCHAR)
RETURNS NUMERIC AS $$
DECLARE
    v_total_records INT;
    v_duplicate_records INT;
    v_null_count INT;
    v_integrity_violations INT;
    v_quality_score NUMERIC;
BEGIN

    SELECT
        total_records,
        duplicate_records,
        null_values,
        integrity_violations
    INTO
        v_total_records,
        v_duplicate_records,
        v_null_count,
        v_integrity_violations
    FROM data_quality_metrics
    WHERE table_name = p_table_name
    ORDER BY last_checked DESC
    LIMIT 1;

    IF v_total_records = 0 THEN
        RETURN 100.0;
    END IF;

    v_quality_score := 100.0 -
        ((v_duplicate_records::NUMERIC / v_total_records) * 10) -
        ((v_null_count::NUMERIC / v_total_records) * 5) -
        ((v_integrity_violations::NUMERIC / v_total_records) * 15);

    RETURN GREATEST(0, LEAST(100, v_quality_score));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_get_api_performance_metrics(p_hours INT DEFAULT 24)
RETURNS TABLE (
    endpoint VARCHAR,
    total_requests BIGINT,
    avg_response_time NUMERIC,
    error_rate NUMERIC,
    success_count BIGINT,
    error_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        arl.endpoint,
        COUNT(*)::BIGINT,
        ROUND(AVG(arl.response_time_ms)::NUMERIC, 2),
        ROUND((COUNT(CASE WHEN arl.status_code >= 400 THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100), 2),
        COUNT(CASE WHEN arl.status_code < 400 THEN 1 END)::BIGINT,
        COUNT(CASE WHEN arl.status_code >= 400 THEN 1 END)::BIGINT
    FROM api_request_logs arl
    WHERE arl.timestamp > NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY arl.endpoint
    ORDER BY total_requests DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_system_health_check()
RETURNS TABLE (
    check_name VARCHAR,
    status VARCHAR,
    details TEXT,
    last_checked TIMESTAMPTZ
) AS $$
BEGIN

    RETURN QUERY
    SELECT
        'Replication Status'::VARCHAR,
        (CASE WHEN COUNT(*) = 0 THEN 'HEALTHY' ELSE 'WARNING' END)::VARCHAR,
        COALESCE(STRING_AGG(sync_status, ', '), 'All replicas in sync')::TEXT,
        NOW()::TIMESTAMPTZ
    FROM replication_status
    WHERE replication_lag_ms > 1000;


    RETURN QUERY
    SELECT
        'Recent Backups'::VARCHAR,
        (CASE WHEN COUNT(*) > 0 AND MAX(status) = 'success' THEN 'HEALTHY' ELSE 'WARNING' END)::VARCHAR,
        COALESCE('Last backup: ' || TO_CHAR(MAX(backup_end), 'YYYY-MM-DD HH24:MI:SS'), 'No recent backups')::TEXT,
        NOW()::TIMESTAMPTZ
    FROM backup_logs
    WHERE backup_end > NOW() - INTERVAL '24 hours';


    RETURN QUERY
    SELECT
        'System Errors'::VARCHAR,
        (CASE WHEN COUNT(*) = 0 THEN 'HEALTHY' ELSE 'WARNING' END)::VARCHAR,
        (COUNT(*)::TEXT || ' errors in last 24 hours')::TEXT,
        NOW()::TIMESTAMPTZ
    FROM system_logs
    WHERE log_level = 'ERROR' AND timestamp > NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.timestamp := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_validate_data_quality()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_records < 0 OR NEW.duplicate_records < 0 THEN
        RAISE EXCEPTION 'Invalid metric values';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE TRIGGER trg_audit_logs_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_validate_quality_metrics
BEFORE INSERT OR UPDATE ON data_quality_metrics
FOR EACH ROW
EXECUTE FUNCTION fn_validate_data_quality();

CREATE TRIGGER trg_backup_event_log
AFTER INSERT ON backup_logs
FOR EACH ROW
EXECUTE FUNCTION fn_log_system_event();
