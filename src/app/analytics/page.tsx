'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/common/Navbar';
import { useRouter } from 'next/navigation';

interface AnalyticsData {
  studentPerformance: any[];
  courseEnrollment: any[];
  apiMetrics: any[];
  systemHealth: any[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/analytics/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      setData(result.data);
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
          <div style={styles.loadingContainer}>Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <Navbar user={user} onLogout={handleLogout} />
      <div style={styles.content}>
        <h1 style={styles.pageTitle}>📊 Analytics Dashboard</h1>

        {error && (
          <div style={styles.errorBox}>
            Error: {error}
          </div>
        )}

        {/* System Health */}
        {data?.systemStats && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>System Health</h2>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Students</div>
                <div style={styles.statValue}>{data.systemStats.total_students}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Courses</div>
                <div style={styles.statValue}>{data.systemStats.total_courses}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Faculty</div>
                <div style={styles.statValue}>{data.systemStats.total_faculty}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Enrollments</div>
                <div style={styles.statValue}>{data.systemStats.total_enrollments}</div>
              </div>
            </div>
          </div>
        )}

        {/* Course Enrollment */}
        {data?.courseEnrollment && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Course Enrollment</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th>Enrolled</th>
                    <th>Capacity</th>
                    <th>Usage %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.courseEnrollment.slice(0, 10).map((course: any, idx: number) => (
                    <tr key={idx}>
                      <td>{course.course_name}</td>
                      <td>{course.total_enrolled}</td>
                      <td>{course.capacity}</td>
                      <td>
                        <div style={styles.progressBar}>
                          <div
                            style={{
                              ...styles.progressFill,
                              width: `${course.capacity_used_percent}%`,
                            }}
                          />
                        </div>
                        {course.capacity_used_percent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* API Performance */}
        {data?.apiMetrics && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>API Performance Metrics</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Requests</th>
                    <th>Avg Response (ms)</th>
                    <th>Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {data.apiMetrics.slice(0, 15).map((metric: any, idx: number) => (
                    <tr key={idx}>
                      <td>{metric.endpoint}</td>
                      <td>{metric.method}</td>
                      <td>{metric.total_requests}</td>
                      <td>{metric.avg_response_time_ms}</td>
                      <td style={{ color: metric.error_count > 0 ? '#e74c3c' : '#27ae60' }}>
                        {metric.error_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Student Performance Sample */}
        {data?.studentPerformance && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Student Performance Sample</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Marks Obtained</th>
                    <th>Total Marks</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {data.studentPerformance.slice(0, 10).map((perf: any, idx: number) => (
                    <tr key={idx}>
                      <td>{perf.first_name} {perf.last_name}</td>
                      <td>{perf.course_name}</td>
                      <td>{perf.obtained_marks || '-'}</td>
                      <td>{perf.total_marks || '-'}</td>
                      <td style={{ fontWeight: 'bold' }}>{perf.percentage ? `${perf.percentage}%` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Faculty Workload */}
        {data?.facultyWorkload && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Faculty Workload</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Faculty Name</th>
                    <th>Courses Assigned</th>
                    <th>Total Students</th>
                  </tr>
                </thead>
                <tbody>
                  {data.facultyWorkload.slice(0, 10).map((faculty: any, idx: number) => (
                    <tr key={idx}>
                      <td>{faculty.first_name} {faculty.last_name}</td>
                      <td>{faculty.courses_assigned}</td>
                      <td>{faculty.total_students}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
  content: {
    flex: 1,
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
  },
  pageTitle: {
    color: '#2c3e50',
    marginBottom: '30px',
    fontSize: '28px',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '25px',
    marginBottom: '25px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    color: '#2c3e50',
    borderBottom: '2px solid #3498db',
    paddingBottom: '15px',
    marginBottom: '20px',
    fontSize: '20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '15px',
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    borderLeft: '4px solid #3498db',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: '#7f8c8d',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  progressBar: {
    width: '100px',
    height: '8px',
    backgroundColor: '#ecf0f1',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '5px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27ae60',
  },
  loadingContainer: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#7f8c8d',
    backgroundColor: 'white',
    borderRadius: '8px',
    fontSize: '16px',
  },
  errorBox: {
    padding: '15px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '20px',
  },
};
