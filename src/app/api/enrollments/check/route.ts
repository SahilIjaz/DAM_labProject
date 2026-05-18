import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { checkEnrollment } from '@/lib/api/enrollments';
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
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const studentResults = await executeQuery(
      'SELECT student_id FROM students WHERE user_id = ?',
      [decoded.user_id]
    );

    if (studentResults.length === 0) {
      return NextResponse.json(
        { error: 'Student record not found' },
        { status: 404 }
      );
    }

    const studentId = (studentResults[0] as any).student_id;

    const enrolled = await checkEnrollment(studentId, parseInt(courseId));

    return NextResponse.json({
      success: true,
      enrolled,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to check enrollment' },
      { status: 500 }
    );
  }
}
