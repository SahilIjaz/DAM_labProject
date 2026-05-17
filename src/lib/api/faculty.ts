import { executeQuery, executeTransaction } from '../db/mysql';
import { Faculty, Course, Student } from '../types';

export async function getFaculty(
  limit: number = 50,
  offset: number = 0
): Promise<Faculty[]> {
  const query = `
    SELECT u.*, f.* FROM faculty f
    JOIN users u ON f.user_id = u.user_id
    WHERE f.status = 'active'
    LIMIT ? OFFSET ?
  `;
  return executeQuery<Faculty>(query, [limit, offset]);
}

export async function getFacultyById(facultyId: number): Promise<Faculty | null> {
  const query = `
    SELECT u.*, f.* FROM faculty f
    JOIN users u ON f.user_id = u.user_id
    WHERE f.faculty_id = ?
  `;
  const results = await executeQuery<Faculty>(query, [facultyId]);
  return results[0] || null;
}

export async function getFacultyByUserId(userId: number): Promise<Faculty | null> {
  const query = `
    SELECT u.*, f.* FROM faculty f
    JOIN users u ON f.user_id = u.user_id
    WHERE f.user_id = ?
  `;
  const results = await executeQuery<Faculty>(query, [userId]);
  return results[0] || null;
}

export async function getFacultyCourses(facultyId: number): Promise<Course[]> {
  const query = `
    SELECT c.*, COUNT(e.enrollment_id) as enrollment_count
    FROM courses c
    LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'enrolled'
    WHERE c.faculty_id = ?
    GROUP BY c.course_id
  `;
  return executeQuery<Course>(query, [facultyId]);
}

export async function getFacultyByDepartment(
  departmentId: number
): Promise<Faculty[]> {
  const query = `
    SELECT u.*, f.* FROM faculty f
    JOIN users u ON f.user_id = u.user_id
    WHERE f.department_id = ? AND f.status = 'active'
  `;
  return executeQuery<Faculty>(query, [departmentId]);
}

export async function getFacultyByCampus(campusId: number): Promise<Faculty[]> {
  const query = `
    SELECT u.*, f.* FROM faculty f
    JOIN users u ON f.user_id = u.user_id
    JOIN departments d ON f.department_id = d.department_id
    WHERE d.campus_id = ? AND f.status = 'active'
  `;
  return executeQuery<Faculty>(query, [campusId]);
}

export async function searchFaculty(searchTerm: string): Promise<Faculty[]> {
  const query = `
    SELECT u.*, f.* FROM faculty f
    JOIN users u ON f.user_id = u.user_id
    WHERE (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR f.employee_id LIKE ?)
    AND f.status = 'active'
  `;
  const term = `%${searchTerm}%`;
  return executeQuery<Faculty>(query, [term, term, term, term]);
}

export async function getFacultyCourseStudents(
  facultyId: number,
  courseId: number
): Promise<Student[]> {
  const query = `
    SELECT u.*, s.* FROM students s
    JOIN users u ON s.user_id = u.user_id
    JOIN enrollments e ON s.student_id = e.student_id
    JOIN courses c ON e.course_id = c.course_id
    WHERE c.faculty_id = ? AND c.course_id = ? AND e.status = 'enrolled'
  `;
  return executeQuery<Student>(query, [facultyId, courseId]);
}

export async function updateFacultyStatus(
  facultyId: number,
  status: 'active' | 'inactive' | 'on_leave'
): Promise<void> {
  const query = `UPDATE faculty SET status = ? WHERE faculty_id = ?`;
  await executeQuery(query, [status, facultyId]);
}

export async function getFacultyStatistics(facultyId: number): Promise<any> {
  const query = `
    SELECT
      f.faculty_id,
      u.first_name,
      u.last_name,
      COUNT(DISTINCT c.course_id) as total_courses,
      COUNT(DISTINCT e.student_id) as total_students,
      AVG(er.percentage) as avg_student_performance
    FROM faculty f
    JOIN users u ON f.user_id = u.user_id
    LEFT JOIN courses c ON f.faculty_id = c.faculty_id
    LEFT JOIN enrollments e ON c.course_id = e.course_id
    LEFT JOIN exam_results er ON e.enrollment_id = er.enrollment_id
    WHERE f.faculty_id = ?
    GROUP BY f.faculty_id, u.first_name, u.last_name
  `;
  const results = await executeQuery(query, [facultyId]);
  return results[0] || null;
}
