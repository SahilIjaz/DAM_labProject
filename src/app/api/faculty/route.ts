import { NextRequest, NextResponse } from 'next/server';
import {
  getFaculty,
  getFacultyByDepartment,
  getFacultyByCampus,
  searchFaculty,
} from '@/lib/api/faculty';
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
      data = await searchFaculty(search);
    } else if (departmentId) {
      data = await getFacultyByDepartment(parseInt(departmentId));
    } else if (campusId) {
      data = await getFacultyByCampus(parseInt(campusId));
    } else {
      data = await getFaculty(limit, offset);
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
