import { NextRequest, NextResponse } from 'next/server';
import { getFacultyMembers, createFaculty } from '@/lib/api/faculty';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');

    const faculty = await getFacultyMembers(departmentId ? parseInt(departmentId) : undefined);
    return NextResponse.json(faculty);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch faculty' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, departmentId, qualification, specialization, hiringDate } = await request.json();

    if (!userId || !departmentId) {
      return NextResponse.json(
        { error: 'User ID and department are required' },
        { status: 400 }
      );
    }

    const result = await createFaculty(
      userId,
      departmentId,
      qualification || '',
      specialization || '',
      hiringDate || new Date().toISOString().split('T')[0]
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create faculty record' },
      { status: 500 }
    );
  }
}
