import { executeQuery, callProcedure } from '../db/mysql';

export async function getStudentGrades(studentId: number) {
  const query = `
    SELECT er.*, e.enrollment_id, c.course_name
    FROM exam_results er
    JOIN enrollments e ON er.enrollment_id = e.enrollment_id
    JOIN courses c ON e.course_id = c.course_id
    WHERE e.student_id = ?
    ORDER BY er.created_at DESC
  `;
  return executeQuery(query, [studentId]);
}

export async function updateStudentGrade(enrollmentId: number, grade: string) {
  const query = `UPDATE enrollments SET grade = ? WHERE enrollment_id = ?`;
  return executeQuery(query, [grade, enrollmentId]);
}

export async function getClassGrades(courseId: number, semester: number) {
  const query = `
    SELECT e.enrollment_id, s.enrollment_id as student_enrollment_id, 
           u.first_name, u.last_name, e.grade, er.percentage
    FROM enrollments e
    JOIN students s ON e.student_id = s.student_id
    JOIN users u ON s.user_id = u.user_id
    LEFT JOIN exam_results er ON e.enrollment_id = er.enrollment_id
    WHERE e.course_id = ? AND e.semester = ?
    ORDER BY u.last_name
  `;
  return executeQuery(query, [courseId, semester]);
}
