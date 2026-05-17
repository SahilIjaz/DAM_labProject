import { NextRequest, NextResponse } from 'next/server';
import { getStudentEnrollments, enrollStudent, dropEnrollment } from '@/lib/api/enrollments';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const semester = searchParams.get('semester');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const enrollments = await getStudentEnrollments(parseInt(studentId));
    const filtered = semester
      ? enrollments.filter(e => e.semester === parseInt(semester))
      : enrollments;

    return NextResponse.json(filtered);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, courseId, semester } = await request.json();

    if (!studentId || !courseId || !semester) {
      return NextResponse.json(
        { error: 'Student ID, course ID, and semester are required' },
        { status: 400 }
      );
    }

    const result = await enrollStudent(studentId, courseId, semester);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Enrollment failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'Enrollment ID is required' },
        { status: 400 }
      );
    }

    await dropEnrollment(parseInt(enrollmentId));
    return NextResponse.json({ status: 'dropped' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to drop enrollment' },
      { status: 500 }
    );
  }
}
