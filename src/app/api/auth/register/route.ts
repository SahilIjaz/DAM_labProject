import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/utils/auth';
import { callProcedure } from '@/lib/db/mysql';

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

    console.log('Registering user:', {
      email,
      username,
      hashLength: hashedPassword.length,
      hashPrefix: hashedPassword.substring(0, 20),
    });

    const result = await callProcedure(
      'sp_create_user',
      [
        username,
        email,
        hashedPassword,
        firstName,
        lastName,
        roleId || 7,
        departmentId || null,
        campusId || 1,
      ],
      2
    );

    console.log('Procedure result:', result);

    if (!result || result.status === 'failed') {
      return NextResponse.json(
        { error: result?.message || 'Registration failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      user_id: result.user_id,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
