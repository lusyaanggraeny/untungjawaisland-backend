# Google OAuth Implementation Guide

## 🎯 Overview

You now have a complete Google OAuth 2.0 authentication system that works alongside your existing email/password authentication. Users can:

1. **Sign up/Login with Google** (new users)
2. **Link Google to existing accounts** (existing users)
3. **Use either authentication method** (flexible login)

## 🚀 What We've Built

### Backend Components

#### 1. Database Schema (`src/database/migrations/add_oauth_support.sql`)
- ✅ OAuth columns added to both user tables
- ✅ OAuth sessions tracking table
- ✅ Performance indexes
- ✅ Auth method tracking (`email`, `google`, `both`)

#### 2. OAuth Service (`src/services/oauth.service.ts`)
- ✅ Google OAuth URL generation
- ✅ OAuth callback handling
- ✅ Account linking/unlinking
- ✅ User type detection (landing/admin)
- ✅ Token management

#### 3. OAuth Controller (`src/controllers/oauth.controller.ts`)
- ✅ Authentication initiation
- ✅ Callback processing
- ✅ Account management endpoints
- ✅ Status checking

#### 4. OAuth Routes (`src/routes/oauth.routes.ts`)
- ✅ Public OAuth endpoints
- ✅ Protected account management
- ✅ Proper middleware integration

## 📋 Implementation Steps

### Step 1: Add Environment Variables

Add these to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/oauth/google/callback

# Frontend URL (for redirects after OAuth)
FRONTEND_URL=http://localhost:3000
```

### Step 2: Set Up Google Cloud Console

Follow the guide in `docs/google-oauth-setup.md` to:
1. Create Google Cloud project
2. Enable APIs
3. Configure OAuth consent screen
4. Create credentials

### Step 3: Test the Backend

Start your server:
```bash
npm run dev
```

Test endpoints:
- `GET /api/oauth/google?type=landing` - Initiate Google OAuth for customers
- `GET /api/oauth/google?type=admin` - Initiate Google OAuth for admins
- `GET /api/oauth/google/callback` - OAuth callback (automatic)
- `GET /api/oauth/status` - Check OAuth status (authenticated)

## 🔗 API Endpoints

### Public Endpoints

#### Initiate Google OAuth
```
GET /api/oauth/google?type={landing|admin}
```
Redirects user to Google for authentication.

#### OAuth Callback
```
GET /api/oauth/google/callback?code={code}&state={state}
```
Handles Google's response and redirects to frontend with token.

#### Get OAuth URL (AJAX)
```
GET /api/oauth/google/url?type={landing|admin}
```
Returns: `{ auth_url: "https://accounts.google.com/..." }`

### Protected Endpoints (Require Authentication)

#### Check OAuth Status
```
GET /api/oauth/status
Authorization: Bearer {token}
```
Returns user's OAuth linking status.

#### Link Google Account
```
POST /api/oauth/google/link
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "authorization_code",
  "state": "state_parameter"
}
```

#### Unlink Google Account
```
DELETE /api/oauth/google/unlink
Authorization: Bearer {token}
```

## 🎨 Frontend Integration Examples

### React Example

```jsx
// GoogleSignInButton.tsx
import React from 'react';

const GoogleSignInButton = ({ userType = 'landing' }) => {
  const handleGoogleLogin = () => {
    // Direct redirect method
    window.location.href = `${process.env.REACT_APP_API_URL}/api/oauth/google?type=${userType}`;
  };

  return (
    <button onClick={handleGoogleLogin} className="google-signin-btn">
      <img src="/google-icon.svg" alt="Google" />
      Continue with Google
    </button>
  );
};

