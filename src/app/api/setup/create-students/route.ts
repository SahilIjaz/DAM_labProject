import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

export async function POST(request: NextRequest) {
  try {
    const studentUsers = await executeQuery(
      'SELECT u.user_id, u.department_id FROM users u WHERE u.role_id = 7 AND u.user_id NOT IN (SELECT DISTINCT user_id FROM students)'
    );

    if (studentUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All students already have records',
      });
    }

    for (const user of studentUsers as any[]) {
      const departmentId = user.department_id || 1;
      await executeQuery(
        'INSERT INTO students (user_id, department_id, enrollment_date, current_semester, status) VALUES (?, ?, NOW(), 1, "active")',
        [user.user_id, departmentId]
      );
    }

    return NextResponse.json({
      success: true,
      created: studentUsers.length,
      message: `Created student records for ${studentUsers.length} users`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
