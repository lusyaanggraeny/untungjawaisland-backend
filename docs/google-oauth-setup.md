# Google OAuth Setup Guide - Updated for 2024/2025

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select an existing project
3. Give your project a name (e.g., "Untungjawa Homestay")
4. Click "Create"

### 1.2 Enable Google APIs (No longer requires Google+ API)
1. Navigate to "APIs & Services" > "Library"
2. Search for and enable these APIs:
   - **Google People API** (for profile information)
   - **Google Calendar API** (if using calendar features)
   - **Google Drive API** (if using drive features)
3. **Note**: Google+ API is deprecated and no longer needed

### 1.3 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" for public app (or "Internal" if using Google Workspace)
3. Fill in required information:
   - **App name**: "Untungjawa Homestay"
   - **User support email**: your email
   - **App logo**: (optional but recommended)
   - **App domain**: your website domain
   - **Developer contact**: your email
4. **Scopes section**: Add these scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile` 
   - `openid`
5. **Test users**: Add your email and any other test users during development
6. Save and continue through all steps

### 1.4 Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Configure:
   - **Name**: "Untungjawa Homestay Web Client"
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (frontend development)
     - `https://yourdomain.com` (production frontend)
   - **Authorized redirect URIs:**
     - `http://localhost:5000/auth/google/callback` (development backend)
     - `https://api.yourdomain.com/auth/google/callback` (production backend)
5. Click "Create"
6. **Important**: Save your Client ID and Client Secret immediately - the secret is only shown once!

## Step 2: Environment Variables

Add these to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# Frontend URL (for redirects after OAuth)
FRONTEND_URL=http://localhost:3000
```

## Step 3: Frontend Integration

### For React/Vue.js Frontend:

```javascript
// Google Sign-In Button Component
const GoogleSignInButton = () => {
  const handleGoogleLogin = () => {
    // Redirect to backend OAuth initiation
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  };

  return (
    <button onClick={handleGoogleLogin} className="google-signin-btn">
      <img src="/google-icon.svg" alt="Google" />
      Continue with Google
    </button>
  );
};
```

### Frontend Auth Flow:
1. User clicks "Continue with Google"
2. Frontend redirects to: `${API_URL}/auth/google`
3. User authenticates with Google
4. Google redirects to: `${API_URL}/auth/google/callback`
5. Backend processes OAuth and redirects to frontend with token
6. Frontend receives token and stores it

## Step 4: User Experience Flow

### New User Flow:
1. User clicks "Continue with Google"
2. Google authentication
3. Backend creates new account with Google info
4. User redirected to frontend with authentication token

### Existing User Flow:
1. **Link Account**: User can link Google to existing email/password account
2. **Sign In**: User can sign in with either email/password OR Google

### Account Linking:
- Users with existing accounts can link their Google account
- Once linked, they can use either authentication method
- Profile data is merged intelligently

## Step 5: Security Considerations

### CSRF Protection:
- Use state parameter for OAuth flows
- Verify state parameter on callback

### Session Management:
- Short-lived access tokens (15-60 minutes)
- Secure refresh token handling
- Option to revoke OAuth access

### Data Privacy:
- Only request necessary Google scopes
- Store minimal user data from Google
- Provide clear privacy policy

## Step 6: Important Updates for 2024/2025

### What's Changed:
1. **Google+ API Deprecated**: No longer available or needed
2. **New Google Auth Platform**: Modern interface in Google Cloud Console
3. **Enhanced Security**: Better client secret handling and rotation
4. **Updated Scopes**: Use newer OpenID Connect scopes

### Modern Best Practices:
1. **Client Secret Security**: Store secrets in secure managers (Google Secret Manager, etc.)
2. **Regular Rotation**: Rotate client secrets periodically
3. **Minimal Scopes**: Only request what you actually need
4. **HTTPS Required**: All production redirect URIs must use HTTPS

## Testing Checklist

- [ ] Google OAuth consent screen works
- [ ] New user registration via Google
- [ ] Existing user login via Google
- [ ] Account linking functionality
- [ ] Error handling for OAuth failures
- [ ] Token refresh works properly
- [ ] User can disconnect Google account
- [ ] All redirect URIs are properly configured
- [ ] Client secret is securely stored 