import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/utils/auth';
import { callProcedure, executeQuery } from '@/lib/db/mysql';

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, password, roleId, departmentId, campusId } =
      await request.json();

    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: 'Email, first name, last name, and password are required' },
        { status: 400 }
      );
    }

    const username = email.split('@')[0];
    const hashedPassword = await hashPassword(password);
    const finalRoleId = roleId || 7;

    const result = await callProcedure(
      'sp_create_user',
      [
        username,
        email,
        hashedPassword,
        firstName,
        lastName,
        finalRoleId,
        departmentId || null,
        campusId || 1,
      ],
      2
    );

    if (!result || result.status === 'failed') {
      return NextResponse.json(
        { error: result?.message || 'Registration failed' },
        { status: 400 }
      );
    }


    if ([4, 5, 6].includes(finalRoleId) && departmentId) {
      try {
        await executeQuery(
          `INSERT INTO faculty (user_id, department_id, status)
           VALUES (?, ?, 'active')`,
          [result.user_id, departmentId]
        );
      } catch (facultyError: any) {
        console.warn('Failed to create faculty record:', facultyError.message);

      }
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      user_id: result.user_id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
