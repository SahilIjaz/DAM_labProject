import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { getFacultyById } from '@/lib/api/faculty';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const facultyId = parseInt(params.id);
    const faculty = await getFacultyById(facultyId);

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: faculty,
    });
  } catch (error: any) {
    console.error('Faculty profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch faculty profile' },
      { status: 500 }
    );
  }
}
