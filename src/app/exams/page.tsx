'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/common/Navbar';
import { ExamList } from '@/components/exams/ExamList';

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

export default function ExamsPage() {
  const [user, setUser] = useState<any>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleExamSelect = (exam: Exam) => {
    console.log('Selected exam:', exam);
  };

  return (
    <div style={styles.pageContainer}>
      <Navbar user={user} onLogout={handleLogout} />
      <div style={styles.content}>
        <ExamList onExamSelect={handleExamSelect} />
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
};
