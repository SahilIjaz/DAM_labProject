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

    const reportType = request.nextUrl.searchParams.get('type') || 'summary';

    if (reportType === 'student-performance') {
      const query = `
        SELECT
          s.student_id,
          s.first_name,
          s.last_name,
          s.email,
          d.department_name,
          COUNT(DISTINCT e.course_id) as courses_enrolled,
          ROUND(AVG(eg.obtained_marks::numeric / eg.total_marks * 100), 2) as avg_percentage,
          MAX(eg.obtained_marks) as highest_marks,
          MIN(eg.obtained_marks) as lowest_marks
        FROM students s
        LEFT JOIN departments d ON s.department_id = d.department_id
        LEFT JOIN enrollments e ON s.student_id = e.student_id
        LEFT JOIN exam_grades eg ON e.enrollment_id = eg.enrollment_id
        GROUP BY s.student_id, s.first_name, s.last_name, s.email, d.department_name
        ORDER BY avg_percentage DESC
      `;
      const data = await executeQuery(query);
      return NextResponse.json({ success: true, report: 'student-performance', data });
    }

    if (reportType === 'department-analytics') {
      const query = `
        SELECT
          d.department_id,
          d.department_name,
          COUNT(DISTINCT s.student_id) as total_students,
          COUNT(DISTINCT c.course_id) as total_courses,
          COUNT(DISTINCT f.faculty_id) as total_faculty,
          ROUND(AVG(eg.obtained_marks::numeric / eg.total_marks * 100), 2) as avg_performance
        FROM departments d
        LEFT JOIN students s ON d.department_id = s.department_id
        LEFT JOIN courses c ON d.department_id = c.department_id
        LEFT JOIN faculty f ON d.department_id = f.department_id
        LEFT JOIN enrollments e ON s.student_id = e.student_id
        LEFT JOIN exam_grades eg ON e.enrollment_id = eg.enrollment_id
        GROUP BY d.department_id, d.department_name
        ORDER BY avg_performance DESC
      `;
      const data = await executeQuery(query);
      return NextResponse.json({ success: true, report: 'department-analytics', data });
    }

    if (reportType === 'attendance-analysis') {
      const query = `
        SELECT
          s.student_id,
          s.first_name,
          s.last_name,
          c.course_name,
          COUNT(a.attendance_id) as total_classes,
          SUM(CASE WHEN a.is_present = true THEN 1 ELSE 0 END) as present_count,
          ROUND((SUM(CASE WHEN a.is_present = true THEN 1 ELSE 0 END)::numeric /
            COUNT(a.attendance_id) * 100), 2) as attendance_percentage
        FROM students s
        JOIN enrollments e ON s.student_id = e.student_id
        JOIN courses c ON e.course_id = c.course_id
        LEFT JOIN attendance a ON e.enrollment_id = a.enrollment_id
        GROUP BY s.student_id, s.first_name, s.last_name, c.course_name
        ORDER BY attendance_percentage DESC
      `;
      const data = await executeQuery(query);
      return NextResponse.json({ success: true, report: 'attendance-analysis', data });
    }

    // Default summary report
    const summaryQuery = `
      SELECT
        'total_students' as metric,
        (SELECT COUNT(*) FROM students)::text as value
      UNION ALL
      SELECT 'total_courses', (SELECT COUNT(*) FROM courses)::text
      UNION ALL
      SELECT 'total_faculty', (SELECT COUNT(*) FROM faculty)::text
      UNION ALL
      SELECT 'total_enrollments', (SELECT COUNT(*) FROM enrollments)::text
      UNION ALL
      SELECT 'avg_course_capacity_used',
        ROUND((SELECT AVG(enrolled_count::numeric / capacity * 100) FROM (
          SELECT COUNT(*) as enrolled_count, c.capacity
          FROM enrollments e
          JOIN courses c ON e.course_id = c.course_id
          GROUP BY c.course_id, c.capacity
        ) subq), 2)::text
    `;

    const data = await executeQuery(summaryQuery);
    return NextResponse.json({ success: true, report: 'summary', data });

  } catch (error: any) {
    console.error('PowerBI reports error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
