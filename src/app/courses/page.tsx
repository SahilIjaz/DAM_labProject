'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/common/Navbar';
import { CourseList } from '@/components/courses/CourseList';
import { Course } from '@/lib/types';

export default function CoursesPage() {
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

  const handleCourseSelect = (course: Course) => {
    console.log('Selected course:', course);
  };

  return (
    <div style={styles.pageContainer}>
      <Navbar user={user} onLogout={handleLogout} />
      <div style={styles.content}>
        <CourseList onCourseSelect={handleCourseSelect} />
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
