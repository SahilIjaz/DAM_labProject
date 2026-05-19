import { Router, Request, Response } from 'express';
import { executeQuery } from './db.js';
import {
  hashPassword,
  comparePasswords,
  generateToken,
  verifyToken,
  extractTokenFromHeader,
} from '../../shared/auth.js';
import { User, TokenPayload } from '../../shared/types.js';

const router = Router();

interface LoginRequest {
  username: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role_id: number;
}

router.post<{}, any, LoginRequest>('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const users = await executeQuery<User>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isPasswordValid = await comparePasswords(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
    });

    return res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (error: any) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: error.message || 'Login failed' });
  }
});

router.post<{}, any, RegisterRequest>('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, first_name, last_name, role_id } = req.body;

    if (!username || !email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existingUsers = await executeQuery<User>(
      'SELECT user_id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const password_hash = await hashPassword(password);

    await executeQuery(
      'INSERT INTO users (username, email, password_hash, role_id, first_name, last_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email, password_hash, role_id || 7, first_name, last_name, 'active']
    );

    const newUsers = await executeQuery<User>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (newUsers.length === 0) {
      return res.status(500).json({ error: 'User creation failed' });
    }

    const user = newUsers[0];
    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
    });

    return res.status(201).json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

router.get<{}, any>('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization as string | null;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    return res.json({ valid: true, user: payload });
  } catch (error: any) {
    console.error('Verify error:', error);
    return res.status(500).json({ error: error.message || 'Verification failed' });
  }
});

router.get<{}, any>('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

export default router;
