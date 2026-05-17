import { NextRequest, NextResponse } from 'next/server';
import { getStudentGrades, updateStudentGrade, getClassGrades } from '@/lib/api/grades';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');
    const semester = searchParams.get('semester');

    if (studentId) {
      const grades = await getStudentGrades(parseInt(studentId));
      return NextResponse.json(grades);
    }

    if (courseId && semester) {
      const grades = await getClassGrades(parseInt(courseId), parseInt(semester));
      return NextResponse.json(grades);
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { enrollmentId, grade } = await request.json();
    const result = await updateStudentGrade(enrollmentId, grade);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
