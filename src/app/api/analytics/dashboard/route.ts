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

    const statsQuery = `SELECT * FROM v_system_health_stats LIMIT 1`;
    const stats = await executeQuery(statsQuery);

    const enrollmentQuery = `SELECT * FROM v_course_enrollment_analytics LIMIT 10`;
    const enrollmentData = await executeQuery(enrollmentQuery);

    const performanceQuery = `SELECT * FROM v_student_performance_analytics LIMIT 10`;
    const performanceData = await executeQuery(performanceQuery);

    const facultyQuery = `SELECT * FROM v_faculty_workload_analytics LIMIT 10`;
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
