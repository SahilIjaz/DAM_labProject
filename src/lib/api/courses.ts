import { executeQuery } from '../db/mysql';
import { Course, Enrollment } from '../types';

export async function getCourses(
  limit: number = 50,
  offset: number = 0
): Promise<Course[]> {
  const query = `
    SELECT c.*, COUNT(e.enrollment_id) as enrollment_count
    FROM courses c
    LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'enrolled'
    GROUP BY c.course_id
    LIMIT ? OFFSET ?
  `;
  return executeQuery<Course>(query, [limit, offset]);
}

export async function getCourseById(courseId: number): Promise<Course | null> {
  const query = `
    SELECT c.*, COUNT(e.enrollment_id) as enrollment_count
    FROM courses c
    LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'enrolled'
    WHERE c.course_id = ?
    GROUP BY c.course_id
  `;
  const results = await executeQuery<Course>(query, [courseId]);
  return results[0] || null;
}

export async function getCoursesByDepartment(
  departmentId: number
): Promise<Course[]> {
  const query = `
    SELECT c.*, COUNT(e.enrollment_id) as enrollment_count
    FROM courses c
    LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'enrolled'
    WHERE c.department_id = ?
    GROUP BY c.course_id
  `;
  return executeQuery<Course>(query, [departmentId]);
}

export async function getCoursesByFaculty(facultyId: number): Promise<Course[]> {
  const query = `
    SELECT c.*, COUNT(e.enrollment_id) as enrollment_count
    FROM courses c
    LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'enrolled'
    WHERE c.faculty_id = ?
    GROUP BY c.course_id
  `;
  return executeQuery<Course>(query, [facultyId]);
}

export async function getCourseEnrollments(courseId: number): Promise<Enrollment[]> {
  const query = `
    SELECT * FROM enrollments
    WHERE course_id = ? AND status = 'enrolled'
  `;
  return executeQuery<Enrollment>(query, [courseId]);
}

export async function getCourseBySemester(
  semester: number,
  departmentId?: number
): Promise<Course[]> {
  let query = `
    SELECT c.*, COUNT(e.enrollment_id) as enrollment_count
    FROM courses c
    LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'enrolled'
    WHERE c.semester = ?
  `;
  const params: any[] = [semester];

  if (departmentId) {
    query += ` AND c.department_id = ?`;
    params.push(departmentId);
  }

  query += ` GROUP BY c.course_id`;

  return executeQuery<Course>(query, params);
}

export async function searchCourses(searchTerm: string): Promise<Course[]> {
  const query = `
    SELECT c.*, COUNT(e.enrollment_id) as enrollment_count
    FROM courses c
    LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'enrolled'
    WHERE c.course_name LIKE ? OR c.course_code LIKE ?
    GROUP BY c.course_id
  `;
  const term = `%${searchTerm}%`;
  return executeQuery<Course>(query, [term, term]);
}

export async function getAvailableCourses(limit: number = 20): Promise<Course[]> {
  const query = `
    SELECT c.*, COUNT(e.enrollment_id) as enrollment_count
    FROM courses c
    LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'enrolled'
    GROUP BY c.course_id
    HAVING enrollment_count < c.capacity
    LIMIT ?
  `;
  return executeQuery<Course>(query, [limit]);
}
