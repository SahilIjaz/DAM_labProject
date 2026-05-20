import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { comparePasswords, hashPassword } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }


    const userQuery = `SELECT * FROM users WHERE email = ?`;
    const userResults = await executeQuery(userQuery, [email]);

    if (userResults.length === 0) {
      return NextResponse.json({
        found: false,
        message: 'User not found in database',
        email,
      });
    }

    const user = userResults[0];
    const storedHash = user.password_hash;


    const hashInfo = {
      email: user.email,
      hashExists: !!storedHash,
      hashLength: storedHash ? storedHash.length : 0,
      hashPrefix: storedHash ? storedHash.substring(0, 10) : null,
      hashSample: storedHash ? storedHash.substring(0, 20) + '...' : null,
    };


    let comparisonResult = null;
    let comparisonError = null;
    try {
      comparisonResult = await comparePasswords(password, storedHash);
    } catch (error: any) {
      comparisonError = error.message;
    }


    let hashedInputPassword = null;
    try {
      hashedInputPassword = await hashPassword(password);
    } catch (error: any) {
      console.error('Error hashing input password:', error);
    }

    return NextResponse.json({
      found: true,
      email: user.email,
      userId: user.user_id,
      userStatus: user.status,
      hashInfo,
      passwordComparison: {
        inputPassword: password,
        comparisonResult,
        comparisonError,
        storedHashTruncated: storedHash ? storedHash.substring(0, 50) + '...' : null,
      },
      testHash: {
        newHashOfInputPassword: hashedInputPassword ? hashedInputPassword.substring(0, 50) + '...' : null,
      },
      advice: comparisonResult
        ? 'Password matches - login should work'
        : 'Password does NOT match - check if hash was stored correctly during registration',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error', stack: error.stack },
      { status: 500 }
    );
  }
}
