import { NextRequest, NextResponse } from 'next/server';
import { getCourseById, updateCourse } from '@/lib/api/courses';
import { requireAuth } from '@/lib/middleware/auth';

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.role_id !== 8 && auth.role_id !== 9) {
      return NextResponse.json({ error: 'Only support staff can update courses' }, { status: 403 });
    }

    const courseId = parseInt(params.id);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { faculty_id } = body;

    if (faculty_id === undefined) {
      return NextResponse.json(
        { error: 'faculty_id is required' },
        { status: 400 }
      );
    }

    const result = await updateCourse(courseId, { faculty_id });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to update course' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Course update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update course' },
      { status: 500 }
    );
  }
}
