import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { getSystemStatistics } from '@/lib/api/admin';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getSystemStatistics();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
