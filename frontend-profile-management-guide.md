# Frontend Profile Management Implementation Guide

## Overview
This guide provides implementation instructions for the 3 profile management features:
1. **Profile Information** - Update personal details and preferences
2. **Change Password** - Update password for account security  
3. **Notification Preferences** - Control notification settings

## Backend Endpoints Available

### Authentication Required
All endpoints require the user's JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### 1. Profile Information Endpoints

#### Get User Profile
```
GET /api/users/profile
Response: {
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John",
      "last_name": "Doe",
      "phone_number": "+1234567890",
      "passport": "AB123456",
      "country": "Indonesia",
      "address": "123 Street, City",
      "type": "user",
      "is_verified": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Update User Profile
```
PUT /api/users/profile
Body: {
  "name": "John",
  "last_name": "Doe", 
  "phone_number": "+1234567890",
  "passport": "AB123456",        // Optional
  "country": "Indonesia",        // Optional
  "address": "123 Street, City"  // Optional
}
Response: {
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "user": { /* updated user object */ }
  }
}
```

### 2. Change Password Endpoints

#### Change Password
```
PUT /api/users/change-password
Body: {
  "current_password": "oldpassword123",
  "new_password": "newpassword123",
  "confirm_password": "newpassword123"
}
Response: {
  "status": "success",
  "message": "Password changed successfully"
}
```

**Validation Rules:**
- Current password must be correct
- New password must be at least 6 characters
- New password and confirmation must match
- Google-only accounts cannot change password (will show specific error)

### 3. Notification Preferences Endpoints

#### Get Notification Preferences
```
GET /api/users/notification-preferences
Response: {
  "status": "success",
  "data": {
    "preferences": {
      "email_bookings": true,     // Email notifications for booking updates
      "email_promotions": false,  // Email notifications for promotions/offers
      "email_reminders": true,    // Email reminders for upcoming bookings
      "sms_bookings": false,      // SMS notifications for booking updates
      "sms_reminders": false      // SMS reminders for upcoming bookings
    }
  }
}
```

#### Update Notification Preferences
```
PUT /api/users/notification-preferences
Body: {
  "email_bookings": true,
  "email_promotions": false,
  "email_reminders": true,
  "sms_bookings": false,
  "sms_reminders": false
}
Response: {
  "status": "success",
  "message": "Notification preferences updated successfully",
  "data": {
    "preferences": { /* updated preferences */ }
  }
}
```

## Frontend Implementation Examples

### 1. Profile Information Component

```typescript
// ProfileInformation.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface UserProfile {
  id: number;
  email: string;
  name: string;
  last_name: string;
  phone_number: string;
  passport?: string;
  country?: string;
  address?: string;
}

