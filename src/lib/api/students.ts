import { executeQuery, executeTransaction } from '../db/mysql';
import { Student, Enrollment, ExamResult } from '../types';

export async function getStudents(
  limit: number = 50,
  offset: number = 0
): Promise<Student[]> {
  const query = `
    SELECT u.*, s.* FROM students s
    JOIN users u ON s.user_id = u.user_id
    WHERE s.status = 'active'
    LIMIT ? OFFSET ?
  `;
  return executeQuery<Student>(query, [limit, offset]);
}

export async function getStudentById(studentId: number): Promise<Student | null> {
  const query = `
    SELECT u.*, s.* FROM students s
    JOIN users u ON s.user_id = u.user_id
    WHERE s.student_id = ?
  `;
  const results = await executeQuery<Student>(query, [studentId]);
  return results[0] || null;
}

export async function getStudentByUserId(userId: number): Promise<Student | null> {
  const query = `
    SELECT u.*, s.* FROM students s
    JOIN users u ON s.user_id = u.user_id
    WHERE s.user_id = ?
  `;
  const results = await executeQuery<Student>(query, [userId]);
  return results[0] || null;
}

export async function getStudentEnrollments(
  studentId: number
): Promise<Enrollment[]> {
  const query = `
    SELECT * FROM enrollments
    WHERE student_id = ? AND status = 'enrolled'
  `;
  return executeQuery<Enrollment>(query, [studentId]);
}

export async function getStudentExamResults(studentId: number): Promise<any[]> {
  const query = `
    SELECT er.*, e.course_id, c.course_name FROM exam_results er
    JOIN enrollments e ON er.enrollment_id = e.enrollment_id
    JOIN courses c ON e.course_id = c.course_id
    WHERE e.student_id = ?
    ORDER BY er.exam_date DESC
  `;
  return executeQuery(query, [studentId]);
}

export async function getStudentGPA(studentId: number): Promise<number> {
  const query = `
    SELECT AVG(percentage) / 20 as gpa FROM exam_results
    WHERE enrollment_id IN (
      SELECT enrollment_id FROM enrollments WHERE student_id = ?
    )
  `;
  const results = await executeQuery<{ gpa: number }>(query, [studentId]);
  return results[0]?.gpa || 0;
}

export async function enrollStudent(
  studentId: number,
  courseId: number,
  semester: number
): Promise<{ enrollment_id: number; status: string }> {
  return executeTransaction(async (connection) => {
    const query = `
      INSERT INTO enrollments (student_id, course_id, semester, enrollment_date, status)
      VALUES (?, ?, ?, CURDATE(), 'enrolled')
    `;
    const result = await connection.execute(query, [studentId, courseId, semester]);
    return {
      enrollment_id: result[0].insertId,
      status: 'success',
    };
  });
}

export async function updateStudentGPA(studentId: number): Promise<void> {
  const gpa = await getStudentGPA(studentId);
  const query = `UPDATE students SET gpa = ? WHERE student_id = ?`;
  await executeQuery(query, [gpa, studentId]);
}

export async function getStudentsByDepartment(
  departmentId: number
): Promise<Student[]> {
  const query = `
    SELECT u.*, s.* FROM students s
    JOIN users u ON s.user_id = u.user_id
    WHERE s.department_id = ? AND s.status = 'active'
  `;
  return executeQuery<Student>(query, [departmentId]);
}

export async function getStudentsByCampus(campusId: number): Promise<Student[]> {
  const query = `
    SELECT u.*, s.* FROM students s
    JOIN users u ON s.user_id = u.user_id
    JOIN departments d ON s.department_id = d.department_id
    WHERE d.campus_id = ? AND s.status = 'active'
  `;
  return executeQuery<Student>(query, [campusId]);
}

export async function searchStudents(searchTerm: string): Promise<Student[]> {
  const query = `
    SELECT u.*, s.* FROM students s
    JOIN users u ON s.user_id = u.user_id
    WHERE (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR s.enrollment_id LIKE ?)
    AND s.status = 'active'
  `;
  const term = `%${searchTerm}%`;
  return executeQuery<Student>(query, [term, term, term, term]);
}
