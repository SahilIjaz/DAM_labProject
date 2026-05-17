import { executeQuery, callProcedure } from '../db/mysql';

export async function getStudentEnrollments(studentId: number): Promise<any[]> {
  const query = `
    SELECT e.enrollment_id, e.course_id, c.course_code, c.course_name, e.semester, e.status, e.grade, e.enrollment_date
    FROM enrollments e
    JOIN courses c ON e.course_id = c.course_id
    WHERE e.student_id = ?
    ORDER BY e.semester DESC, c.course_code
  `;
  return executeQuery(query, [studentId]);
}

export async function enrollStudent(
  studentId: number,
  courseId: number,
  semester: number
): Promise<{ enrollment_id: number; status: string }> {
  return callProcedure('sp_enroll_student', [studentId, courseId, semester], 2);
}

export async function dropEnrollment(enrollmentId: number): Promise<void> {
  const query = `UPDATE enrollments SET status = 'dropped' WHERE enrollment_id = ?`;
  await executeQuery(query, [enrollmentId]);
}

export async function updateEnrollmentGrade(enrollmentId: number, grade: string): Promise<void> {
  const query = `UPDATE enrollments SET grade = ?, status = 'completed' WHERE enrollment_id = ?`;
  await executeQuery(query, [grade, enrollmentId]);
}

export async function getEnrollmentStatus(enrollmentId: number): Promise<any> {
  const query = `
    SELECT e.enrollment_id, e.student_id, e.course_id, e.semester, e.status, e.grade, c.course_name
    FROM enrollments e
    JOIN courses c ON e.course_id = c.course_id
    WHERE e.enrollment_id = ?
  `;
  const results = await executeQuery(query, [enrollmentId]);
  return results[0] || null;
}

export async function getSemesterEnrollments(studentId: number, semester: number): Promise<any[]> {
  const query = `
    SELECT e.enrollment_id, c.course_code, c.course_name, e.status, e.grade
    FROM enrollments e
    JOIN courses c ON e.course_id = c.course_id
    WHERE e.student_id = ? AND e.semester = ?
    ORDER BY c.course_code
  `;
  return executeQuery(query, [studentId, semester]);
}

export async function bulkEnrollStudents(courseId: number, studentIds: number[], semester: number): Promise<any[]> {
  const results = [];
  for (const studentId of studentIds) {
    try {
      const result = await enrollStudent(studentId, courseId, semester);
      results.push({ studentId, ...result });
    } catch (error) {
      results.push({ studentId, error: (error as any).message });
    }
  }
  return results;
}
