import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const instructors = await executeQuery(
      'SELECT u.user_id, u.email, u.first_name, u.role_id, f.faculty_id FROM users u LEFT JOIN faculty f ON u.user_id = f.user_id WHERE u.role_id = 6 LIMIT 10'
    );

    return NextResponse.json({
      instructors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
