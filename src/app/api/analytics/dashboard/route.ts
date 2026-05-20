import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization');

    if (!token || !token.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // System Health Stats
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM students) as total_students,
        (SELECT COUNT(*) FROM courses) as total_courses,
        (SELECT COUNT(*) FROM faculty) as total_faculty,
        (SELECT COUNT(*) FROM enrollments) as total_enrollments
    `;

    const stats = await executeQuery(statsQuery);

    // Course Enrollment Analytics
    const enrollmentQuery = `
      SELECT
        c.course_id,
        c.course_name,
        COUNT(e.enrollment_id) as total_enrolled,
        c.capacity,
        ROUND((COUNT(e.enrollment_id) / c.capacity * 100), 2) as capacity_used_percent
      FROM courses c
      LEFT JOIN enrollments e ON c.course_id = e.course_id
      GROUP BY c.course_id, c.course_name, c.capacity
      ORDER BY total_enrolled DESC
      LIMIT 10
    `;

    const enrollmentData = await executeQuery(enrollmentQuery);

    // Student Performance Analytics
    const performanceQuery = `
      SELECT
        u.first_name,
        u.last_name,
        c.course_name,
        er.marks_obtained as obtained_marks,
        er.total_marks,
        er.percentage
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      JOIN enrollments e ON s.student_id = e.student_id
      JOIN courses c ON e.course_id = c.course_id
      LEFT JOIN exam_results er ON e.enrollment_id = er.enrollment_id
      LIMIT 10
    `;

    const performanceData = await executeQuery(performanceQuery);

    // Faculty Workload
    const facultyQuery = `
      SELECT
        f.faculty_id,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT c.course_id) as courses_assigned,
        COUNT(DISTINCT e.enrollment_id) as total_students
      FROM faculty f
      JOIN users u ON f.user_id = u.user_id
      LEFT JOIN courses c ON f.faculty_id = c.faculty_id
      LEFT JOIN enrollments e ON c.course_id = e.course_id
      GROUP BY f.faculty_id, u.first_name, u.last_name
      ORDER BY courses_assigned DESC
      LIMIT 10
    `;

    const facultyData = await executeQuery(facultyQuery);

    return NextResponse.json({
      success: true,
      data: {
        systemStats: stats[0],
        courseEnrollment: enrollmentData,
        studentPerformance: performanceData,
        facultyWorkload: facultyData,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
