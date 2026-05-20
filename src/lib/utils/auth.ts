import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { User, AuthToken } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

export function generateToken(user: Partial<User>): AuthToken {
  const token = jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role_id: user.role_id,
      username: user.username,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRE,
    }
  );

  return {
    token,
    expires_in: calculateExpiresIn(JWT_EXPIRE),
    token_type: 'Bearer',
  };
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10);
}

export async function comparePasswords(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export function extractTokenFromHeader(authHeader: string): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

export function decodeToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

function calculateExpiresIn(expireString: string): number {
  if (!expireString) return 604800;

  const timeUnits: Record<string, number> = {
    d: 86400,
    h: 3600,
    m: 60,
    s: 1,
  };

  const match = expireString.match(/^(\d+)([a-z])$/);
  if (!match) return 604800;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  return value * (timeUnits[unit] || 86400);
}

export interface TokenPayload {
  user_id: number;
  email: string;
  role_id: number;
  username: string;
  iat?: number;
  exp?: number;
}
