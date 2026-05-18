import { executeQuery, callProcedure } from '../db/mysql';
import { Course } from '../types';

export async function getCourses(departmentId?: number): Promise<Course[]> {
  const baseQuery = `
    SELECT c.*,
      COUNT(CASE WHEN e.status = 'enrolled' THEN 1 END) as enrollment_count
    FROM courses c
    LEFT JOIN enrollments e ON c.course_id = e.course_id
  `;

  if (departmentId) {
    const query = baseQuery + `WHERE c.department_id = ? GROUP BY c.course_id ORDER BY c.course_code`;
    return executeQuery<Course>(query, [departmentId]);
  }

  const query = baseQuery + `GROUP BY c.course_id ORDER BY c.course_code`;
  return executeQuery<Course>(query, []);
}

export async function getCourseById(courseId: number): Promise<Course | null> {
  const query = `
    SELECT c.*,
      COUNT(CASE WHEN e.status = 'enrolled' THEN 1 END) as enrollment_count
    FROM courses c
    LEFT JOIN enrollments e ON c.course_id = e.course_id
    WHERE c.course_id = ?
    GROUP BY c.course_id
  `;
  const results = await executeQuery<Course>(query, [courseId]);
  return results[0] || null;
}

export async function createCourse(
  courseCode: string,
  courseName: string,
  departmentId: number,
  creditHours: number,
  capacity: number,
  semester: number
): Promise<{ course_id: number; status: string }> {
  const query = `
    INSERT INTO courses (course_code, course_name, department_id, credit_hours, capacity, semester)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const result = await executeQuery(query, [courseCode, courseName, departmentId, creditHours, capacity, semester]);
  return {
    course_id: (result as any).insertId,
    status: 'created',
  };
}

export async function updateCourse(
  courseId: number,
  courseName?: string,
  capacity?: number,
  creditHours?: number
): Promise<void> {
  let query = `UPDATE courses SET `;
  const params: any[] = [];
  const updates: string[] = [];

  if (courseName) {
    updates.push(`course_name = ?`);
    params.push(courseName);
  }
  if (capacity !== undefined) {
    updates.push(`capacity = ?`);
    params.push(capacity);
  }
  if (creditHours !== undefined) {
    updates.push(`credit_hours = ?`);
    params.push(creditHours);
  }

  if (updates.length === 0) return;

  query += updates.join(', ') + ` WHERE course_id = ?`;
  params.push(courseId);

  await executeQuery(query, params);
}

export async function deleteCourse(courseId: number): Promise<void> {
  const query = `DELETE FROM courses WHERE course_id = ?`;
  await executeQuery(query, [courseId]);
}

export async function getCourseEnrollments(courseId: number): Promise<any[]> {
  const query = `
    SELECT e.enrollment_id, e.student_id, u.first_name, u.last_name, e.status, e.grade
    FROM enrollments e
    JOIN students s ON e.student_id = s.student_id
    JOIN users u ON s.user_id = u.user_id
    WHERE e.course_id = ?
    ORDER BY u.last_name, u.first_name
  `;
  return executeQuery(query, [courseId]);
}

export async function getCourseBySemester(departmentId: number, semester: number): Promise<Course[]> {
  const query = `
    SELECT * FROM courses
    WHERE department_id = ? AND semester = ?
    ORDER BY course_code
  `;
  return executeQuery<Course>(query, [departmentId, semester]);
}
