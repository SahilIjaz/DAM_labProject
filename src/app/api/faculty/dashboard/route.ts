import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { getFacultyByUserId, getFacultyDashboardData } from '@/lib/api/faculty';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow faculty members (role_id 4, 5, 6)
    if (![4, 5, 6].includes(user.role_id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get faculty member's department
    const faculty = await getFacultyByUserId(user.user_id);
    if (!faculty) {
      return NextResponse.json({ error: 'Faculty record not found' }, { status: 404 });
    }

    // Fetch dashboard data for the faculty's department
    const dashboardData = await getFacultyDashboardData(faculty.department_id);

    return NextResponse.json({
      data: dashboardData,
    });
  } catch (error: any) {
    console.error('Faculty dashboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch faculty dashboard' },
      { status: 500 }
    );
  }
}
