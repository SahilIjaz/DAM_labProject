import { executeQuery, executeTransaction } from '../db/mysql';

export async function markAttendance(enrollmentId: number, date: string, status: 'present' | 'absent' | 'late') {
  const query = `
    INSERT INTO attendance (enrollment_id, attendance_date, status)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE status = VALUES(status)
  `;
  return executeQuery(query, [enrollmentId, date, status]);
}

export async function getAttendanceReport(studentId: number) {
  const query = `
    SELECT c.course_name, COUNT(*) as total_classes,
           SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
           SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
           SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late
    FROM attendance a
    JOIN enrollments e ON a.enrollment_id = e.enrollment_id
    JOIN courses c ON e.course_id = c.course_id
    WHERE e.student_id = ?
    GROUP BY c.course_id
  `;
  return executeQuery(query, [studentId]);
}

export async function getClassAttendance(courseId: number, semester: number) {
  const query = `
    SELECT u.first_name, u.last_name,
           COUNT(a.attendance_id) as attended,
           COUNT(DISTINCT a.attendance_date) as total_days
    FROM enrollments e
    JOIN students s ON e.student_id = s.student_id
    JOIN users u ON s.user_id = u.user_id
    LEFT JOIN attendance a ON e.enrollment_id = a.enrollment_id
    WHERE e.course_id = ? AND e.semester = ?
    GROUP BY s.student_id
  `;
  return executeQuery(query, [courseId, semester]);
}