const ProfileInformation: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    phone_number: '',
    passport: '',
    country: '',
    address: ''
  });

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data.user);
        setFormData({
          name: data.data.user.name,
          last_name: data.data.user.last_name,
          phone_number: data.data.user.phone_number,
          passport: data.data.user.passport || '',
          country: data.data.user.country || '',
          address: data.data.user.address || ''
        });
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      toast.error('Failed to load profile');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.data.user);
        setIsEditing(false);
        toast.success('Profile updated successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-information">
      <div className="profile-header">
        <h2>Profile Information</h2>
        <p>Update your personal details and preferences. These details help us personalize your island experience.</p>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="edit-button"
          >
            Edit Profile Information
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">First Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Last Name *</label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              value={formData.last_name}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone_number">Phone Number *</label>
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="+1234567890"
            />
          </div>

          <div className="form-group">
            <label htmlFor="passport">Passport Number</label>
            <input
              id="passport"
              name="passport"
              type="text"
              value={formData.passport}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Optional"
            />
          </div>

          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input
              id="country"
              name="country"
              type="text"
              value={formData.country}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Optional"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Optional"
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => {
                setIsEditing(false);
                // Reset form data
                setFormData({
                  name: profile.name,
                  last_name: profile.last_name,
                  phone_number: profile.phone_number,
                  passport: profile.passport || '',
                  country: profile.country || '',
                  address: profile.address || ''
                });
              }}
              className="cancel-button"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="save-button"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-display">
          <div className="profile-field">
            <label>Email</label>
            <span>{profile.email}</span>
          </div>
          <div className="profile-field">
            <label>Full Name</label>
            <span>{profile.name} {profile.last_name}</span>
          </div>
          <div className="profile-field">
            <label>Phone Number</label>
            <span>{profile.phone_number}</span>
          </div>
          {profile.passport && (
            <div className="profile-field">
              <label>Passport Number</label>
              <span>{profile.passport}</span>
            </div>
          )}
          {profile.country && (
            <div className="profile-field">
              <label>Country</label>
              <span>{profile.country}</span>
            </div>
          )}
          {profile.address && (
            <div className="profile-field">
              <label>Address</label>
              <span>{profile.address}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileInformation;
```

### 2. Change Password Component

```typescript
// ChangePassword.tsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';

const ChangePassword: React.FC = () => {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.new_password !== formData.confirm_password) {
      toast.error('New password and confirmation do not match');
      return;
    }

    // Validate password strength
    if (formData.new_password.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Password changed successfully');
        // Clear form
        setFormData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="change-password">
      <div className="password-header">
        <h2>Change Password</h2>
        <p>Update your password regularly to keep your account secure and protected.</p>
      </div>

      <form onSubmit={handleSubmit} className="password-form">
        <div className="form-group">
          <label htmlFor="current_password">Current Password *</label>
          <div className="password-input">
            <input
              id="current_password"
              name="current_password"
              type={showPasswords.current ? "text" : "password"}
              value={formData.current_password}
              onChange={handleInputChange}
              required
              className="form-input"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="password-toggle"
            >
              {showPasswords.current ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="new_password">New Password *</label>
          <div className="password-input">
            <input
              id="new_password"
              name="new_password"
              type={showPasswords.new ? "text" : "password"}
              value={formData.new_password}
              onChange={handleInputChange}
              required
              className="form-input"
              minLength={6}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="password-toggle"
            >
              {showPasswords.new ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <small className="field-hint">Minimum 6 characters</small>
        </div>

        <div className="form-group">
          <label htmlFor="confirm_password">Confirm New Password *</label>
          <div className="password-input">
            <input
              id="confirm_password"
              name="confirm_password"
              type={showPasswords.confirm ? "text" : "password"}
              value={formData.confirm_password}
              onChange={handleInputChange}
              required
              className="form-input"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="password-toggle"
            >
              {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={isLoading}
            className="change-password-button"
          >
            {isLoading ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
```

### 3. Notification Preferences Component

```typescript
// NotificationPreferences.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface NotificationPreferences {
  email_bookings: boolean;
  email_promotions: boolean;
  email_reminders: boolean;
  sms_bookings: boolean;
  sms_reminders: boolean;
}

const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_bookings: true,
    email_promotions: false,
    email_reminders: true,
    sms_bookings: false,
    sms_reminders: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/users/notification-preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.data.preferences);
      } else {
        toast.error('Failed to load notification preferences');
      }
    } catch (error) {
      console.error('Preferences fetch error:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/users/notification-preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        toast.success('Notification preferences updated successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Preferences update error:', error);
      toast.error('Failed to update preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading preferences...</div>;
  }

  return (
    <div className="notification-preferences">
      <div className="preferences-header">
        <h2>Notification Preferences</h2>
        <p>Control how and when you receive notifications about your bookings and our latest offers.</p>
      </div>

      <div className="preferences-form">
        <div className="preference-section">
          <h3>📧 Email Notifications</h3>
          <div className="preference-item">
            <div className="preference-info">
              <label>Booking Updates</label>
              <span>Get notified about booking confirmations, changes, and cancellations</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.email_bookings}
                onChange={() => handleToggle('email_bookings')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <label>Promotions & Offers</label>
              <span>Receive special deals, discounts, and promotional offers</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.email_promotions}
                onChange={() => handleToggle('email_promotions')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <label>Booking Reminders</label>
              <span>Get reminded about upcoming check-ins and important dates</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.email_reminders}
                onChange={() => handleToggle('email_reminders')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="preference-section">
          <h3>📱 SMS Notifications</h3>
          <div className="preference-item">
            <div className="preference-info">
              <label>Booking Updates</label>
              <span>Get SMS alerts for urgent booking updates</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.sms_bookings}
                onChange={() => handleToggle('sms_bookings')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <label>Booking Reminders</label>
              <span>Get SMS reminders for check-in and important dates</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.sms_reminders}
                onChange={() => handleToggle('sms_reminders')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="save-preferences-button"
          >
            {isSaving ? 'Saving...' : 'Manage Notifications'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
```

## CSS Styling Examples

```css
/* Profile Management Styles */
.profile-information,
.change-password,
.notification-preferences {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.profile-header,
.password-header,
.preferences-header {
  text-align: center;
  margin-bottom: 2rem;
}

.profile-header h2,
.password-header h2,
.preferences-header h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.profile-header p,
.password-header p,
.preferences-header p {
  color: #7f8c8d;
  line-height: 1.6;
}

/* Form Styles */
.profile-form,
.password-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #34495e;
}

.form-input,
.form-textarea {
  padding: 0.75rem;
  border: 2px solid #ecf0f1;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3498db;
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

/* Button Styles */
.edit-button,
.save-button,
.change-password-button,
.save-preferences-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-button:hover,
.save-button:hover,
.change-password-button:hover,
.save-preferences-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.cancel-button {
  padding: 0.75rem 1.5rem;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* Profile Display */
.profile-display {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-field {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-field label {
  font-weight: 600;
  color: #34495e;
}

.profile-field span {
  color: #2c3e50;
}

/* Notification Preferences */
.preference-section {
  margin-bottom: 2rem;
}

.preference-section h3 {
  color: #34495e;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.preference-info {
  flex: 1;
}

.preference-info label {
  display: block;
  font-weight: 600;
  color: #34495e;
  margin-bottom: 0.25rem;
}

.preference-info span {
  color: #7f8c8d;
  font-size: 0.9rem;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  width: 50px;
  height: 25px;
  cursor: pointer;
}

.toggle-switch input[type="checkbox"] {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  border-radius: 25px;
  transition: 0.4s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 19px;
  width: 19px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.4s;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #3498db;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(25px);
}

/* Loading States */
.loading {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
}

.field-hint {
  color: #7f8c8d;
  font-size: 0.8rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .profile-information,
  .change-password,
  .notification-preferences {
    padding: 1rem;
    margin: 1rem;
  }
  
  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
```

## Integration Notes

1. **Authentication**: All API calls require the JWT token stored in localStorage
2. **Error Handling**: Display user-friendly error messages using toast notifications
3. **Loading States**: Show loading indicators during API calls
4. **Validation**: Implement client-side validation for better UX
5. **Responsive Design**: Ensure components work well on mobile devices

## Database Migration

Don't forget to run the notification preferences migration:
```sql
-- Run this in your database
\i src/database/migrations/add_notification_preferences.sql
```

This implementation provides a complete, production-ready profile management system for your homestay booking platform! 