import { executeQuery } from '../db/mysql';

export async function getStudentSchedule(studentId: number, semester: number): Promise<any[]> {
  const query = `
    SELECT
      e.enrollment_id,
      c.course_code,
      c.course_name,
      c.credit_hours,
      f.faculty_id,
      u.first_name,
      u.last_name,
      c.semester
    FROM enrollments e
    JOIN courses c ON e.course_id = c.course_id
    LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
    LEFT JOIN users u ON f.user_id = u.user_id
    WHERE e.student_id = ? AND e.semester = ? AND e.status = 'enrolled'
    ORDER BY c.course_code
  `;
  return executeQuery(query, [studentId, semester]);
}

export async function getFacultySchedule(facultyId: number, semester: number): Promise<any[]> {
  const query = `
    SELECT
      c.course_id,
      c.course_code,
      c.course_name,
      c.credit_hours,
      COUNT(DISTINCT e.student_id) as enrolled_students,
      c.capacity
    FROM courses c
    LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'enrolled'
    WHERE c.faculty_id = ? AND c.semester = ?
    GROUP BY c.course_id, c.course_code, c.course_name, c.credit_hours, c.capacity
    ORDER BY c.course_code
  `;
  return executeQuery(query, [facultyId, semester]);
}

export async function getSemesterCourses(departmentId: number, semester: number): Promise<any[]> {
  const query = `
    SELECT
      c.course_id,
      c.course_code,
      c.course_name,
      c.credit_hours,
      c.capacity,
      f.faculty_id,
      u.first_name,
      u.last_name
    FROM courses c
    LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
    LEFT JOIN users u ON f.user_id = u.user_id
    WHERE c.department_id = ? AND c.semester = ?
    ORDER BY c.course_code
  `;
  return executeQuery(query, [departmentId, semester]);
}

export async function getCurrentSemesterCourses(departmentId: number): Promise<any[]> {
  const query = `
    SELECT DISTINCT c.semester FROM courses c WHERE c.department_id = ? ORDER BY c.semester DESC LIMIT 1
  `;
  const results = await executeQuery(query, [departmentId]);
  if (results.length === 0) return [];

  const currentSemester = results[0].semester;
  return getSemesterCourses(departmentId, currentSemester);
}
