import { NextRequest, NextResponse } from 'next/server';
import {
  getExamResults,
  createExamResult,
  getExamResultsByStudent,
  getExamResultsByCourse,
  getGradeDistribution,
} from '@/lib/api/exams';
import { requireAuth } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enrollmentId, examDate, percentage, examType } = await request.json();

    if (!enrollmentId || !examDate || percentage === undefined) {
      return NextResponse.json(
        { error: 'enrollmentId, examDate, and percentage are required' },
        { status: 400 }
      );
    }

    const result = await createExamResult(
      enrollmentId,
      examDate,
      percentage,
      examType || 'final'
    );

    return NextResponse.json({
      success: true,
      exam: result,
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');

    let data;
    if (studentId) {
      data = await getExamResultsByStudent(parseInt(studentId));
    } else if (courseId) {
      data = await getExamResultsByCourse(parseInt(courseId));
    } else {
      data = await getExamResults(limit, offset);
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
