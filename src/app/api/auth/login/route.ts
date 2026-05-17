import { NextRequest, NextResponse } from 'next/server';
import { generateToken, comparePasswords } from '@/lib/utils/auth';
import { executeQuery } from '@/lib/db/mysql';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Fetch user from database
    const userQuery = `SELECT * FROM users WHERE email = ? AND status = 'active'`;
    const userResults = await executeQuery(userQuery, [email]);

    console.log('Login attempt:', { email, userFound: userResults.length > 0 });

    if (userResults.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = userResults[0];

    console.log('User found:', {
      email: user.email,
      userId: user.user_id,
      hashLength: user.password_hash ? user.password_hash.length : 0,
      hashPrefix: user.password_hash ? user.password_hash.substring(0, 20) : 'no hash',
    });

    // Compare passwords using bcrypt
    const isValidPassword = await comparePasswords(password, user.password_hash);

    console.log('Password comparison result:', isValidPassword);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login time
    await executeQuery('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
