import { executeQuery, executeTransaction, callProcedure } from '../db/mysql';
import { User, Student, Faculty, Course, Department, Campus } from '../types';

export async function getAllUsers(
  limit: number = 50,
  offset: number = 0
): Promise<User[]> {
  const query = `
    SELECT * FROM users
    LIMIT ? OFFSET ?
  `;
  return executeQuery<User>(query, [limit, offset]);
}

export async function getUserById(userId: number): Promise<User | null> {
  const query = `SELECT * FROM users WHERE user_id = ?`;
  const results = await executeQuery<User>(query, [userId]);
  return results[0] || null;
}

export async function getUsersByRole(roleId: number): Promise<User[]> {
  const query = `SELECT * FROM users WHERE role_id = ?`;
  return executeQuery<User>(query, [roleId]);
}

export async function createUser(
  email: string,
  firstName: string,
  lastName: string,
  password: string,
  roleId: number,
  departmentId?: number,
  campusId: number = 1
): Promise<{ user_id: number; status: string }> {
  const username = email.split('@')[0];
  return callProcedure(
    'sp_create_user',
    [
      username,
      email,
      password,
      firstName,
      lastName,
      roleId,
      departmentId || null,
      campusId,
    ],
    2
  );
}

export async function updateUserStatus(
  userId: number,
  status: 'active' | 'inactive' | 'suspended'
): Promise<void> {
  const query = `UPDATE users SET status = ? WHERE user_id = ?`;
  await executeQuery(query, [status, userId]);
}

export async function updateUserRole(userId: number, roleId: number): Promise<void> {
  const query = `UPDATE users SET role_id = ? WHERE user_id = ?`;
  await executeQuery(query, [roleId, userId]);
}

export async function getDepartments(): Promise<Department[]> {
  const query = `SELECT * FROM departments ORDER BY department_name`;
  return executeQuery<Department>(query, []);
}

export async function getDepartmentById(departmentId: number): Promise<Department | null> {
  const query = `SELECT * FROM departments WHERE department_id = ?`;
  const results = await executeQuery<Department>(query, [departmentId]);
  return results[0] || null;
}

export async function createDepartment(
  departmentName: string,
  campusId: number,
  headId?: number
): Promise<{ department_id: number; status: string }> {
  return executeTransaction(async (connection) => {
    const query = `
      INSERT INTO departments (department_name, campus_id, department_head_id)
      VALUES (?, ?, ?)
    `;
    const result = await connection.execute(query, [departmentName, campusId, headId || null]);
    return {
      department_id: result[0].insertId,
      status: 'created',
    };
  });
}

export async function getCampuses(): Promise<Campus[]> {
  const query = `SELECT * FROM campuses ORDER BY campus_name`;
  return executeQuery<Campus>(query, []);
}

export async function getCampusById(campusId: number): Promise<Campus | null> {
  const query = `SELECT * FROM campuses WHERE campus_id = ?`;
  const results = await executeQuery<Campus>(query, [campusId]);
  return results[0] || null;
}

export async function createCampus(
  campusName: string,
  location: string,
  replicationType: 'master' | 'slave'
): Promise<{ campus_id: number; status: string }> {
  return executeTransaction(async (connection) => {
    const query = `
      INSERT INTO campuses (campus_name, location, replication_type)
      VALUES (?, ?, ?)
    `;
    const result = await connection.execute(query, [campusName, location, replicationType]);
    return {
      campus_id: result[0].insertId,
      status: 'created',
    };
  });
}

export async function getSystemStatistics(): Promise<any> {
  const query = `
    SELECT
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM students WHERE status = 'active') as active_students,
      (SELECT COUNT(*) FROM faculty WHERE status = 'active') as active_faculty,
      (SELECT COUNT(*) FROM courses) as total_courses,
      (SELECT COUNT(*) FROM enrollments WHERE status = 'enrolled') as active_enrollments,
      (SELECT AVG(gpa) FROM students WHERE status = 'active') as avg_student_gpa,
      (SELECT COUNT(*) FROM campuses) as total_campuses,
      (SELECT COUNT(*) FROM departments) as total_departments
  `;
  const results = await executeQuery(query, []);
  return results[0] || null;
}

export async function getRecentAuditLogs(limit: number = 100): Promise<any[]> {
  const query = `
    SELECT * FROM audit_logs_temp
    ORDER BY created_at DESC
    LIMIT ?
  `;
  return executeQuery(query, [limit]);
}

export async function searchAuditLogs(
  userId?: number,
  action?: string,
  limit: number = 50
): Promise<any[]> {
  let query = `SELECT * FROM audit_logs_temp WHERE 1=1`;
  const params: any[] = [];

  if (userId) {
    query += ` AND user_id = ?`;
    params.push(userId);
  }

  if (action) {
    query += ` AND action LIKE ?`;
    params.push(`%${action}%`);
  }

  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  return executeQuery(query, params);
}

export async function transferStudent(
  studentId: number,
  newDepartmentId: number
): Promise<{ status: string }> {
  return callProcedure('sp_transfer_student', [studentId, newDepartmentId], 2);
}

export async function deleteStudent(studentId: number): Promise<{ status: string }> {
  return callProcedure('sp_delete_student', [studentId], 1);
}

export async function getUserRoleDistribution(): Promise<any[]> {
  const query = `
    SELECT r.role_id, r.role_name, COUNT(u.user_id) as user_count
    FROM roles r
    LEFT JOIN users u ON r.role_id = u.role_id
    GROUP BY r.role_id, r.role_name
    ORDER BY user_count DESC
  `;
  return executeQuery(query, []);
}

export async function getDepartmentStatistics(departmentId: number): Promise<any> {
  const query = `
    SELECT
      d.department_id,
      d.department_name,
      COUNT(DISTINCT s.student_id) as student_count,
      COUNT(DISTINCT f.faculty_id) as faculty_count,
      COUNT(DISTINCT c.course_id) as course_count,
      AVG(s.gpa) as avg_student_gpa
    FROM departments d
    LEFT JOIN students s ON d.department_id = s.department_id
    LEFT JOIN faculty f ON d.department_id = f.department_id
    LEFT JOIN courses c ON d.department_id = c.department_id
    WHERE d.department_id = ?
    GROUP BY d.department_id, d.department_name
  `;
  const results = await executeQuery(query, [departmentId]);
  return results[0] || null;
}
