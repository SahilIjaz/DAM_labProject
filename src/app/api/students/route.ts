import { NextRequest, NextResponse } from 'next/server';
import {
  getStudents,
  getStudentsByDepartment,
  getStudentsByCampus,
  searchStudents,
} from '@/lib/api/students';
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
    const campusId = searchParams.get('campusId');

    let data;
    if (search) {
      data = await searchStudents(search);
    } else if (departmentId) {
      data = await getStudentsByDepartment(parseInt(departmentId));
    } else if (campusId) {
      data = await getStudentsByCampus(parseInt(campusId));
    } else {
      data = await getStudents(limit, offset);
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Students API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
