import { NextRequest, NextResponse } from 'next/server';
import { getLinkAnalytics } from '@/lib/api/links';
import { verifyToken, extractTokenFromHeader } from '@/lib/utils/auth';

export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get('link_id');

    if (!linkId) {
      return NextResponse.json(
        { error: 'link_id is required' },
        { status: 400 }
      );
    }

    const analytics = await getLinkAnalytics(linkId);

    if (!analytics) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Link analytics retrieved',
      analytics,
    });
  } catch (error: any) {
    console.error('Error fetching link analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch link analytics' },
      { status: 500 }
    );
  }
}
