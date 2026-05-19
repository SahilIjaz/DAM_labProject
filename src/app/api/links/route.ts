import { NextRequest, NextResponse } from 'next/server';
import {
  createShareLink,
  getUserShareLinks,
  deleteShareLink,
} from '@/lib/api/links';
import { verifyToken } from '@/lib/utils/auth';
import { extractTokenFromHeader } from '@/lib/utils/auth';

export async function POST(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const {
      data_type,
      data_id,
      access_level = 'view',
      expires_at,
      max_views,
      is_public = false,
    } = body;

    if (!data_type || !data_id) {
      return NextResponse.json(
        { error: 'data_type and data_id are required' },
        { status: 400 }
      );
    }

    const link = await createShareLink(
      payload.user_id,
      data_type,
      data_id,
      access_level,
      expires_at ? new Date(expires_at) : undefined,
      max_views,
      is_public
    );

    if (!link) {
      return NextResponse.json(
        { error: 'Failed to create share link' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Share link created',
        link,
        share_url: `${process.env.NEXT_PUBLIC_API_URL}/shares/${link.link_code}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create share link' },
      { status: 500 }
    );
  }
}

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

    const links = await getUserShareLinks(payload.user_id);

    return NextResponse.json({
      message: 'User share links retrieved',
      count: links.length,
      links,
    });
  } catch (error: any) {
    console.error('Error fetching share links:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch share links' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { link_id } = body;

    if (!link_id) {
      return NextResponse.json(
        { error: 'link_id is required' },
        { status: 400 }
      );
    }

    const success = await deleteShareLink(link_id);

    if (!success) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Share link deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting share link:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete share link' },
      { status: 500 }
    );
  }
}
