export interface User {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  role_id: number;
  department_id?: number;
  campus_id?: number;
  status: string;
  created_at?: string;
  first_name?: string;
  last_name?: string;
}

export interface Student extends User {
  student_id: number;
  enrollment_id: string;
  current_semester: number;
  gpa: number | null;
}

export interface Faculty extends User {
  faculty_id: number;
  faculty_code: string;
  qualification: string;
  specialization: string;
  hiring_date: string;
}

export interface Course {
  course_id: number;
  course_code: string;
  course_name: string;
  department_id: number;
  faculty_id?: number;
  credit_hours: number;
  capacity: number;
  semester: number;
  enrollment_count?: number;
}

export interface Enrollment {
  enrollment_id: string;
  student_id: number;
  course_id: number;
  semester: number;
  status: 'enrolled' | 'dropped' | 'completed';
  grade?: string;
  enrolled_date?: string;
}

export interface ExamResult {
  result_id: number;
  enrollment_id: string;
  exam_type: 'midterm' | 'final' | 'quiz';
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  date_taken?: string;
}

export interface Department {
  department_id: number;
  dept_name: string;
  dept_code: string;
  campus_id: number;
  head_of_dept?: number;
  budget?: number;
}

export interface TokenPayload {
  user_id: number;
  username: string;
  email: string;
  role_id: number;
  iat: number;
  exp: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const ROLE_IDS = {
  SUPER_ADMIN: 1,
  DBA: 2,
  SYSTEM_ADMIN: 3,
  FACULTY: 4,
  DEPARTMENT_HEAD: 5,
  INSTRUCTOR: 6,
  STUDENT: 7,
  SUPPORT_STAFF: 8,
  DATA_ENTRY: 9,
  GUEST: 10,
};
