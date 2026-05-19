'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';


interface Exam {
  exam_id: number;
  course_id: number;
  course_name?: string;
  exam_name: string;
  exam_date: string;
  duration: number;
  total_marks: number;
  passing_marks: number;
  exam_type: string;
}

interface ExamListProps {
  onExamSelect?: (exam: Exam) => void;
  courseId?: number;
}

export const ExamList: React.FC<ExamListProps> = ({
  onExamSelect,
  courseId,
}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);  const itemsPerPage = 10;

  useEffect(() => {
    fetchExams();
  }, [courseId]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      let endpoint = '/api/exams-list';
      const params = new URLSearchParams();

      if (courseId) params.append('courseId', courseId.toString());

      if (params.toString()) endpoint += `?${params.toString()}`;

      const token = localStorage.getItem('token');
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch exams');
      const data = await response.json();
      setExams(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter(exam =>
    exam.exam_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.course_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedExams = filteredExams.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredExams.length / itemsPerPage);

  if (loading) {
    return <div style={styles.loadingContainer}>Loading exams...</div>;
  }

  if (error) {
    return <div style={styles.errorContainer}>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Exams</h1>
        <input
          type="text"
          placeholder="Search exams..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          style={styles.searchInput}
        />
      </div>

      {exams.length === 0 ? (
        <div style={styles.emptyContainer}>
          <p>No exams found</p>
        </div>
      ) : (
        <>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <div style={styles.headerCell}>Exam Name</div>
              <div style={styles.headerCell}>Course</div>
              <div style={styles.headerCell}>Date</div>
              <div style={styles.headerCell}>Duration</div>
              <div style={styles.headerCell}>Total Marks</div>
              <div style={styles.headerCell}>Type</div>
              <div style={styles.headerCell}>Action</div>
            </div>

            {paginatedExams.map((exam) => (
              <div key={exam.exam_id} style={styles.tableRow}>
                <div style={styles.cell}>{exam.exam_name}</div>
                <div style={styles.cell}>{exam.course_name || 'N/A'}</div>
                <div style={styles.cell}>
                  {new Date(exam.exam_date).toLocaleDateString()}
                </div>
                <div style={styles.cell}>{exam.duration} mins</div>
                <div style={styles.cell}>{exam.total_marks}</div>
                <div style={styles.cell}>{exam.exam_type}</div>
                <div style={styles.cell}>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    ...styles.pageButton,
                    ...(currentPage === page ? styles.pageButtonActive : {}),
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  header: {
    marginBottom: '20px',
  },
  searchInput: {
    width: '100%',
    padding: '10px',
    marginTop: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
  },
  table: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '15px',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  headerCell: {
    padding: '10px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: '1px solid #ecf0f1',
    padding: '15px',
    alignItems: 'center',
    fontSize: '14px',
  },
  cell: {
    padding: '10px',
    color: '#2c3e50',
  },
  actionButton: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  loadingContainer: {
    padding: '40px',
    textAlign: 'center',
    color: '#7f8c8d',
  },
  errorContainer: {
    padding: '20px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  emptyContainer: {
    padding: '40px',
    textAlign: 'center',
    color: '#7f8c8d',
    backgroundColor: 'white',
    borderRadius: '8px',
  },
  pagination: {
    display: 'flex',
    gap: '5px',
    marginTop: '20px',
    justifyContent: 'center',
  },
  pageButton: {
    padding: '8px 12px',
    backgroundColor: '#ecf0f1',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  pageButtonActive: {
    backgroundColor: '#3498db',
    color: 'white',
    border: '1px solid #3498db',
  },
};
