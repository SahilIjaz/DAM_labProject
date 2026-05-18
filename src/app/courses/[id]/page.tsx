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

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

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
};
