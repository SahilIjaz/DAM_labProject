'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Course } from '@/lib/types';

interface CourseListProps {
  onCourseSelect?: (course: Course) => void;
  departmentId?: number;
  facultyId?: number;
}

export const CourseList: React.FC<CourseListProps> = ({
  onCourseSelect,
  departmentId,
  facultyId,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);
  const [enrollmentMessage, setEnrollmentMessage] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchCourses();
  }, [departmentId, facultyId]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      let endpoint = '/api/courses';
      const params = new URLSearchParams();

      if (departmentId) params.append('departmentId', departmentId.toString());
      if (facultyId) params.append('facultyId', facultyId.toString());

      if (params.toString()) endpoint += `?${params.toString()}`;

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      setCourses(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = async (course: Course) => {
    if (user?.role_id !== 7) {
      setEnrollmentMessage('Only students can enroll in courses');
      setTimeout(() => setEnrollmentMessage(null), 3000);
      return;
    }

    setEnrollingCourseId(course.course_id);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setEnrollmentMessage('Please log in first');
        setEnrollingCourseId(null);
        return;
      }

      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: course.course_id,
          semester: course.semester || 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setEnrollmentMessage(data.error || 'Failed to enroll');
        setEnrollingCourseId(null);
        setTimeout(() => setEnrollmentMessage(null), 3000);
        return;
      }

      setCourses((prevCourses) =>
        prevCourses.map((c) =>
          c.course_id === course.course_id
            ? { ...c, enrollment_count: (c.enrollment_count || 0) + 1 }
            : c
        )
      );

      setEnrollmentMessage(`Successfully enrolled in ${course.course_name}!`);
      setTimeout(() => setEnrollmentMessage(null), 3000);
    } catch (err: any) {
      setEnrollmentMessage(err.message || 'Failed to enroll');
      setTimeout(() => setEnrollmentMessage(null), 3000);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCourses = filteredCourses.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  if (loading) {
    return <div style={styles.loadingContainer}>Loading courses...</div>;
  }

  if (error) {
    return <div style={styles.errorContainer}>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Courses</h2>
        {user?.role_id !== 7 && (
          <Link href="/courses/create" style={styles.createButton}>
            Create New Course
          </Link>
        )}
      </div>

      {enrollmentMessage && (
        <div style={{
          padding: '12px',
          backgroundColor: enrollmentMessage.includes('Successfully') ? '#d4edda' : '#f8d7da',
          color: enrollmentMessage.includes('Successfully') ? '#155724' : '#721c24',
          borderRadius: '4px',
          marginBottom: '15px',
          fontSize: '14px',
        }}>
          {enrollmentMessage}
        </div>
      )}

      <input
        type="text"
        placeholder="Search by course name or code..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
        style={styles.searchInput}
      />

      <div style={styles.cardGrid}>
        {paginatedCourses.map((course) => (
          <div key={course.course_id} style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>{course.course_name}</h3>
              <span style={styles.courseCode}>{course.course_code}</span>
            </div>
            <div style={styles.cardBody}>
              <p style={styles.cardText}>
                <strong>Semester:</strong> {course.semester}
              </p>
              <p style={styles.cardText}>
                <strong>Credits:</strong> {course.credit_hours}
              </p>
              <p style={styles.cardText}>
                <strong>Capacity:</strong> {course.capacity}
              </p>
              <p style={styles.cardText}>
                <strong>Enrolled:</strong> {course.enrollment_count || 0}
              </p>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${
                      ((course.enrollment_count || 0) / course.capacity) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
            <div style={styles.cardFooter}>
              <Link
                href={`/courses/${course.course_id}`}
                style={styles.actionLink}
              >
                View Details
              </Link>
              {user?.role_id === 7 && (
                <button
                  onClick={() => handleSelectCourse(course)}
                  disabled={enrollingCourseId === course.course_id}
                  style={{
                    ...styles.actionButton,
                    opacity: enrollingCourseId === course.course_id ? 0.6 : 1,
                    cursor: enrollingCourseId === course.course_id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {enrollingCourseId === course.course_id ? 'Enrolling...' : 'Select'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.pagination}>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          style={styles.paginationButton}
        >
          Previous
        </button>
        <span style={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          style={styles.paginationButton}
        >
          Next
        </button>
      </div>

    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  createButton: {
    backgroundColor: '#27ae60',
    color: 'white',
    padding: '10px 15px',
    borderRadius: '4px',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  searchInput: {
    width: '100%',
    padding: '10px',
    marginBottom: '20px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    backgroundColor: '#34495e',
    color: 'white',
    padding: '15px',
  },
  cardTitle: {
    margin: '0 0 5px 0',
    fontSize: '16px',
  },
  courseCode: {
    fontSize: '12px',
    opacity: 0.8,
  },
  cardBody: {
    padding: '15px',
    flex: 1,
  },
  cardText: {
    margin: '8px 0',
    fontSize: '14px',
    color: '#2c3e50',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#ecf0f1',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '10px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    transition: 'width 0.3s ease',
  },
  cardFooter: {
    display: 'flex',
    gap: '10px',
    padding: '15px',
    borderTop: '1px solid #ecf0f1',
  },
  actionLink: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#3498db',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    textAlign: 'center',
    fontSize: '12px',
    cursor: 'pointer',
  },
  actionButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
  },
  paginationButton: {
    padding: '8px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  pageInfo: {
    color: '#7f8c8d',
    fontSize: '14px',
  },
  loadingContainer: {
    padding: '20px',
    textAlign: 'center',
    color: '#7f8c8d',
  },
  errorContainer: {
    padding: '20px',
    backgroundColor: '#e74c3c',
    color: 'white',
    borderRadius: '4px',
    margin: '20px',
  },
};

export default CourseList;
