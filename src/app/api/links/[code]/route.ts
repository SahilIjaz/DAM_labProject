import { NextRequest, NextResponse } from 'next/server';
import { getSharedData, getLinkAnalytics } from '@/lib/api/links';

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json(
        { error: 'Link code is required' },
        { status: 400 }
      );
    }

    const sharedData = await getSharedData(code);

    if (!sharedData) {
      return NextResponse.json(
        { error: 'Link not found or has expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Shared data retrieved',
      data: sharedData,
    });
  } catch (error: any) {
    console.error('Error fetching shared data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch shared data' },
      { status: 500 }
    );
  }
}
