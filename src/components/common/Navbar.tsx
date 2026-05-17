'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface NavbarProps {
  user?: {
    username: string;
    email: string;
    role_id: number;
  };
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  return (
    <nav style={navbarStyles.container}>
      <div style={navbarStyles.content}>
        <Link href="/" style={navbarStyles.logo}>
          <span>DUMS</span>
        </Link>

        <div style={navbarStyles.links}>
          <Link href="/dashboard" style={navbarStyles.link}>
            Dashboard
          </Link>
          <Link href="/students" style={navbarStyles.link}>
            Students
          </Link>
          <Link href="/courses" style={navbarStyles.link}>
            Courses
          </Link>
          <Link href="/faculty" style={navbarStyles.link}>
            Faculty
          </Link>
        </div>

        <div style={navbarStyles.userSection}>
          {user ? (
            <>
              <span style={navbarStyles.userInfo}>
                {user.username} ({getRoleName(user.role_id)})
              </span>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={navbarStyles.menuButton}
              >
                Menu
              </button>
              {isMenuOpen && (
                <div style={navbarStyles.dropdown}>
                  <Link href="/profile" style={navbarStyles.dropdownLink}>
                    Profile
                  </Link>
                  <Link href="/settings" style={navbarStyles.dropdownLink}>
                    Settings
                  </Link>
                  <button
                    onClick={onLogout}
                    style={navbarStyles.logoutButton}
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link href="/login" style={navbarStyles.loginLink}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

const navbarStyles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#2c3e50',
    color: '#ecf0f1',
    padding: '0 20px',
    borderBottom: '2px solid #3498db',
  },
  content: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    height: '60px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#3498db',
    textDecoration: 'none',
  },
  links: {
    display: 'flex',
    gap: '30px',
    flex: 1,
    justifyContent: 'center',
  },
  link: {
    color: '#ecf0f1',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    position: 'relative',
  },
  userInfo: {
    fontSize: '14px',
  },
  menuButton: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  dropdown: {
    position: 'absolute',
    right: '0',
    top: '100%',
    backgroundColor: '#34495e',
    borderRadius: '4px',
    minWidth: '150px',
    marginTop: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  dropdownLink: {
    display: 'block',
    padding: '10px 15px',
    color: '#ecf0f1',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  logoutButton: {
    width: '100%',
    padding: '10px 15px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  loginLink: {
    backgroundColor: '#3498db',
    color: 'white',
    textDecoration: 'none',
    padding: '8px 15px',
    borderRadius: '4px',
  },
};

export default Navbar;
