'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/common/Navbar';

interface FacultyDashboardData {
  courses: Array<{
    course_id: number;
    course_code: string;
    course_name: string;
    credits: number;
    department_name: string;
    enrolled_students: number;
  }>;
  students: Array<{
    student_id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    enrollment_id: string;
    gpa: number | null;
    status: string;
    enrolled_courses: number;
  }>;
  department_id: number;
}

export default function FacultyDashboardPage() {
  const [data, setData] = useState<FacultyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/faculty/dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        const errorData = await response.json();
        console.error('Dashboard API error:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div style={styles.pageContainer}>
      <Navbar user={user} onLogout={handleLogout} />

      <div style={styles.container}>
        <div style={styles.header}>
          <h1>Faculty Dashboard</h1>
          <p style={styles.subtitle}>Welcome, {user?.first_name}!</p>
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>Loading dashboard...</div>
        ) : (
          <>
            {/* Courses Section */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Department Courses</h2>
              {data?.courses && data.courses.length > 0 ? (
                <div style={styles.grid}>
                  {data.courses.map((course) => (
                    <div key={course.course_id} style={styles.card}>
                      <h3 style={styles.cardTitle}>{course.course_name}</h3>
                      <p style={styles.cardSubtitle}>{course.course_code}</p>
                      <div style={styles.cardInfo}>
                        <div>
                          <span style={styles.label}>Credits:</span>
                          <span style={styles.value}>{course.credits}</span>
                        </div>
                        <div>
                          <span style={styles.label}>Enrolled:</span>
                          <span style={styles.value}>{course.enrolled_students}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.emptyMessage}>No courses found in this department.</p>
              )}
            </div>

            {/* Students Section */}
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Department Students</h2>
              {data?.students && data.students.length > 0 ? (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.headerRow}>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Enrollment ID</th>
                        <th style={styles.th}>GPA</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Courses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.students.map((student) => (
                        <tr key={student.student_id} style={styles.bodyRow}>
                          <td style={styles.td}>
                            {student.first_name} {student.last_name}
                          </td>
                          <td style={styles.td}>{student.email}</td>
                          <td style={styles.td}>{student.enrollment_id}</td>
                          <td style={styles.td}>{student.gpa ? parseFloat(student.gpa as any).toFixed(2) : 'N/A'}</td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.statusBadge,
                                backgroundColor:
                                  student.status === 'active' ? '#27ae60' : '#e74c3c',
                              }}
                            >
                              {student.status}
                            </span>
                          </td>
                          <td style={styles.td}>{student.enrolled_courses}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={styles.emptyMessage}>No students found in this department.</p>
              )}
            </div>
          </>
        )}
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
  container: {
    flex: 1,
    padding: '40px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    marginBottom: '40px',
  },
  subtitle: {
    color: '#7f8c8d',
    fontSize: '16px',
    margin: '10px 0 0 0',
  },
  section: {
    marginBottom: '40px',
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    color: '#2c3e50',
    marginBottom: '20px',
    fontSize: '20px',
    borderBottom: '2px solid #3498db',
    paddingBottom: '10px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  cardTitle: {
    color: '#2c3e50',
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 5px 0',
  },
  cardSubtitle: {
    color: '#7f8c8d',
    fontSize: '14px',
    margin: '0 0 15px 0',
  },
  cardInfo: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  label: {
    color: '#7f8c8d',
    fontSize: '12px',
    display: 'block',
    marginBottom: '4px',
  },
  value: {
    color: '#3498db',
    fontWeight: 'bold',
    display: 'block',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
  },
  headerRow: {
    backgroundColor: '#34495e',
    color: 'white',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
  },
  bodyRow: {
    borderBottom: '1px solid #ecf0f1',
  },
  td: {
    padding: '12px',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: '40px',
    textAlign: 'center',
    color: '#7f8c8d',
  },
  emptyMessage: {
    color: '#7f8c8d',
    textAlign: 'center',
    padding: '20px',
  },
};
