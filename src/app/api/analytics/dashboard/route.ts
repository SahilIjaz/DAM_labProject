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
        s.student_id,
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        c.course_name,
        COUNT(DISTINCT e.enrollment_id) as courses_enrolled
      FROM students s
      LEFT JOIN enrollments e ON s.student_id = e.student_id
      LEFT JOIN courses c ON e.course_id = c.course_id
      GROUP BY s.student_id, s.first_name, s.last_name, c.course_name
      LIMIT 15
    `;

    const performanceData = await executeQuery(performanceQuery);

    // Faculty Workload
    const facultyQuery = `
      SELECT
        f.faculty_id,
        CONCAT(f.first_name, ' ', f.last_name) as faculty_name,
        COUNT(DISTINCT c.course_id) as courses_assigned,
        COUNT(DISTINCT e.enrollment_id) as total_students
      FROM faculty f
      LEFT JOIN courses c ON f.faculty_id = c.faculty_id
      LEFT JOIN enrollments e ON c.course_id = e.course_id
      GROUP BY f.faculty_id, f.first_name, f.last_name
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
