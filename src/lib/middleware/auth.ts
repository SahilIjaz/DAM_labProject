import { verifyToken, extractTokenFromHeader, TokenPayload } from '../utils/auth';

export interface AuthenticatedRequest {
  user?: TokenPayload;
  headers: Record<string, string>;
  [key: string]: any;
}

export function authenticateToken(
  req: AuthenticatedRequest
): TokenPayload | null {
  const authHeader = req.headers.authorization as string;
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

export function requireAuth(req: AuthenticatedRequest): boolean {
  const user = authenticateToken(req);
  if (!user) {
    return false;
  }
  req.user = user;
  return true;
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
