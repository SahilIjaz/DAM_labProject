'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/common/Navbar';

interface Enrollment {
  enrollment_id: number;
  student_id: number;
  course_id: number;
  course_name: string;
  course_code: string;
  first_name: string;
  last_name: string;
  email: string;
  semester: number;
  enrollment_date: string;
  status: string;
  grade: string | null;
}

export default function EnrollmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByCourse, setFilterByCourse] = useState('');
  const [filterByStatus, setFilterByStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // Only allow instructors to access this page
      if (parsedUser.role_id !== 6) {
        router.push('/dashboard');
        return;
      }

      fetchEnrollments(parsedUser);
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchEnrollments = async (userData: any) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await fetch('/api/enrollments/department', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch enrollments');
      }

      const data = await response.json();
      setEnrollments(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = enrollments;

    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterByCourse) {
      filtered = filtered.filter((e) => e.course_code === filterByCourse);
    }

    if (filterByStatus) {
      filtered = filtered.filter((e) => e.status === filterByStatus);
    }

    setFilteredEnrollments(filtered);
    setCurrentPage(1);
  }, [enrollments, searchTerm, filterByCourse, filterByStatus]);

  const uniqueCourses = [...new Set(enrollments.map((e) => e.course_code))].sort();
  const uniqueStatuses = [...new Set(enrollments.map((e) => e.status))].sort();

  const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEnrollments = filteredEnrollments.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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
          <div style={styles.loadingContainer}>Loading enrollments...</div>
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
          <button onClick={() => router.push('/dashboard')} style={styles.backButton}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <Navbar user={user} onLogout={handleLogout} />
      <div style={styles.content}>
        <h1 style={styles.title}>Department Enrollments</h1>
        <p style={styles.subtitle}>
          Total enrollments: <strong>{enrollments.length}</strong>
        </p>

        <div style={styles.filtersContainer}>
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />

          <select
            value={filterByCourse}
            onChange={(e) => setFilterByCourse(e.target.value)}
            style={styles.selectInput}
          >
            <option value="">All Courses</option>
            {uniqueCourses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>

          <select
            value={filterByStatus}
            onChange={(e) => setFilterByStatus(e.target.value)}
            style={styles.selectInput}
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          {(searchTerm || filterByCourse || filterByStatus) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterByCourse('');
                setFilterByStatus('');
              }}
              style={styles.clearButton}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Student Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Course Code</th>
                <th style={styles.th}>Course Name</th>
                <th style={styles.th}>Semester</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Grade</th>
                <th style={styles.th}>Enrollment Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={styles.noData}>
                    No enrollments found
                  </td>
                </tr>
              ) : (
                paginatedEnrollments.map((enrollment) => (
                  <tr key={enrollment.enrollment_id} style={styles.tableRow}>
                    <td style={styles.td}>
                      {enrollment.first_name} {enrollment.last_name}
                    </td>
                    <td style={styles.td}>{enrollment.email}</td>
                    <td style={styles.td}>{enrollment.course_code}</td>
                    <td style={styles.td}>{enrollment.course_name}</td>
                    <td style={styles.td}>{enrollment.semester}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor:
                            enrollment.status === 'enrolled' ? '#27ae60' : '#e74c3c',
                        }}
                      >
                        {enrollment.status}
                      </span>
                    </td>
                    <td style={styles.td}>{enrollment.grade || '-'}</td>
                    <td style={styles.td}>
                      {new Date(enrollment.enrollment_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
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
  title: {
    color: '#2c3e50',
    marginBottom: '5px',
  },
  subtitle: {
    color: '#7f8c8d',
    marginBottom: '20px',
    fontSize: '14px',
  },
  filtersContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px',
  },
  searchInput: {
    padding: '10px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '14px',
  },
  selectInput: {
    padding: '10px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  clearButton: {
    padding: '10px 15px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflowX: 'auto',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  tableHeader: {
    backgroundColor: '#34495e',
    color: 'white',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
    borderBottom: '2px solid #3498db',
  },
  tableRow: {
    borderBottom: '1px solid #ecf0f1',
  },
  td: {
    padding: '12px',
    color: '#2c3e50',
  },
  noData: {
    textAlign: 'center',
    padding: '40px 12px',
    color: '#7f8c8d',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
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
  backButton: {
    padding: '10px 15px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
