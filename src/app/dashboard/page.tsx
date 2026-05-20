'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/common/Navbar';

interface DashboardStats {
  total_users: number;
  active_students: number;
  active_faculty: number;
  total_courses: number;
  active_enrollments: number;
  avg_student_gpa: number | null;
  total_campuses: number;
  total_departments: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);

      if ([4, 5, 6].includes(userData?.role_id)) {
        window.location.href = '/faculty/dashboard';
        return;
      }
    }
    if (isAdminRole(storedUser ? JSON.parse(storedUser) : null)) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, []);

  const isAdminRole = (userData: any) => {
    return userData?.role_id === 1 || userData?.role_id === 2 || userData?.role_id === 3;
  };

  const getRoleName = (roleId: number) => {
    const roles: Record<number, string> = {
      1: 'Super Admin',
      2: 'DBA',
      3: 'System Admin',
      4: 'Faculty',
      5: 'Department Head',
      6: 'Instructor',
      7: 'Student',
      8: 'Support Staff',
      9: 'Data Entry',
      10: 'Guest',
    };
    return roles[roleId] || 'User';
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/statistics', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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
          <h1>Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, {user?.first_name}!</p>
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>Loading...</div>
        ) : isAdminRole(user) ? (
          <>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <h3 style={styles.statLabel}>Total Users</h3>
                <p style={styles.statValue}>{stats?.total_users || 0}</p>
              </div>
              <div style={styles.statCard}>
                <h3 style={styles.statLabel}>Active Students</h3>
                <p style={styles.statValue}>{stats?.active_students || 0}</p>
              </div>
              <div style={styles.statCard}>
                <h3 style={styles.statLabel}>Total Courses</h3>
                <p style={styles.statValue}>{stats?.total_courses || 0}</p>
              </div>
              <div style={styles.statCard}>
                <h3 style={styles.statLabel}>Active Enrollments</h3>
                <p style={styles.statValue}>{stats?.active_enrollments || 0}</p>
              </div>
              <div style={styles.statCard}>
                <h3 style={styles.statLabel}>Average GPA</h3>
                <p style={styles.statValue}>
                  {stats?.avg_student_gpa?.toFixed(2) || 'N/A'}
                </p>
              </div>
            </div>

            <div style={styles.quickLinksSection}>
              <h2>Admin Quick Actions</h2>
              <div style={styles.quickLinks}>
                <Link href="/students" style={styles.quickLink}>
                  View Students
                </Link>
                <Link href="/courses" style={styles.quickLink}>
                  View Courses
                </Link>
                <Link href="/faculty" style={styles.quickLink}>
                  View Faculty
                </Link>
                <Link href="/exams" style={styles.quickLink}>
                  Manage Exams
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div style={styles.quickLinksSection}>
            <h2>Your Dashboard</h2>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
              Role: <strong>{getRoleName(user?.role_id)}</strong>
            </p>

            {user?.role_id === 7 && (
              <>
                <div style={styles.quickLinks}>
                  <Link href="/courses" style={styles.quickLink}>
                    Browse Courses
                  </Link>
                  <Link href="/exams" style={styles.quickLink}>
                    View Exams
                  </Link>
                </div>
                <p style={{ marginTop: '20px', color: '#7f8c8d' }}>
                  As a student, you can view available courses and exams.
                </p>
              </>
            )}

            {(user?.role_id === 4 || user?.role_id === 6) && (
              <>
                <div style={styles.quickLinks}>
                  <Link href="/courses" style={styles.quickLink}>
                    My Courses
                  </Link>
                  <Link href="/exams" style={styles.quickLink}>
                    Manage Exams
                  </Link>
                </div>
                <p style={{ marginTop: '20px', color: '#7f8c8d' }}>
                  As an instructor/faculty member, you can manage courses and exams.
                </p>
              </>
            )}

            {user?.role_id === 5 && (
              <>
                <div style={styles.quickLinks}>
                  <Link href="/students" style={styles.quickLink}>
                    Department Students
                  </Link>
                  <Link href="/courses" style={styles.quickLink}>
                    Department Courses
                  </Link>
                  <Link href="/faculty" style={styles.quickLink}>
                    Department Faculty
                  </Link>
                </div>
                <p style={{ marginTop: '20px', color: '#7f8c8d' }}>
                  As a department head, you can manage your department's resources.
                </p>
              </>
            )}

            {(user?.role_id === 8 || user?.role_id === 9) && (
              <>
                <div style={styles.quickLinks}>
                  <Link href="/students" style={styles.quickLink}>
                    View Students
                  </Link>
                  <Link href="/courses" style={styles.quickLink}>
                    View Courses
                  </Link>
                  <Link href="/faculty" style={styles.quickLink}>
                    View Instructors
                  </Link>
                </div>
                <p style={{ marginTop: '20px', color: '#7f8c8d' }}>
                  You can view students, courses, and instructors in the system.
                </p>
              </>
            )}

            {user?.role_id === 10 && (
              <div style={{ padding: '20px', backgroundColor: '#ecf0f1', borderRadius: '4px' }}>
                <p style={{ color: '#7f8c8d' }}>
                  As a guest user, your access is limited. Please contact an administrator for more features.
                </p>
              </div>
            )}
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  statLabel: {
    color: '#7f8c8d',
    fontSize: '14px',
    margin: '0 0 10px 0',
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#3498db',
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0',
  },
  quickLinksSection: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  quickLinks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginTop: '20px',
  },
  quickLink: {
    display: 'block',
    padding: '15px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    textAlign: 'center',
    transition: 'background-color 0.3s',
    cursor: 'pointer',
  },
  loadingContainer: {
    padding: '40px',
    textAlign: 'center',
    color: '#7f8c8d',
  },
};
