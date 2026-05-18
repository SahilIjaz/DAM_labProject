import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { executeQuery } from '@/lib/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const courseId = searchParams.get('courseId');

    let query = `
      SELECT
        e.exam_id,
        e.course_id,
        c.course_name,
        e.exam_name,
        e.exam_date,
        e.duration,
        e.total_marks,
        e.passing_marks,
        e.exam_type
      FROM exams e
      LEFT JOIN courses c ON e.course_id = c.course_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (courseId) {
      query += ` AND e.course_id = ?`;
      params.push(parseInt(courseId));
    }

    query += ` ORDER BY e.exam_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const results = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}
