import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { executeQuery } from '@/lib/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    // Get instructor's faculty/department info
    const instructorQuery = `
      SELECT f.faculty_id, f.department_id FROM faculty f
      WHERE f.user_id = ?
    `;
    const instructorResults = await executeQuery(instructorQuery, [decoded.user_id]);

    if (instructorResults.length === 0) {
      return NextResponse.json(
        { error: 'Instructor record not found' },
        { status: 404 }
      );
    }

    const { department_id } = instructorResults[0] as any;

    // Get all enrollments for courses in this department
    const enrollmentsQuery = `
      SELECT
        e.enrollment_id,
        e.student_id,
        e.course_id,
        e.semester,
        e.enrollment_date,
        e.status,
        e.grade,
        c.course_name,
        c.course_code,
        u.first_name,
        u.last_name,
        u.email,
        s.enrollment_id as student_enrollment_id
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      JOIN students s ON e.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      WHERE c.department_id = ?
      ORDER BY c.course_code, u.last_name, u.first_name
    `;

    const enrollments = await executeQuery(enrollmentsQuery, [department_id]);

    return NextResponse.json({
      success: true,
      data: enrollments,
      count: enrollments.length,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}
