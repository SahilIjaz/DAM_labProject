import { NextRequest, NextResponse } from 'next/server';
import { markAttendance, getAttendanceReport, getClassAttendance } from '@/lib/api/attendance';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');
    const semester = searchParams.get('semester');

    if (studentId) {
      const report = await getAttendanceReport(parseInt(studentId));
      return NextResponse.json(report);
    }

    if (courseId && semester) {
      const attendance = await getClassAttendance(parseInt(courseId), parseInt(semester));
      return NextResponse.json(attendance);
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { enrollmentId, date, status } = await request.json();
    const result = await markAttendance(enrollmentId, date, status);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