// Or popup method
const GoogleSignInPopup = ({ userType = 'landing' }) => {
  const handleGoogleLogin = async () => {
    try {
      // Get OAuth URL
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/oauth/google/url?type=${userType}`);
      const { data } = await response.json();
      
      // Open popup
      const popup = window.open(data.auth_url, 'google-oauth', 'width=500,height=600');
      
      // Listen for popup completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Refresh or check authentication status
          window.location.reload();
        }
      }, 1000);
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  return (
    <button onClick={handleGoogleLogin} className="google-signin-btn">
      <img src="/google-icon.svg" alt="Google" />
      Continue with Google
    </button>
  );
};
```

### Handling OAuth Success

```jsx
// In your login/dashboard component
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const isNew = urlParams.get('is_new');
  const error = urlParams.get('error');

  if (token) {
    // Store token
    localStorage.setItem('authToken', token);
    
    // Show welcome message for new users
    if (isNew === 'true') {
      showWelcomeMessage();
    }
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Redirect to dashboard
    navigate('/dashboard');
  } else if (error) {
    // Handle errors
    switch(error) {
      case 'oauth_cancelled':
        showError('Google authentication was cancelled');
        break;
      case 'oauth_error':
        showError('Authentication failed. Please try again.');
        break;
      default:
        showError('An error occurred during authentication');
    }
  }
}, []);
```

### Account Linking Component

```jsx
// AccountSettings.tsx
const AccountSettings = () => {
  const [oauthStatus, setOauthStatus] = useState(null);

  useEffect(() => {
    fetchOAuthStatus();
  }, []);

  const fetchOAuthStatus = async () => {
    try {
      const response = await fetch('/api/oauth/status', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const { data } = await response.json();
      setOauthStatus(data);
    } catch (error) {
      console.error('Failed to fetch OAuth status:', error);
    }
  };

  const linkGoogleAccount = () => {
    window.location.href = '/api/oauth/google?type=landing';
  };

  const unlinkGoogleAccount = async () => {
    try {
      await fetch('/api/oauth/google/unlink', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      fetchOAuthStatus(); // Refresh status
    } catch (error) {
      console.error('Failed to unlink Google account:', error);
    }
  };

  if (!oauthStatus) return <div>Loading...</div>;

  return (
    <div className="account-settings">
      <h2>Account Settings</h2>
      
      <div className="oauth-section">
        <h3>Google Account</h3>
        
        {oauthStatus.has_google_linked ? (
          <div className="linked-account">
            <div className="google-info">
              {oauthStatus.oauth_picture && (
                <img src={oauthStatus.oauth_picture} alt="Google Profile" />
              )}
              <span>Google account linked</span>
            </div>
            
            {oauthStatus.can_unlink_google && (
              <button onClick={unlinkGoogleAccount} className="unlink-btn">
                Unlink Google Account
              </button>
            )}
          </div>
        ) : (
          <div className="unlinked-account">
            <p>Link your Google account for easier sign-in</p>
            <button onClick={linkGoogleAccount} className="link-btn">
              Link Google Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
```

## 🔒 Security Features

### 1. CSRF Protection
- State parameter includes timestamp and nonce
- State verification on callback

### 2. Account Security
- Can't unlink Google if it's the only auth method
- Password required before unlinking
- Email verification maintained

### 3. Token Management
- Secure OAuth session storage
- Refresh token handling
- Proper token expiration

## 🧪 Testing Checklist

### Backend Testing
- [ ] OAuth initiation works for both user types
- [ ] Google callback processes correctly
- [ ] New user creation via Google
- [ ] Existing user login via Google
- [ ] Account linking works for authenticated users
- [ ] Account unlinking requires password
- [ ] Error handling for OAuth failures

### Frontend Testing
- [ ] Google sign-in button redirects correctly
- [ ] OAuth success redirects to correct page
- [ ] New users see welcome message
- [ ] Account linking in settings works
- [ ] Account unlinking works with validation
- [ ] Error messages display properly

## 🚀 Production Deployment

### Environment Variables
```env
# Production Google OAuth
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/oauth/google/callback

# Production frontend URL
FRONTEND_URL=https://yourdomain.com
```

### Security Considerations
1. Use HTTPS only in production
2. Restrict Google OAuth redirect URIs
3. Implement rate limiting on OAuth endpoints
4. Monitor OAuth session table for anomalies
5. Regular security audits of OAuth flow

## 🎉 Success! 

You now have a robust, secure Google OAuth system that:
- ✅ Works alongside existing authentication
- ✅ Supports both user types (customers & admins)
- ✅ Handles account linking seamlessly
- ✅ Provides excellent user experience
- ✅ Maintains security best practices

Your users can now enjoy the convenience of "Continue with Google" while maintaining the option to use traditional email/password authentication! 