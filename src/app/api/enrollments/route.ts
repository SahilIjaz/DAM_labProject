import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createEnrollment, checkEnrollment } from '@/lib/api/enrollments';
import { executeQuery } from '@/lib/db/mysql';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const { courseId, semester } = await request.json();

    if (!courseId || !semester) {
      return NextResponse.json(
        { error: 'Course ID and semester are required' },
        { status: 400 }
      );
    }

    const studentResults = await executeQuery(
      'SELECT student_id FROM students WHERE user_id = ?',
      [decoded.user_id]
    );

    // Use student_id if exists, otherwise use user_id directly
    const studentId = studentResults.length > 0
      ? (studentResults[0] as any).student_id
      : decoded.user_id;

    const isAlreadyEnrolled = await checkEnrollment(studentId, courseId);
    if (isAlreadyEnrolled) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    const result = await createEnrollment(studentId, courseId, semester);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to enroll' },
      { status: 500 }
    );
  }
}
