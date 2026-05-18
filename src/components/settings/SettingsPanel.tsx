'use client';

import React, { useState, useEffect } from 'react';

interface SettingsData {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  twoFactorEnabled: boolean;
  theme: 'light' | 'dark';
  language: string;
}

export const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    twoFactorEnabled: false,
    theme: 'light',
    language: 'en',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleToggle = (key: keyof SettingsData) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleChange = (key: keyof SettingsData, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings));
      setMessage('Settings saved successfully');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Settings</h1>

      {message && (
        <div style={styles.messageContainer}>
          {message}
        </div>
      )}

      <div style={styles.settingsGrid}>
        <div style={styles.settingsSection}>
          <h2>Notifications</h2>

          <div style={styles.settingItem}>
            <label style={styles.label}>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
                style={styles.checkbox}
              />
              Email Notifications
            </label>
            <p style={styles.description}>Receive email notifications for important updates</p>
          </div>

          <div style={styles.settingItem}>
            <label style={styles.label}>
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={() => handleToggle('pushNotifications')}
                style={styles.checkbox}
              />
              Push Notifications
            </label>
            <p style={styles.description}>Receive push notifications on your device</p>
          </div>

          <div style={styles.settingItem}>
            <label style={styles.label}>
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={() => handleToggle('smsNotifications')}
                style={styles.checkbox}
              />
              SMS Notifications
            </label>
            <p style={styles.description}>Receive SMS notifications for urgent updates</p>
          </div>
        </div>

        <div style={styles.settingsSection}>
          <h2>Security</h2>

          <div style={styles.settingItem}>
            <label style={styles.label}>
              <input
                type="checkbox"
                checked={settings.twoFactorEnabled}
                onChange={() => handleToggle('twoFactorEnabled')}
                style={styles.checkbox}
              />
              Two-Factor Authentication
            </label>
            <p style={styles.description}>Enable two-factor authentication for added security</p>
          </div>
        </div>

        <div style={styles.settingsSection}>
          <h2>Preferences</h2>

          <div style={styles.settingItem}>
            <label style={styles.label}>Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              style={styles.select}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <p style={styles.description}>Choose your preferred color theme</p>
          </div>

          <div style={styles.settingItem}>
            <label style={styles.label}>Language</label>
            <select
              value={settings.language}
              onChange={(e) => handleChange('language', e.target.value)}
              style={styles.select}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ur">Urdu</option>
            </select>
            <p style={styles.description}>Select your preferred language</p>
          </div>
        </div>
      </div>

      <div style={styles.buttonContainer}>
        <button onClick={handleSave} disabled={saving} style={styles.saveButton}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  messageContainer: {
    padding: '12px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '30px',
    marginTop: '30px',
    marginBottom: '30px',
  },
  settingsSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  settingItem: {
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid #ecf0f1',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 'bold',
    color: '#2c3e50',
    cursor: 'pointer',
    fontSize: '14px',
  },
  checkbox: {
    marginRight: '10px',
    cursor: 'pointer',
    width: '18px',
    height: '18px',
  },
  select: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #bdc3c7',
    fontSize: '14px',
    marginTop: '8px',
    boxSizing: 'border-box',
  },
  description: {
    margin: '8px 0 0 28px',
    fontSize: '12px',
    color: '#7f8c8d',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  saveButton: {
    padding: '12px 30px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};
