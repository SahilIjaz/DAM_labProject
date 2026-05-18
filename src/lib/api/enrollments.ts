import { db } from '@/lib/db';

export async function createEnrollment(studentId: number, courseId: number, semester: number) {
  try {
    const result = await db.query(
      'INSERT INTO enrollments (student_id, course_id, semester, enrollment_date, status) VALUES (?, ?, ?, NOW(), "enrolled")',
      [studentId, courseId, semester]
    );
    return { success: true, enrollmentId: (result as any).insertId };
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, error: 'Already enrolled in this course' };
    }
    throw error;
  }
}

export async function checkEnrollment(studentId: number, courseId: number) {
  const result = await db.query(
    'SELECT enrollment_id FROM enrollments WHERE student_id = ? AND course_id = ?',
    [studentId, courseId]
  );
  return (result as any).length > 0;
}

export async function removeEnrollment(studentId: number, courseId: number) {
  await db.query(
    'UPDATE enrollments SET status = "dropped" WHERE student_id = ? AND course_id = ?',
    [studentId, courseId]
  );
}
