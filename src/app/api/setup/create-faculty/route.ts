import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

export async function POST(request: NextRequest) {
  try {

    const usersWithoutFaculty = await executeQuery(`
      SELECT u.user_id, u.department_id
      FROM users u
      WHERE u.role_id IN (4, 5, 6)
        AND u.user_id NOT IN (SELECT DISTINCT user_id FROM faculty)
    `);

    if (usersWithoutFaculty.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All faculty users already have faculty records',
        created: 0,
      });
    }


    let created = 0;
    for (const user of usersWithoutFaculty) {
      try {

        const departmentId = (user as any).department_id || 1;
        await executeQuery(
          `INSERT INTO faculty (user_id, department_id, status)
           VALUES (?, ?, 'active')`,
          [user.user_id, departmentId]
        );
        created++;
      } catch (error: any) {
        console.warn(`Failed to create faculty record for user ${user.user_id}:`, error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created} faculty records`,
      created,
      totalUsers: usersWithoutFaculty.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create faculty records' },
      { status: 500 }
    );
  }
}
