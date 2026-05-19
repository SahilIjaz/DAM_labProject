import { executeQuery, executeTransaction, callProcedure } from '../db/mysql';
import { ExamResult, Enrollment } from '../types';

export async function getExamResults(
  limit: number = 50,
  offset: number = 0
): Promise<ExamResult[]> {
  const safeLimit = Math.max(1, Math.min(limit, 1000));
  const safeOffset = Math.max(0, offset);
  const query = `
    SELECT er.*, c.course_name, s.student_id, u.first_name, u.last_name
    FROM exam_results er
    JOIN enrollments e ON er.enrollment_id = e.enrollment_id
    JOIN courses c ON e.course_id = c.course_id
    JOIN students s ON e.student_id = s.student_id
    JOIN users u ON s.user_id = u.user_id
    LIMIT ${safeLimit} OFFSET ${safeOffset}
  `;
  return executeQuery<ExamResult>(query);
}

export async function getExamResultById(examResultId: number): Promise<ExamResult | null> {
  const query = `
    SELECT er.*, c.course_name, s.student_id, u.first_name, u.last_name
    FROM exam_results er
    JOIN enrollments e ON er.enrollment_id = e.enrollment_id
    JOIN courses c ON e.course_id = c.course_id
    JOIN students s ON e.student_id = s.student_id
    JOIN users u ON s.user_id = u.user_id
    WHERE er.exam_result_id = ?
  `;
  const results = await executeQuery<ExamResult>(query, [examResultId]);
  return results[0] || null;
}

export async function getEnrollmentExamResults(enrollmentId: number): Promise<ExamResult[]> {
  const query = `
    SELECT er.*, c.course_name
    FROM exam_results er
    JOIN enrollments e ON er.enrollment_id = e.enrollment_id
    JOIN courses c ON e.course_id = c.course_id
    WHERE er.enrollment_id = ?
    ORDER BY er.exam_date DESC
  `;
  return executeQuery<ExamResult>(query, [enrollmentId]);
}

export async function createExamResult(
  enrollmentId: number,
  examDate: string,
  percentage: number,
  examType: string
): Promise<{ exam_result_id: number; status: string }> {
  return executeTransaction(async (connection) => {
    const query = `
      INSERT INTO exam_results (enrollment_id, exam_date, percentage, exam_type)
      VALUES (?, ?, ?, ?)
    `;
    const result = await connection.execute(query, [enrollmentId, examDate, percentage, examType]);
    return {
      exam_result_id: result[0].insertId,
      status: 'created',
    };
  });
}

export async function updateExamResult(
  examResultId: number,
  percentage: number,
  examType?: string
): Promise<void> {
  return executeTransaction(async (connection) => {
    let query = `UPDATE exam_results SET percentage = ?`;
    const params: any[] = [percentage];

    if (examType) {
      query += `, exam_type = ?`;
      params.push(examType);
    }

    query += ` WHERE exam_result_id = ?`;
    params.push(examResultId);

    await connection.execute(query, params);
  });
}

export async function bulkUpdateGrades(
  semester: number,
  departmentId?: number
): Promise<{ updated: number; status: string }> {
  return callProcedure('sp_bulk_update_grades', [semester, departmentId || null]);
}

export async function getExamResultsByCourse(courseId: number): Promise<ExamResult[]> {
  const query = `
    SELECT er.*, c.course_name, s.student_id, u.first_name, u.last_name
    FROM exam_results er
    JOIN enrollments e ON er.enrollment_id = e.enrollment_id
    JOIN courses c ON e.course_id = c.course_id
    JOIN students s ON e.student_id = s.student_id
    JOIN users u ON s.user_id = u.user_id
    WHERE c.course_id = ?
    ORDER BY er.exam_date DESC
  `;
  return executeQuery<ExamResult>(query, [courseId]);
}

export async function getExamResultsByStudent(studentId: number): Promise<ExamResult[]> {
  const query = `
    SELECT er.*, c.course_name, c.course_id
    FROM exam_results er
    JOIN enrollments e ON er.enrollment_id = e.enrollment_id
    JOIN courses c ON e.course_id = c.course_id
    WHERE e.student_id = ?
    ORDER BY er.exam_date DESC
  `;
  return executeQuery<ExamResult>(query, [studentId]);
}

export async function getExamResultsBySemester(
  semester: number,
  departmentId?: number
): Promise<ExamResult[]> {
  let query = `
    SELECT er.*, c.course_name, s.student_id, u.first_name, u.last_name
    FROM exam_results er
    JOIN enrollments e ON er.enrollment_id = e.enrollment_id
    JOIN courses c ON e.course_id = c.course_id
    JOIN students s ON e.student_id = s.student_id
    JOIN users u ON s.user_id = u.user_id
    WHERE c.semester = ?
  `;
  const params: any[] = [semester];

  if (departmentId) {
    query += ` AND s.department_id = ?`;
    params.push(departmentId);
  }

  query += ` ORDER BY er.exam_date DESC`;
  return executeQuery<ExamResult>(query, params);
}

export async function getGradeDistribution(courseId: number): Promise<any> {
  const query = `
    SELECT
      COUNT(CASE WHEN er.percentage >= 90 THEN 1 END) as grade_A,
      COUNT(CASE WHEN er.percentage >= 80 AND er.percentage < 90 THEN 1 END) as grade_B,
      COUNT(CASE WHEN er.percentage >= 70 AND er.percentage < 80 THEN 1 END) as grade_C,
      COUNT(CASE WHEN er.percentage >= 60 AND er.percentage < 70 THEN 1 END) as grade_D,
      COUNT(CASE WHEN er.percentage < 60 THEN 1 END) as grade_F,
      AVG(er.percentage) as avg_percentage
    FROM exam_results er
    JOIN enrollments e ON er.enrollment_id = e.enrollment_id
    WHERE e.course_id = ?
  `;
  const results = await executeQuery(query, [courseId]);
  return results[0] || null;
}

export async function getTopStudentsByExam(courseId: number, limit: number = 10): Promise<any[]> {
  const query = `
    SELECT s.student_id, u.first_name, u.last_name, MAX(er.percentage) as highest_score
    FROM exam_results er
    JOIN enrollments e ON er.enrollment_id = e.enrollment_id
    JOIN students s ON e.student_id = s.student_id
    JOIN users u ON s.user_id = u.user_id
    WHERE e.course_id = ?
    GROUP BY s.student_id, u.first_name, u.last_name
    ORDER BY highest_score DESC
    LIMIT ?
  `;
  return executeQuery(query, [courseId, limit]);
}
