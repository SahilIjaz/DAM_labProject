import { NextRequest, NextResponse } from 'next/server';
import { getCourseById } from '@/lib/api/courses';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = parseInt(params.id);

    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const course = await getCourseById(courseId);

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch course' },
      { status: 500 }
    );
  }
}
