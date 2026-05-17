'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/common/Navbar';
import { Faculty } from '@/lib/types';

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const response = await fetch('/api/faculty', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setFaculty(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch faculty:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const filteredFaculty = faculty.filter(
    (f) =>
      f.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.pageContainer}>
      <Navbar user={user} onLogout={handleLogout} />
      <div style={styles.container}>
        <div style={styles.header}>
          <h1>Faculty Members</h1>
        </div>

        <input
          type="text"
          placeholder="Search faculty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />

        {loading ? (
          <div style={styles.loadingContainer}>Loading faculty...</div>
        ) : (
          <div style={styles.facultyGrid}>
            {filteredFaculty.map((f) => (
              <div key={f.faculty_id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3>
                    {f.first_name} {f.last_name}
                  </h3>
                  <span style={styles.employeeId}>{f.employee_id}</span>
                </div>
                <div style={styles.cardBody}>
                  <p>
                    <strong>Email:</strong> {f.email}
                  </p>
                  <p>
                    <strong>Status:</strong> {f.status}
                  </p>
                  <p>
                    <strong>Specialization:</strong> {f.specialization || 'N/A'}
                  </p>
                </div>
                <div style={styles.cardFooter}>
                  <Link
                    href={`/faculty/${f.faculty_id}`}
                    style={styles.viewLink}
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
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
    marginBottom: '30px',
  },
  searchInput: {
    width: '100%',
    padding: '12px',
    marginBottom: '30px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  facultyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#34495e',
    color: 'white',
    padding: '15px',
  },
  employeeId: {
    fontSize: '12px',
    opacity: 0.8,
  },
  cardBody: {
    padding: '15px',
  },
  cardFooter: {
    padding: '15px',
    borderTop: '1px solid #ecf0f1',
  },
  viewLink: {
    display: 'block',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#3498db',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
  },
  loadingContainer: {
    padding: '40px',
    textAlign: 'center',
    color: '#7f8c8d',
  },
};
