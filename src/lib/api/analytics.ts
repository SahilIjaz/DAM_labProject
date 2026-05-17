import { executeQuery, callFunction } from '../db/postgresql';

export async function getStudentPerformanceAnalytics(
  studentId: number,
  semester?: number
): Promise<any> {
  let query = `
    SELECT * FROM student_performance_analytics
    WHERE student_id = ?
  `;
  const params: any[] = [studentId];

  if (semester) {
    query += ` AND semester = ?`;
    params.push(semester);
  }

  const results = await executeQuery(query, params);
  return results[0] || null;
}

export async function getCoursePerformanceAnalytics(
  courseId: number
): Promise<any> {
  const query = `
    SELECT * FROM course_performance_analytics
    WHERE course_id = ?
  `;
  const results = await executeQuery(query, [courseId]);
  return results[0] || null;
}

export async function getFacultyPerformanceAnalytics(
  facultyId: number
): Promise<any> {
  const query = `
    SELECT * FROM faculty_performance_analytics
    WHERE faculty_id = ?
  `;
  const results = await executeQuery(query, [facultyId]);
  return results[0] || null;
}

export async function generateStudentPerformanceReport(
  studentId: number,
  semester: number
): Promise<any> {
  return callFunction('fn_generate_performance_report', [studentId, semester]);
}

export async function calculateStudentScore(studentId: number): Promise<any> {
  return callFunction('fn_calculate_student_score', [studentId]);
}

export async function getAPIPerformanceMetrics(
  startTime: string,
  endTime: string
): Promise<any> {
  return callFunction('fn_get_api_performance_metrics', [startTime, endTime]);
}

export async function getSystemHealthStatus(): Promise<any> {
  return callFunction('fn_system_health_check', []);
}

export async function getReplicationStatus(): Promise<any> {
  return callFunction('fn_monitor_replication_lag', []);
}

export async function getAuditSummary(limit: number = 100): Promise<any[]> {
  const query = `
    SELECT * FROM v_audit_summary
    LIMIT ?
  `;
  return executeQuery(query, [limit]);
}

export async function getAPIPerformanceSummary(): Promise<any> {
  const query = `
    SELECT * FROM v_api_performance
  `;
  const results = await executeQuery(query, []);
  return results[0] || null;
}

export async function getSystemHealthSummary(): Promise<any> {
  const query = `
    SELECT * FROM v_system_health
  `;
  const results = await executeQuery(query, []);
  return results[0] || null;
}

export async function getDataQualityScore(): Promise<any> {
  return callFunction('fn_calculate_data_quality_score', []);
}

export async function detectDataAnomalies(): Promise<any> {
  return callFunction('fn_detect_anomalies', []);
}

export async function getAPIRequestLogs(
  startTime: string,
  endTime: string,
  limit: number = 100
): Promise<any[]> {
  const query = `
    SELECT * FROM api_request_logs
    WHERE timestamp BETWEEN ? AND ?
    ORDER BY timestamp DESC
    LIMIT ?
  `;
  return executeQuery(query, [startTime, endTime, limit]);
}

export async function getDatabasePerformanceMetrics(
  startTime: string,
  endTime: string
): Promise<any[]> {
  const query = `
    SELECT * FROM db_performance_metrics
    WHERE timestamp BETWEEN ? AND ?
    ORDER BY timestamp DESC
  `;
  return executeQuery(query, [startTime, endTime]);
}

export async function getSystemEventLogs(
  eventType?: string,
  limit: number = 100
): Promise<any[]> {
  let query = `
    SELECT * FROM system_events
  `;
  const params: any[] = [];

  if (eventType) {
    query += ` WHERE event_type = ?`;
    params.push(eventType);
  }

  query += ` ORDER BY timestamp DESC LIMIT ?`;
  params.push(limit);

  return executeQuery(query, params);
}

export async function getUserActivityAnalytics(userId: number): Promise<any> {
  const query = `
    SELECT * FROM user_activity_analytics
    WHERE user_id = ?
  `;
  const results = await executeQuery(query, [userId]);
  return results[0] || null;
}

export async function getDisasterRecoveryEvents(limit: number = 50): Promise<any[]> {
  const query = `
    SELECT * FROM disaster_recovery_events
    ORDER BY timestamp DESC
    LIMIT ?
  `;
  return executeQuery(query, [limit]);
}

export async function getBackupLogs(limit: number = 50): Promise<any[]> {
  const query = `
    SELECT * FROM backup_logs
    ORDER BY backup_timestamp DESC
    LIMIT ?
  `;
  return executeQuery(query, [limit]);
}

export async function getReplicationStatusDetails(): Promise<any[]> {
  const query = `
    SELECT * FROM replication_status
    ORDER BY last_checked DESC
  `;
  return executeQuery(query, []);
}

export async function getEnrollmentTrends(
  startDate: string,
  endDate: string
): Promise<any[]> {
  const query = `
    SELECT DATE_TRUNC('day', timestamp) as date, COUNT(*) as enrollment_count
    FROM system_logs
    WHERE event_type = 'enrollment' AND timestamp BETWEEN ? AND ?
    GROUP BY DATE_TRUNC('day', timestamp)
    ORDER BY date ASC
  `;
  return executeQuery(query, [startDate, endDate]);
}

export async function getTopPerformingStudents(limit: number = 10): Promise<any[]> {
  const query = `
    SELECT student_id, performance_score, semester
    FROM student_performance_analytics
    ORDER BY performance_score DESC
    LIMIT ?
  `;
  return executeQuery(query, [limit]);
}

export async function getTopPerformingCourses(limit: number = 10): Promise<any[]> {
  const query = `
    SELECT course_id, avg_student_score, enrollment_count
    FROM course_performance_analytics
    ORDER BY avg_student_score DESC
    LIMIT ?
  `;
  return executeQuery(query, [limit]);
}

export async function getDataQualityMetrics(): Promise<any[]> {
  const query = `
    SELECT * FROM data_quality_metrics
    ORDER BY check_timestamp DESC
  `;
  return executeQuery(query, []);
}
