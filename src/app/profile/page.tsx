'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/common/Navbar';

interface UserProfile {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  role_name: string;
  status: string;
  created_at: string;
  last_login: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
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
          <h1>User Profile</h1>
          <p style={styles.subtitle}>View and manage your profile information</p>
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>Loading profile...</div>
        ) : profile ? (
          <div style={styles.profileCard}>
            <div style={styles.profileSection}>
              <h2>Personal Information</h2>
              <div style={styles.fieldGroup}>
                <div style={styles.field}>
                  <label style={styles.label}>First Name</label>
                  <p style={styles.value}>{profile.first_name}</p>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Last Name</label>
                  <p style={styles.value}>{profile.last_name}</p>
                </div>
              </div>
            </div>

            <div style={styles.profileSection}>
              <h2>Account Information</h2>
              <div style={styles.fieldGroup}>
                <div style={styles.field}>
                  <label style={styles.label}>Username</label>
                  <p style={styles.value}>{profile.username}</p>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Email</label>
                  <p style={styles.value}>{profile.email}</p>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Role</label>
                  <p style={styles.value}>{profile.role_name}</p>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Status</label>
                  <p style={styles.statusValue(profile.status)}>{profile.status}</p>
                </div>
              </div>
            </div>

            <div style={styles.profileSection}>
              <h2>System Information</h2>
              <div style={styles.fieldGroup}>
                <div style={styles.field}>
                  <label style={styles.label}>User ID</label>
                  <p style={styles.value}>{profile.user_id}</p>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Member Since</label>
                  <p style={styles.value}>
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Last Login</label>
                  <p style={styles.value}>
                    {profile.last_login
                      ? new Date(profile.last_login).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.errorContainer}>
            <p>Failed to load profile. Please try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, any> = {
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
  header: {
    marginBottom: '40px',
  },
  subtitle: {
    color: '#7f8c8d',
    fontSize: '16px',
    margin: '10px 0 0 0',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  profileSection: {
    padding: '30px',
    borderBottom: '1px solid #ecf0f1',
  } as React.CSSProperties,
  fieldGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '15px',
  } as React.CSSProperties,
  field: {
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,
  label: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#7f8c8d',
    textTransform: 'uppercase',
    marginBottom: '8px',
  } as React.CSSProperties,
  value: {
    fontSize: '16px',
    color: '#2c3e50',
    margin: '0',
  } as React.CSSProperties,
  statusValue: (status: string) => ({
    fontSize: '16px',
    color: status === 'active' ? '#27ae60' : '#e74c3c',
    fontWeight: 'bold',
    margin: '0',
  } as React.CSSProperties),
  loadingContainer: {
    padding: '40px',
    textAlign: 'center',
    color: '#7f8c8d',
  } as React.CSSProperties,
  errorContainer: {
    padding: '40px',
    textAlign: 'center',
    color: '#e74c3c',
    backgroundColor: 'white',
    borderRadius: '8px',
  } as React.CSSProperties,
};
