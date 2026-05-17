import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader, TokenPayload } from '../utils/auth';

export interface AuthenticatedRequest {
  user?: TokenPayload;
  headers: Record<string, string> | any;
  [key: string]: any;
}

export function authenticateToken(
  req: AuthenticatedRequest | NextRequest
): TokenPayload | null {
  let authHeader: string | null = null;

  if (req.headers instanceof Headers) {
    authHeader = req.headers.get('authorization') || '';
  } else if (typeof req.headers.get === 'function') {
    authHeader = req.headers.get('authorization') || '';
  } else {
    authHeader = (req.headers as any).authorization || '';
  }

  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  try {
    const decoded = verifyToken(token);
    return decoded as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(req: AuthenticatedRequest | NextRequest): Promise<TokenPayload | null> {
  const user = authenticateToken(req);
  if (!user) {
    return null;
  }
  if (typeof req === 'object' && 'user' in req) {
    (req as any).user = user;
  }
  return user;
}

export function requireRole(req: AuthenticatedRequest, roleIds: number[]): boolean {
  const user = authenticateToken(req);
  if (!user) {
    return false;
  }

  if (!roleIds.includes(user.role_id)) {
    return false;
  }

  req.user = user;
  return true;
}

export const ROLE_IDS = {
  SUPER_ADMIN: 1,
  DBA: 2,
  SYSTEM_ADMIN: 3,
  FACULTY: 4,
  DEPARTMENT_HEAD: 5,
  INSTRUCTOR: 6,
  STUDENT: 7,
  SUPPORT_STAFF: 8,
  DATA_ENTRY: 9,
  GUEST: 10,
};
