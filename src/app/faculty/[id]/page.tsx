'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/common/Navbar';
import { Faculty } from '@/lib/types';

export default function FacultyProfilePage() {
  const params = useParams();
  const facultyId = params.id as string;

  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchFacultyProfile();
  }, [facultyId]);

  const fetchFacultyProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/faculty/${facultyId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch faculty profile');
      const data = await response.json();
      setFaculty(data.data || data);
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
        <div style={styles.container}>
          <div style={styles.loadingContainer}>Loading faculty profile...</div>
        </div>
      </div>
    );
  }

  if (error || !faculty) {
    return (
      <div style={styles.pageContainer}>
        <Navbar user={user} onLogout={handleLogout} />
        <div style={styles.container}>
          <div style={styles.errorContainer}>Error: {error || 'Faculty not found'}</div>
          <Link href="/faculty" style={styles.backButton}>
            Back to Faculty List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <Navbar user={user} onLogout={handleLogout} />
      <div style={styles.container}>
        <Link href="/faculty" style={styles.backButton}>
          ← Back to Faculty List
        </Link>

        <div style={styles.profileCard}>
          <div style={styles.profileHeader}>
            <h1>
              {faculty.first_name} {faculty.last_name}
            </h1>
            <span style={styles.facultyId}>Faculty ID: {faculty.faculty_id}</span>
          </div>

          <div style={styles.profileBody}>
            <div style={styles.section}>
              <h2>Contact Information</h2>
              <div style={styles.infoRow}>
                <span style={styles.label}>Email:</span>
                <span style={styles.value}>{faculty.email}</span>
              </div>
            </div>

            <div style={styles.section}>
              <h2>Professional Details</h2>
              <div style={styles.infoRow}>
                <span style={styles.label}>Status:</span>
                <span style={{ ...styles.value, color: faculty.status === 'active' ? '#27ae60' : '#e74c3c' }}>
                  {faculty.status}
                </span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Qualification:</span>
                <span style={styles.value}>{faculty.qualification || 'N/A'}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.label}>Specialization:</span>
                <span style={styles.value}>{faculty.specialization || 'N/A'}</span>
              </div>
              {faculty.hiring_date && (
                <div style={styles.infoRow}>
                  <span style={styles.label}>Hiring Date:</span>
                  <span style={styles.value}>
                    {new Date(faculty.hiring_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
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
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
  },
  backButton: {
    display: 'inline-block',
    padding: '10px 20px',
    marginBottom: '30px',
    backgroundColor: '#95a5a6',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  profileHeader: {
    backgroundColor: '#34495e',
    color: 'white',
    padding: '30px',
    borderBottom: '4px solid #3498db',
  },
  facultyId: {
    display: 'block',
    fontSize: '14px',
    opacity: 0.8,
    marginTop: '10px',
  },
  profileBody: {
    padding: '30px',
  },
  section: {
    marginBottom: '30px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingBottom: '12px',
    borderBottom: '1px solid #ecf0f1',
    marginBottom: '12px',
  },
  label: {
    fontWeight: 'bold',
    color: '#2c3e50',
    minWidth: '150px',
  },
  value: {
    color: '#7f8c8d',
    textAlign: 'right',
    flex: 1,
  },
  loadingContainer: {
    padding: '40px',
    textAlign: 'center',
    color: '#7f8c8d',
  },
  errorContainer: {
    padding: '40px',
    textAlign: 'center',
    color: '#e74c3c',
    backgroundColor: '#fadbd8',
    borderRadius: '4px',
  },
};
