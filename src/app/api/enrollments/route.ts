import { NextRequest, NextResponse } from 'next/server';
import { enrollStudent, getStudentEnrollments } from '@/lib/api/students';
import { getCourseEnrollments } from '@/lib/api/courses';
import { requireAuth, requireRole } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, courseId, semester } = await request.json();

    if (!studentId || !courseId || !semester) {
      return NextResponse.json(
        { error: 'StudentId, courseId, and semester are required' },
        { status: 400 }
      );
    }

    const result = await enrollStudent(studentId, courseId, semester);

    return NextResponse.json({
      success: true,
      enrollment: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');

    if (studentId) {
      const data = await getStudentEnrollments(parseInt(studentId));
      return NextResponse.json({
        success: true,
        data,
      });
    } else if (courseId) {
      const data = await getCourseEnrollments(parseInt(courseId));
      return NextResponse.json({
        success: true,
        data,
      });
    }

    return NextResponse.json(
      { error: 'studentId or courseId parameter is required' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
