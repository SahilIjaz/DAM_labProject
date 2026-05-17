import { executeQuery } from '../db/mysql';
import { Faculty } from '../types';

export async function getFacultyMembers(departmentId?: number): Promise<Faculty[]> {
  if (departmentId) {
    const query = `
      SELECT f.*, u.first_name, u.last_name, u.email
      FROM faculty f
      JOIN users u ON f.user_id = u.user_id
      WHERE f.department_id = ? AND f.status = 'active'
      ORDER BY u.last_name
    `;
    return executeQuery<Faculty>(query, [departmentId]);
  }

  const query = `
    SELECT f.*, u.first_name, u.last_name, u.email
    FROM faculty f
    JOIN users u ON f.user_id = u.user_id
    WHERE f.status = 'active'
    ORDER BY u.last_name
  `;
  return executeQuery<Faculty>(query, []);
}

export async function getFacultyById(facultyId: number): Promise<Faculty | null> {
  const query = `
    SELECT f.*, u.first_name, u.last_name, u.email, u.username
    FROM faculty f
    JOIN users u ON f.user_id = u.user_id
    WHERE f.faculty_id = ?
  `;
  const results = await executeQuery<Faculty>(query, [facultyId]);
  return results[0] || null;
}

export async function getFacultyByUserId(userId: number): Promise<Faculty | null> {
  const query = `SELECT * FROM faculty WHERE user_id = ?`;
  const results = await executeQuery<Faculty>(query, [userId]);
  return results[0] || null;
}

export async function createFaculty(
  userId: number,
  departmentId: number,
  qualification: string,
  specialization: string,
  hiringDate: string
): Promise<{ faculty_id: number; status: string }> {
  const query = `
    INSERT INTO faculty (user_id, department_id, qualification, specialization, hiring_date, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `;
  const result = await executeQuery(query, [userId, departmentId, qualification, specialization, hiringDate]);
  return {
    faculty_id: (result as any).insertId,
    status: 'created',
  };
}

export async function updateFacultyStatus(facultyId: number, status: string): Promise<void> {
  const query = `UPDATE faculty SET status = ? WHERE faculty_id = ?`;
  await executeQuery(query, [status, facultyId]);
}

export async function getFacultyCourses(facultyId: number): Promise<any[]> {
  const query = `
    SELECT c.course_id, c.course_code, c.course_name, c.semester, c.capacity, c.credit_hours
    FROM courses c
    WHERE c.faculty_id = ?
    ORDER BY c.semester, c.course_code
  `;
  return executeQuery(query, [facultyId]);
}

export async function getFacultyWorkload(departmentId: number): Promise<any[]> {
  const query = `
    SELECT u.first_name, u.last_name, COUNT(c.course_id) as course_count, SUM(c.credit_hours) as total_credits
    FROM faculty f
    JOIN users u ON f.user_id = u.user_id
    LEFT JOIN courses c ON f.faculty_id = c.faculty_id
    WHERE f.department_id = ? AND f.status = 'active'
    GROUP BY f.faculty_id, u.first_name, u.last_name
    ORDER BY total_credits DESC
  `;
  return executeQuery(query, [departmentId]);
}
