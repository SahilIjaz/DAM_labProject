import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>University Management System</h1>
        <p style={styles.subtitle}>
          A distributed system for managing academic institutions
        </p>

        <div style={styles.features}>
          <div style={styles.feature}>
            <h3>📚 Student Management</h3>
            <p>Manage student records, enrollments, and academic progress</p>
          </div>
          <div style={styles.feature}>
            <h3>👨‍🏫 Faculty Management</h3>
            <p>Track faculty information and course assignments</p>
          </div>
          <div style={styles.feature}>
            <h3>🎓 Course Management</h3>
            <p>Create and manage courses with enrollment tracking</p>
          </div>
          <div style={styles.feature}>
            <h3>📊 Analytics</h3>
            <p>View comprehensive performance analytics and reports</p>
          </div>
        </div>

        <div style={styles.actions}>
          <Link href="/login" style={styles.primaryButton}>
            Login
          </Link>
          <Link href="/register" style={styles.secondaryButton}>
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#ecf0f1',
    padding: '20px',
  },
  content: {
    textAlign: 'center',
    maxWidth: '800px',
  },
  title: {
    fontSize: '42px',
    color: '#2c3e50',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#7f8c8d',
    marginBottom: '40px',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  feature: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  actions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
  },
  primaryButton: {
    display: 'inline-block',
    padding: '12px 30px',
    backgroundColor: '#3498db',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  secondaryButton: {
    display: 'inline-block',
    padding: '12px 30px',
    backgroundColor: '#27ae60',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};
