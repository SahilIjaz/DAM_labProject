import { NextRequest, NextResponse } from 'next/server';
import { getDepartments } from '@/lib/api/departments';

export async function GET(request: NextRequest) {
  try {
    const departments = await getDepartments();
    return NextResponse.json({
      success: true,
      data: departments,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}
