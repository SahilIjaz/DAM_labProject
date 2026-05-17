// Core Type Definitions for University Management System

export interface User {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role_id: number;
  department_id: number;
  campus_id: number;
  status: 'active' | 'inactive' | 'suspended';
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface Student extends User {
  student_id: number;
  enrollment_id: string;
  enrollment_date: Date;
  current_semester: number;
  gpa: number;
}

export interface Faculty extends User {
  faculty_id: number;
  faculty_code: string;
  qualification: string;
  specialization: string;
  hiring_date: Date;
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
  syllabus?: string;
  enrollment_count?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Enrollment {
  enrollment_id: number;
  student_id: number;
  course_id: number;
  semester: number;
  enrollment_date: Date;
  status: 'enrolled' | 'dropped' | 'completed';
  grade?: string;
  created_at?: Date;
}

export interface ExamResult {
  result_id: number;
  enrollment_id: number;
  exam_type: 'midterm' | 'final' | 'quiz';
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  exam_date: Date;
  created_at?: Date;
}

export interface Department {
  department_id: number;
  dept_name: string;
  dept_code: string;
  campus_id: number;
  head_of_dept?: number;
  budget: number;
  created_at?: Date;
}

export interface Campus {
  campus_id: number;
  campus_name: string;
  location: string;
  city: string;
  country: string;
  server_ip?: string;
  replication_type: 'master' | 'slave' | 'distributed';
  created_at?: Date;
}

export interface Role {
  role_id: number;
  role_name: string;
  description?: string;
  created_at?: Date;
}

export interface Permission {
  permission_id: number;
  permission_name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface AuditLog {
  log_id: number;
  user_id?: number;
  action: string;
  table_name: string;
  record_id?: number;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
  duration_ms?: number;
}

export interface BackupLog {
  backup_id: number;
  backup_type: 'full' | 'differential' | 'incremental';
  source_database: string;
  backup_file_name: string;
  backup_size_bytes: bigint;
  backup_path: string;
  backup_start: Date;
  backup_end?: Date;
  duration_seconds?: number;
  status: 'success' | 'failed' | 'pending';
  error_message?: string;
  verified?: boolean;
}

export interface Analytics {
  metric_id: number;
  metric_type: string;
  metric_value: number;
  recorded_at: Date;
}

export interface StudentPerformanceAnalytics {
  analytics_id: number;
  student_id: number;
  semester: number;
  total_courses: number;
  average_percentage: number;
  highest_score: number;
  lowest_score: number;
  passing_courses: number;
  failing_courses: number;
  trend_analysis?: Record<string, any>;
  computed_at: Date;
}

export interface CoursePerformanceAnalytics {
  analytics_id: number;
  course_id: number;
  semester: number;
  total_enrolled: number;
  avg_score: number;
  pass_rate: number;
  fail_rate: number;
  student_feedback?: Record<string, any>;
  difficulty_level: string;
  computed_at: Date;
}

export interface ReplicationStatus {
  status_id: number;
  primary_server: string;
  replica_server: string;
  last_sync_time: Date;
  replication_lag_ms: number;
  binlog_position?: string;
  sync_status: 'in_sync' | 'lagging' | 'error';
  error_message?: string;
  checked_at: Date;
}

export interface APIRequest {
  request_id: string;
  user_id?: number;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  request_body?: Record<string, any>;
  response_body?: Record<string, any>;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
}

export interface SystemEvent {
  event_id: number;
  event_type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  event_metadata?: Record<string, any>;
  created_at: Date;
  resolved_at?: Date;
  resolved_by?: number;
}

export interface AuthToken {
  token: string;
  expires_in: number;
  token_type: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: AuthToken;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  sort_by?: string;
  order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
