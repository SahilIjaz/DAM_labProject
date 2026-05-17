import { NextRequest, NextResponse } from 'next/server';
import {
  getStudentSchedule,
  getFacultySchedule,
  getSemesterCourses,
} from '@/lib/api/schedule';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const semester = searchParams.get('semester');

    if (!type || !id || !semester) {
      return NextResponse.json(
        { error: 'Type, ID, and semester are required' },
        { status: 400 }
      );
    }

    let schedule;

    switch (type) {
      case 'student':
        schedule = await getStudentSchedule(parseInt(id), parseInt(semester));
        break;
      case 'faculty':
        schedule = await getFacultySchedule(parseInt(id), parseInt(semester));
        break;
      case 'department':
        schedule = await getSemesterCourses(parseInt(id), parseInt(semester));
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid schedule type' },
          { status: 400 }
        );
    }

    return NextResponse.json(schedule);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}
