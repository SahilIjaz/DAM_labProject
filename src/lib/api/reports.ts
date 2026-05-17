import { executeQuery } from '../db/mysql';

export async function getStudentPerformanceReport(studentId: number): Promise<any> {
  const query = `
    SELECT
      s.student_id,
      u.first_name,
      u.last_name,
      s.current_semester,
      s.gpa,
      COUNT(DISTINCT e.enrollment_id) as total_courses,
      COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.enrollment_id END) as completed_courses,
      AVG(er.percentage) as avg_percentage
    FROM students s
    JOIN users u ON s.user_id = u.user_id
    LEFT JOIN enrollments e ON s.student_id = e.student_id
    LEFT JOIN exam_results er ON e.enrollment_id = er.enrollment_id
    WHERE s.student_id = ?
    GROUP BY s.student_id, u.first_name, u.last_name, s.current_semester, s.gpa
  `;
  const results = await executeQuery(query, [studentId]);
  return results[0] || null;
}

export async function getDepartmentPerformanceReport(departmentId: number): Promise<any> {
  const query = `
    SELECT
      d.department_id,
      d.dept_name,
      COUNT(DISTINCT s.student_id) as total_students,
      AVG(s.gpa) as avg_gpa,
      COUNT(DISTINCT f.faculty_id) as faculty_count,
      COUNT(DISTINCT c.course_id) as total_courses
    FROM departments d
    LEFT JOIN students s ON d.department_id = s.department_id AND s.status = 'active'
    LEFT JOIN faculty f ON d.department_id = f.department_id AND f.status = 'active'
    LEFT JOIN courses c ON d.department_id = c.department_id
    WHERE d.department_id = ?
    GROUP BY d.department_id, d.dept_name
  `;
  const results = await executeQuery(query, [departmentId]);
  return results[0] || null;
}

export async function getCourseEnrollmentReport(courseId: number): Promise<any> {
  const query = `
    SELECT
      c.course_id,
      c.course_code,
      c.course_name,
      COUNT(DISTINCT e.student_id) as enrolled_students,
      c.capacity,
      ROUND((COUNT(DISTINCT e.student_id) / c.capacity) * 100, 2) as enrollment_percent,
      AVG(er.percentage) as avg_class_percentage
    FROM courses c
    LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.status = 'enrolled'
    LEFT JOIN exam_results er ON e.enrollment_id = er.enrollment_id
    WHERE c.course_id = ?
    GROUP BY c.course_id, c.course_code, c.course_name, c.capacity
  `;
  const results = await executeQuery(query, [courseId]);
  return results[0] || null;
}

export async function getCampusWideReport(): Promise<any[]> {
  const query = `
    SELECT
      c.campus_id,
      c.campus_name,
      COUNT(DISTINCT u.user_id) as total_users,
      COUNT(DISTINCT s.student_id) as total_students,
      COUNT(DISTINCT f.faculty_id) as total_faculty,
      COUNT(DISTINCT d.department_id) as total_departments,
      AVG(s.gpa) as avg_student_gpa
    FROM campuses c
    LEFT JOIN departments d ON c.campus_id = d.campus_id
    LEFT JOIN users u ON c.campus_id = u.campus_id
    LEFT JOIN students s ON d.department_id = s.department_id
    LEFT JOIN faculty f ON d.department_id = f.department_id
    GROUP BY c.campus_id, c.campus_name
    ORDER BY c.campus_name
  `;
  return executeQuery(query, []);
}

export async function getEnrollmentTrendReport(departmentId: number, semester: number): Promise<any[]> {
  const query = `
    SELECT
      c.course_code,
      c.course_name,
      COUNT(DISTINCT e.student_id) as enrolled_count,
      c.capacity,
      ROUND((COUNT(DISTINCT e.student_id) / c.capacity) * 100, 2) as capacity_used_percent
    FROM courses c
    LEFT JOIN enrollments e ON c.course_id = e.course_id AND e.semester = ?
    WHERE c.department_id = ?
    GROUP BY c.course_id, c.course_code, c.course_name, c.capacity
    ORDER BY enrolled_count DESC
  `;
  return executeQuery(query, [semester, departmentId]);
}
