'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '@/components/common/Navbar';

interface Course {
  course_id: number;
  course_code: string;
  course_name: string;
  department_id: number;
  faculty_id?: number;
  credit_hours: number;
  capacity: number;
  semester: number;
  syllabus?: string;
  created_at: string;
  updated_at: string;
}

interface Faculty {
  faculty_id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState<string | null>(null);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [assigningFaculty, setAssigningFaculty] = useState(false);
  const [assignMessage, setAssignMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      checkEnrollmentStatus();
    }
    if (user?.role_id === 8 || user?.role_id === 9) {
      fetchFaculty();
    }
  }, [courseId, user]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) throw new Error('Failed to fetch course');
      const data = await response.json();
      setCourse(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/enrollments/check?courseId=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIsEnrolled(data.enrolled);
      }
    } catch (err) {
      console.error('Failed to check enrollment status');
    }
  };

  const fetchFaculty = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/faculty', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const facultyList = Array.isArray(data) ? data : data.data || [];
        setFaculty(facultyList);
        if (course?.faculty_id) {
          setSelectedFacultyId(course.faculty_id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch faculty:', err);
    }
  };

  const handleAssignFaculty = async () => {
    if (!selectedFacultyId) {
      setAssignMessage('Please select a faculty member');
      return;
    }

    try {
      setAssigningFaculty(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setAssignMessage('Please log in first');
        return;
      }

      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          faculty_id: selectedFacultyId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setAssignMessage(error.error || 'Failed to assign faculty');
        return;
      }

      setAssignMessage('Faculty assigned successfully!');
      setCourse({ ...course!, faculty_id: selectedFacultyId });
      setTimeout(() => setAssignMessage(null), 3000);
    } catch (err: any) {
      setAssignMessage(err.message || 'Failed to assign faculty');
    } finally {
      setAssigningFaculty(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setEnrollMessage('Please log in first');
        return;
      }

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: parseInt(courseId),
          semester: course?.semester || 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setEnrollMessage(error.error || 'Failed to enroll');
        return;
      }

      setIsEnrolled(true);
      setEnrollMessage('Successfully enrolled in the course!');
      setTimeout(() => setEnrollMessage(null), 3000);
    } catch (err: any) {
      setEnrollMessage(err.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <Navbar user={user} onLogout={handleLogout} />
        <div style={styles.content}>
          <div style={styles.loadingContainer}>Loading course details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.pageContainer}>
        <Navbar user={user} onLogout={handleLogout} />
        <div style={styles.content}>
          <div style={styles.errorContainer}>Error: {error}</div>
          <button onClick={() => router.back()} style={styles.backButton}>
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={styles.pageContainer}>
        <Navbar user={user} onLogout={handleLogout} />
        <div style={styles.content}>
          <div style={styles.errorContainer}>Course not found</div>
          <button onClick={() => router.back()} style={styles.backButton}>
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <Navbar user={user} onLogout={handleLogout} />
      <div style={styles.content}>
        <button onClick={() => router.back()} style={styles.backButton}>
          ← Back
        </button>

        <div style={styles.courseCard}>
          <h1 style={styles.courseTitle}>{course.course_name}</h1>

          <div style={styles.detailsGrid}>
            <div style={styles.detailItem}>
              <label style={styles.detailLabel}>Course Code</label>
              <p style={styles.detailValue}>{course.course_code}</p>
            </div>

            <div style={styles.detailItem}>
              <label style={styles.detailLabel}>Department ID</label>
              <p style={styles.detailValue}>{course.department_id}</p>
            </div>

            <div style={styles.detailItem}>
              <label style={styles.detailLabel}>Credit Hours</label>
              <p style={styles.detailValue}>{course.credit_hours}</p>
            </div>

            <div style={styles.detailItem}>
              <label style={styles.detailLabel}>Capacity</label>
              <p style={styles.detailValue}>{course.capacity} students</p>
            </div>

            <div style={styles.detailItem}>
              <label style={styles.detailLabel}>Semester</label>
              <p style={styles.detailValue}>{course.semester}</p>
            </div>

            <div style={styles.detailItem}>
              <label style={styles.detailLabel}>Faculty ID</label>
              <p style={styles.detailValue}>{course.faculty_id || 'Not assigned'}</p>
            </div>

            <div style={styles.detailItem}>
              <label style={styles.detailLabel}>Created At</label>
              <p style={styles.detailValue}>
                {new Date(course.created_at).toLocaleDateString()}
              </p>
            </div>

            <div style={styles.detailItem}>
              <label style={styles.detailLabel}>Updated At</label>
              <p style={styles.detailValue}>
                {new Date(course.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {course.syllabus && (
            <div style={styles.syllabusSection}>
              <h2 style={styles.sectionTitle}>Syllabus</h2>
              <p style={styles.syllabusText}>{course.syllabus}</p>
            </div>
          )}

          {user?.role_id === 7 && (
            <div style={styles.enrollSection}>
              {enrollMessage && (
                <div style={{
                  padding: '12px',
                  backgroundColor: isEnrolled ? '#d4edda' : '#f8d7da',
                  color: isEnrolled ? '#155724' : '#721c24',
                  borderRadius: '4px',
                  marginBottom: '15px',
                  fontSize: '14px',
                }}>
                  {enrollMessage}
                </div>
              )}
              <button
                onClick={handleEnroll}
                disabled={enrolling || isEnrolled}
                style={{
                  ...styles.enrollButton,
                  backgroundColor: isEnrolled ? '#95a5a6' : '#27ae60',
                  cursor: isEnrolled || enrolling ? 'not-allowed' : 'pointer',
                  opacity: isEnrolled || enrolling ? 0.6 : 1,
                }}
              >
                {enrolling ? 'Enrolling...' : isEnrolled ? 'Already Enrolled' : 'Enroll in Course'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#ecf0f1',
  },
  content: {
    flex: 1,
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
    width: '100%',
  },
  backButton: {
    padding: '10px 15px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '20px',
  },
  courseCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  courseTitle: {
    marginTop: 0,
    color: '#2c3e50',
    borderBottom: '2px solid #3498db',
    paddingBottom: '15px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  detailItem: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    borderLeft: '4px solid #3498db',
  },
  detailLabel: {
    display: 'block',
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: '12px',
    marginBottom: '5px',
    textTransform: 'uppercase',
  },
  detailValue: {
    margin: 0,
    fontSize: '16px',
    color: '#34495e',
  },
  syllabusSection: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #ecf0f1',
  },
  sectionTitle: {
    color: '#2c3e50',
    borderBottom: '2px solid #3498db',
    paddingBottom: '10px',
  },
  syllabusText: {
    color: '#555',
    lineHeight: '1.6',
  },
  loadingContainer: {
    padding: '40px',
    textAlign: 'center',
    color: '#7f8c8d',
    backgroundColor: 'white',
    borderRadius: '8px',
  },
  errorContainer: {
    padding: '20px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  enrollSection: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #ecf0f1',
  },
  enrollButton: {
    padding: '12px 30px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
};
