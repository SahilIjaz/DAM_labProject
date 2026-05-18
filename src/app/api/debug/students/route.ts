import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const students = await executeQuery('SELECT * FROM students LIMIT 10');
    const studentUsers = await executeQuery(
      'SELECT u.user_id, u.email, u.role_id, s.student_id FROM users u LEFT JOIN students s ON u.user_id = s.user_id WHERE u.role_id = 7 LIMIT 10'
    );

    return NextResponse.json({
      students,
      studentUsers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
