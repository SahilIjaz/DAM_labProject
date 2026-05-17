import { NextRequest, NextResponse } from 'next/server';
import { generateToken, hashPassword, comparePasswords } from '@/lib/utils/auth';
import { callProcedure } from '@/lib/db/mysql';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await callProcedure('sp_validate_credentials', [email, password]);

    if (!result || result.status === 'failed') {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = result;
    const token = generateToken({
      user_id: user.user_id,
      email: user.email,
      role_id: user.role_id,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role_id: user.role_id,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
