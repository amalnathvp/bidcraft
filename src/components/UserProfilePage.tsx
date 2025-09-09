import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profileImage?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    marketingEmails: boolean;
    bidAlerts: boolean;
    currency: string;
    language: string;
  };
  stats: {
    totalBids: number;
    wonAuctions: number;
    totalSpent: number;
    memberSince: string;
    lastActive: string;
  };
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  role: string;
}

interface UserProfilePageProps {
  onNavigate?: (page: string, data?: any) => void;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ onNavigate }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [newPassword, setNewPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/users/profile');
      
      if (response.success) {
        setProfile(response.data);
      } else {
        setError('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!profile) return;

    try {
      const formData = new FormData();
      
      // Add profile data
      Object.entries(profile).forEach(([key, value]) => {
        if (key === 'address' && value) {
          formData.append('address', JSON.stringify(value));
        } else if (key === 'preferences' && value) {
          formData.append('preferences', JSON.stringify(value));
        } else if (key !== 'stats' && key !== '_id' && value !== null) {
          formData.append(key, String(value));
        }
      });

      // Add image if selected
      if (imageFile) {
        formData.append('profileImage', imageFile);
      }

      const response = await apiService.put('/users/profile', formData);
      
      if (response.success) {
        setProfile(response.data);
        setEditing(false);
        setImageFile(null);
        setImagePreview('');
        alert('Profile updated successfully');
      } else {
        alert(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const changePassword = async () => {
    if (newPassword.newPassword !== newPassword.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword.newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    try {
      const response = await apiService.put('/users/change-password', {
        currentPassword: newPassword.currentPassword,
        newPassword: newPassword.newPassword
      });
      
      if (response.success) {
        setNewPassword({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        alert('Password changed successfully');
      } else {
        alert(response.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password');
    }
  };

  const deleteAccount = async () => {
    const confirmation = prompt(
      'This action cannot be undone. Type "DELETE" to confirm account deletion:'
    );
    
    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      const response = await apiService.delete('/users/profile');
      
      if (response.success) {
        alert('Account deleted successfully');
        // Redirect to home or login page
        onNavigate?.('login');
      } else {
        alert(response.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const verifyEmail = async () => {
    try {
      const response = await apiService.post('/users/send-verification-email', {});
      
      if (response.success) {
        alert('Verification email sent! Please check your inbox.');
      } else {
        alert(response.message || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      alert('Failed to send verification email');
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Failed to load profile</h3>
          <button className="btn-primary" onClick={fetchProfile}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => onNavigate?.('home')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <h1>
            <i className="fas fa-user-circle"></i>
            My Profile
          </h1>
          <button 
            className="btn-primary"
            onClick={() => setEditing(!editing)}
          >
            <i className={`fas ${editing ? 'fa-times' : 'fa-edit'}`}></i>
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        <div className="profile-layout">
          <div className="profile-sidebar">
            <div className="profile-card">
              <div className="profile-image-container">
                <div className="profile-image">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile Preview" />
                  ) : profile.profileImage ? (
                    <img src={profile.profileImage} alt="Profile" />
                  ) : (
                    <i className="fas fa-user"></i>
                  )}
                </div>
                {editing && (
                  <div className="image-upload">
                    <input
                      type="file"
                      id="profileImage"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="profileImage" className="upload-btn">
                      <i className="fas fa-camera"></i>
                      Change Photo
                    </label>
                  </div>
                )}
              </div>
              
              <div className="profile-info">
                <h2>{profile.firstName} {profile.lastName}</h2>
                <p className="username">@{profile.username}</p>
                <p className="member-since">
                  Member since {new Date(profile.stats.memberSince).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </p>
              </div>

              <div className="profile-stats">
                <div className="stat-item">
                  <div className="stat-value">{profile.stats.totalBids}</div>
                  <div className="stat-label">Total Bids</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{profile.stats.wonAuctions}</div>
                  <div className="stat-label">Won Auctions</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">${profile.stats.totalSpent}</div>
                  <div className="stat-label">Total Spent</div>
                </div>
              </div>
            </div>

            <div className="verification-status">
              <div className={`verification-item ${profile.isEmailVerified ? 'verified' : 'pending'}`}>
                <i className={`fas ${profile.isEmailVerified ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                <span>Email {profile.isEmailVerified ? 'Verified' : 'Not Verified'}</span>
                {!profile.isEmailVerified && (
                  <button className="verify-btn" onClick={verifyEmail}>
                    Verify
                  </button>
                )}
              </div>
              <div className={`verification-item ${profile.isPhoneVerified ? 'verified' : 'pending'}`}>
                <i className={`fas ${profile.isPhoneVerified ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                <span>Phone {profile.isPhoneVerified ? 'Verified' : 'Not Verified'}</span>
              </div>
            </div>
          </div>

          <div className="profile-content">
            <div className="profile-tabs">
              <button
                className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="fas fa-user"></i>
                Profile Info
              </button>
              <button
                className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <i className="fas fa-lock"></i>
                Security
              </button>
              <button
                className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
                onClick={() => setActiveTab('preferences')}
              >
                <i className="fas fa-cog"></i>
                Preferences
              </button>
            </div>

            {activeTab === 'profile' && (
              <div className="tab-content">
                <div className="form-section">
                  <h3>Personal Information</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                    <div className="form-group">
                      <label>Username</label>
                      <input
                        type="text"
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled={true} // Email cannot be changed
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={profile.phoneNumber || ''}
                        onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Address</h3>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Street Address</label>
                      <input
                        type="text"
                        value={profile.address?.street || ''}
                        onChange={(e) => setProfile({ 
                          ...profile, 
                          address: { ...profile.address!, street: e.target.value }
                        })}
                        disabled={!editing}
                      />
                    </div>
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={profile.address?.city || ''}
                        onChange={(e) => setProfile({ 
                          ...profile, 
                          address: { ...profile.address!, city: e.target.value }
                        })}
                        disabled={!editing}
                      />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input
                        type="text"
                        value={profile.address?.state || ''}
                        onChange={(e) => setProfile({ 
                          ...profile, 
                          address: { ...profile.address!, state: e.target.value }
                        })}
                        disabled={!editing}
                      />
                    </div>
                    <div className="form-group">
                      <label>Postal Code</label>
                      <input
                        type="text"
                        value={profile.address?.postalCode || ''}
                        onChange={(e) => setProfile({ 
                          ...profile, 
                          address: { ...profile.address!, postalCode: e.target.value }
                        })}
                        disabled={!editing}
                      />
                    </div>
                    <div className="form-group">
                      <label>Country</label>
                      <input
                        type="text"
                        value={profile.address?.country || ''}
                        onChange={(e) => setProfile({ 
                          ...profile, 
                          address: { ...profile.address!, country: e.target.value }
                        })}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                </div>

                {editing && (
                  <div className="form-actions">
                    <button className="btn-primary" onClick={updateProfile}>
                      Save Changes
                    </button>
                    <button className="btn-ghost" onClick={() => {
                      setEditing(false);
                      fetchProfile();
                    }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="tab-content">
                <div className="form-section">
                  <h3>Change Password</h3>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Current Password</label>
                      <input
                        type="password"
                        value={newPassword.currentPassword}
                        onChange={(e) => setNewPassword({ ...newPassword, currentPassword: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        value={newPassword.newPassword}
                        onChange={(e) => setNewPassword({ ...newPassword, newPassword: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        value={newPassword.confirmPassword}
                        onChange={(e) => setNewPassword({ ...newPassword, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                  <button className="btn-primary" onClick={changePassword}>
                    Change Password
                  </button>
                </div>

                <div className="form-section danger-zone">
                  <h3>Danger Zone</h3>
                  <p>Once you delete your account, there is no going back. Please be certain.</p>
                  <button className="btn-danger" onClick={deleteAccount}>
                    <i className="fas fa-trash"></i>
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="tab-content">
                <div className="form-section">
                  <h3>Notification Preferences</h3>
                  <div className="preference-list">
                    <div className="preference-item">
                      <div className="preference-info">
                        <h4>Email Notifications</h4>
                        <p>Receive notifications via email</p>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={profile.preferences.emailNotifications}
                          onChange={(e) => setProfile({
                            ...profile,
                            preferences: { ...profile.preferences, emailNotifications: e.target.checked }
                          })}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="preference-item">
                      <div className="preference-info">
                        <h4>Push Notifications</h4>
                        <p>Receive push notifications</p>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={profile.preferences.pushNotifications}
                          onChange={(e) => setProfile({
                            ...profile,
                            preferences: { ...profile.preferences, pushNotifications: e.target.checked }
                          })}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="preference-item">
                      <div className="preference-info">
                        <h4>Marketing Emails</h4>
                        <p>Receive promotional emails and updates</p>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={profile.preferences.marketingEmails}
                          onChange={(e) => setProfile({
                            ...profile,
                            preferences: { ...profile.preferences, marketingEmails: e.target.checked }
                          })}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    <div className="preference-item">
                      <div className="preference-info">
                        <h4>Bid Alerts</h4>
                        <p>Get notified when you're outbid</p>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={profile.preferences.bidAlerts}
                          onChange={(e) => setProfile({
                            ...profile,
                            preferences: { ...profile.preferences, bidAlerts: e.target.checked }
                          })}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>Regional Preferences</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Currency</label>
                      <select
                        value={profile.preferences.currency}
                        onChange={(e) => setProfile({
                          ...profile,
                          preferences: { ...profile.preferences, currency: e.target.value }
                        })}
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Language</label>
                      <select
                        value={profile.preferences.language}
                        onChange={(e) => setProfile({
                          ...profile,
                          preferences: { ...profile.preferences, language: e.target.value }
                        })}
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-primary" onClick={updateProfile}>
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .profile-page {
          min-height: 100vh;
          background: #f8fafc;
          padding: 2rem 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .back-button {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .page-header h1 {
          margin: 0;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .profile-layout {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 2rem;
        }

        .profile-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .profile-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .profile-image-container {
          margin-bottom: 1.5rem;
        }

        .profile-image {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem auto;
          overflow: hidden;
          border: 4px solid #fff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .profile-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-image i {
          font-size: 3rem;
          color: #6b7280;
        }

        .upload-btn {
          background: #3b82f6;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: background 0.2s;
        }

        .upload-btn:hover {
          background: #2563eb;
        }

        .profile-info h2 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
        }

        .username {
          color: #6b7280;
          margin: 0 0 0.5rem 0;
        }

        .member-since {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0;
        }

        .profile-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .verification-status {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .verification-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .verification-item:last-child {
          margin-bottom: 0;
        }

        .verification-item.verified {
          color: #10b981;
        }

        .verification-item.pending {
          color: #f59e0b;
        }

        .verify-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          margin-left: auto;
        }

        .profile-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .profile-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab-btn {
          flex: 1;
          padding: 1rem;
          border: none;
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
        }

        .tab-btn.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background: #f8fafc;
        }

        .tab-content {
          padding: 2rem;
        }

        .form-section {
          margin-bottom: 2.5rem;
        }

        .form-section h3 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          margin-bottom: 0.5rem;
          color: #374151;
          font-weight: 500;
        }

        .form-group input,
        .form-group select {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .form-group input:disabled {
          background: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .preference-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .preference-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .preference-info h4 {
          margin: 0 0 0.25rem 0;
          color: #1f2937;
        }

        .preference-info p {
          margin: 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #3b82f6;
        }

        input:checked + .slider:before {
          transform: translateX(26px);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .btn-primary, .btn-ghost, .btn-danger {
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
          border: none;
        }

        .btn-ghost {
          background: none;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
          border: none;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-ghost:hover {
          background: #f9fafb;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .danger-zone {
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 1.5rem;
          background: #fef2f2;
        }

        .danger-zone h3 {
          color: #dc2626;
          border-color: #fecaca;
        }

        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          gap: 1rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-banner {
          background: #fef2f2;
          color: #dc2626;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .profile-layout {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .page-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .profile-tabs {
            flex-direction: column;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            justify-content: stretch;
          }

          .form-actions button {
            flex: 1;
          }

          .profile-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default UserProfilePage;
