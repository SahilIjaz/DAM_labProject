import { NextRequest, NextResponse } from 'next/server';
import {
  getStudentPerformanceReport,
  getDepartmentPerformanceReport,
  getCourseEnrollmentReport,
  getCampusWideReport,
} from '@/lib/api/reports';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type) {
      return NextResponse.json(
        { error: 'Report type is required' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'student':
        if (!id) throw new Error('Student ID required');
        result = await getStudentPerformanceReport(parseInt(id));
        break;
      case 'department':
        if (!id) throw new Error('Department ID required');
        result = await getDepartmentPerformanceReport(parseInt(id));
        break;
      case 'course':
        if (!id) throw new Error('Course ID required');
        result = await getCourseEnrollmentReport(parseInt(id));
        break;
      case 'campus-wide':
        result = await getCampusWideReport();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
