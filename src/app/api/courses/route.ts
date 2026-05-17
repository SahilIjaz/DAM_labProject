import { NextRequest, NextResponse } from 'next/server';
import { getCourses, createCourse } from '@/lib/api/courses';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');

    const courses = await getCourses(departmentId ? parseInt(departmentId) : undefined);
    return NextResponse.json(courses);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { courseCode, courseName, departmentId, creditHours, capacity, semester } = await request.json();

    if (!courseCode || !courseName || !departmentId) {
      return NextResponse.json(
        { error: 'Course code, name, and department are required' },
        { status: 400 }
      );
    }

    const result = await createCourse(
      courseCode,
      courseName,
      departmentId,
      creditHours || 3,
      capacity || 50,
      semester || 1
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create course' },
      { status: 500 }
    );
  }
}
