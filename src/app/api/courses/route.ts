import { NextRequest, NextResponse } from 'next/server';
import {
  getCourses,
  getCoursesByDepartment,
  getCoursesByFaculty,
  searchCourses,
  getAvailableCourses,
} from '@/lib/api/courses';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const departmentId = searchParams.get('departmentId');
    const facultyId = searchParams.get('facultyId');
    const availableOnly = searchParams.get('availableOnly') === 'true';

    let data;
    if (search) {
      data = await searchCourses(search);
    } else if (departmentId) {
      data = await getCoursesByDepartment(parseInt(departmentId));
    } else if (facultyId) {
      data = await getCoursesByFaculty(parseInt(facultyId));
    } else if (availableOnly) {
      data = await getAvailableCourses(limit);
    } else {
      data = await getCourses(limit, offset);
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
