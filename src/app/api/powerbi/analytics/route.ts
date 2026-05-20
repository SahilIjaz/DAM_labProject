import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/postgresql';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization');

    if (!token || !token.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Student performance analytics
    const performanceQuery = `
      SELECT
        s.student_id,
        s.first_name,
        s.last_name,
        c.course_name,
        eg.obtained_marks,
        eg.total_marks,
        ROUND((eg.obtained_marks::numeric / eg.total_marks * 100), 2) as percentage
      FROM students s
      JOIN enrollments e ON s.student_id = e.student_id
      JOIN courses c ON e.course_id = c.course_id
      JOIN exam_grades eg ON e.enrollment_id = eg.enrollment_id
      ORDER BY s.student_id, c.course_name
      LIMIT 1000
    `;

    const performanceData = await executeQuery(performanceQuery);

    // Course enrollment analytics
    const enrollmentQuery = `
      SELECT
        c.course_id,
        c.course_name,
        COUNT(e.enrollment_id) as total_enrolled,
        c.capacity,
        ROUND((COUNT(e.enrollment_id)::numeric / c.capacity * 100), 2) as capacity_used_percent
      FROM courses c
      LEFT JOIN enrollments e ON c.course_id = e.course_id
      GROUP BY c.course_id, c.course_name, c.capacity
      ORDER BY total_enrolled DESC
    `;

    const enrollmentData = await executeQuery(enrollmentQuery);

    // API performance metrics
    const apiMetricsQuery = `
      SELECT
        endpoint,
        method,
        COUNT(*) as total_requests,
        ROUND(AVG(response_time_ms), 2) as avg_response_time_ms,
        MAX(response_time_ms) as max_response_time_ms,
        MIN(response_time_ms) as min_response_time_ms,
        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count
      FROM api_request_logs
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY endpoint, method
      ORDER BY total_requests DESC
      LIMIT 50
    `;

    const apiMetrics = await executeQuery(apiMetricsQuery);

    // System health
    const healthQuery = `
      SELECT
        'total_students' as metric,
        COUNT(*)::text as value
      FROM students
      UNION ALL
      SELECT 'total_courses', COUNT(*)::text FROM courses
      UNION ALL
      SELECT 'total_enrollments', COUNT(*)::text FROM enrollments
      UNION ALL
      SELECT 'total_users', COUNT(*)::text FROM users
      UNION ALL
      SELECT 'avg_api_response_time_ms',
        ROUND(AVG(response_time_ms), 2)::text FROM api_request_logs
    `;

    const healthData = await executeQuery(healthQuery);

    return NextResponse.json({
      success: true,
      data: {
        studentPerformance: performanceData,
        courseEnrollment: enrollmentData,
        apiMetrics: apiMetrics,
        systemHealth: healthData,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('PowerBI analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
