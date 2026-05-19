'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Student } from '@/lib/types';
import ShareModal from '@/components/links/ShareModal';

interface StudentListProps {
  onStudentSelect?: (student: Student) => void;
  departmentId?: number;
}

export const StudentList: React.FC<StudentListProps> = ({
  onStudentSelect,
  departmentId,
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [shareModal, setShareModal] = useState<{ isOpen: boolean; studentId: string; studentName: string }>({
    isOpen: false,
    studentId: '',
    studentName: '',
  });
  const itemsPerPage = 10;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchStudents();
    } else {
      setLoading(false);
      setError('Please login first');
    }
  }, [departmentId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const endpoint = departmentId
        ? `/api/students?departmentId=${departmentId}`
        : '/api/students';
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(endpoint, { headers });
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  if (loading) {
    return <div style={styles.loadingContainer}>Loading students...</div>;
  }

  if (error) {
    return <div style={styles.errorContainer}>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Students</h2>
        <Link href="/students/create" style={styles.createButton}>
          Create New Student
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search by name or email..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
        style={styles.searchInput}
      />

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Enrollment ID</th>
              <th style={styles.th}>GPA</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map((student) => (
              <tr key={student.student_id} style={styles.bodyRow}>
                <td style={styles.td}>
                  {student.first_name} {student.last_name}
                </td>
                <td style={styles.td}>{student.email}</td>
                <td style={styles.td}>{student.enrollment_id}</td>
                <td style={styles.td}>{student.gpa?.toFixed(2) || 'N/A'}</td>
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
                <td style={styles.td}>
                  <Link
                    href={`/students/${student.student_id}`}
                    style={styles.actionLink}
                  >
                    View
                  </Link>
                  <button
                    onClick={() => onStudentSelect?.(student)}
                    style={styles.actionButton}
                  >
                    Select
                  </button>
                  <button
                    onClick={() =>
                      setShareModal({
                        isOpen: true,
                        studentId: student.student_id?.toString() || '',
                        studentName: `${student.first_name} ${student.last_name}`,
                      })
                    }
                    style={{ ...styles.actionButton, backgroundColor: '#9b59b6', marginLeft: '5px' }}
                  >
                    Share
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ ...shareModal, isOpen: false })}
        dataType="student"
        dataId={shareModal.studentId}
        dataName={shareModal.studentName}
      />
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
  tableWrapper: {
    overflowX: 'auto',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
  actionLink: {
    color: '#3498db',
    textDecoration: 'none',
    marginRight: '10px',
    cursor: 'pointer',
  },
  actionButton: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
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

export default StudentList;
