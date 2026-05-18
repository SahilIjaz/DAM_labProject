import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

export async function POST(request: NextRequest) {
  try {
    // Delete all exams
    await executeQuery('DELETE FROM exams', []);

    // Delete sample courses
    await executeQuery(
      'DELETE FROM courses WHERE course_code IN (?, ?, ?, ?)',
      ['MATH101', 'PHYS101', 'CHEM101', 'ENG101']
    );

    return NextResponse.json({
      success: true,
      message: 'Dummy data removed successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to cleanup data' },
      { status: 500 }
    );
  }
}
