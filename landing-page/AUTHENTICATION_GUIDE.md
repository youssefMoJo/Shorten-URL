# Authentication Implementation Guide

## Overview
This document describes the authentication system implemented for the URL Shortener application using AWS Cognito.

## Features Implemented

### 1. User Authentication
- **Sign Up**: Users can create accounts with email and password
- **Login**: Users can authenticate with their credentials
- **Logout**: Users can sign out from their account
- **Protected Routes**: Dashboard is only accessible to authenticated users

### 2. Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### 3. User Dashboard
- Create new shortened links (authenticated)
- View all user's shortened links
- Copy short URLs to clipboard
- See creation timestamps for each link
- Beautiful, responsive UI

## File Structure

```
landing-page/src/
├── config.ts                          # API and Cognito configuration
├── contexts/
│   └── AuthContext.tsx               # Authentication context and hooks
├── components/
│   ├── Header.tsx                    # Navigation header
│   ├── Header.css
│   ├── Login.tsx                     # Login page
│   ├── Signup.tsx                    # Signup page
│   ├── Auth.css                      # Styles for auth pages
│   ├── Dashboard.tsx                 # User dashboard
│   ├── Dashboard.css                 # Dashboard styles
│   ├── LandingPage.tsx              # Public landing page
│   └── ProtectedRoute.tsx           # Route protection wrapper
└── App.tsx                           # Main app with routing
```

## Configuration

The application uses the following AWS resources (configured in [config.ts](src/config.ts)):

```typescript
{
  cognito: {
    userPoolId: 'ca-central-1_XTnOHGP3K',
    clientId: '22an9mv4k84jl5latoi3qkkgpp',
    region: 'ca-central-1'
  },
  api: {
    baseUrl: 'https://kb5qj23lyl.execute-api.ca-central-1.amazonaws.com/dev',
    endpoints: {
      signup: '/auth/signup',
      login: '/auth/login',
      shorten: '/shorten',
      expand: '/expand',
      meLinks: '/me/links'
    }
  }
}
```

## Routes

- `/` - Landing page with URL shortener (public)
- `/login` - Login page
- `/signup` - Signup page
- `/dashboard` - User dashboard (protected)

## API Integration

### Authenticated Requests
All authenticated API requests include the JWT token in the Authorization header:

```typescript
const token = getIdToken()
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

### Endpoints Used
1. **POST /auth/signup** - Create new user account
2. **POST /auth/login** - Authenticate user
3. **POST /shorten** - Create shortened URL (with/without auth)
4. **GET /me/links** - Get user's shortened links (requires auth)

## Usage

### For Users

1. **Anonymous Usage**:
   - Visit the homepage
   - Enter a URL and click "Shorten"
   - Get a short URL (not tracked)

2. **Authenticated Usage**:
   - Click "Sign Up" to create an account
   - Log in with your credentials
   - Access your dashboard to:
     - Create new short links
     - View all your shortened links
     - Copy links to clipboard

### For Developers

1. **Install dependencies**:
```bash
cd landing-page
npm install
```

2. **Run development server**:
```bash
npm run dev
```

3. **Build for production**:
```bash
npm run build
```

## Key Components

### AuthContext
Provides authentication state and methods throughout the app:
- `user` - Current Cognito user
- `session` - Current user session
- `isAuthenticated` - Boolean authentication status
- `isLoading` - Loading state
- `login(email, password)` - Login method
- `signup(email, password)` - Signup method
- `logout()` - Logout method
- `getIdToken()` - Get JWT token for API calls

### ProtectedRoute
Wrapper component that:
- Shows loading spinner while checking authentication
- Redirects to login if not authenticated
- Renders children if authenticated

### Dashboard
User dashboard that:
- Fetches and displays all user's shortened links
- Allows creating new short links
- Provides copy-to-clipboard functionality
- Shows creation timestamps
- Responsive grid layout

## Styling

The UI features:
- Modern gradient design
- Smooth animations and transitions
- Responsive layout (mobile-friendly)
- Glass-morphism effects
- Hover states and micro-interactions
- Loading states and error messages

## Security Features

1. **Password Policy Enforcement** - Client-side validation matches AWS Cognito requirements
2. **JWT Authentication** - Secure token-based auth with AWS Cognito
3. **Protected Routes** - Unauthorized users cannot access dashboard
4. **HTTPS Only** - All API calls use HTTPS
5. **Session Management** - Automatic session refresh with Cognito

## Next Steps (Optional Enhancements)

1. Add email verification
2. Implement password reset functionality
3. Add link analytics (click tracking)
4. Custom domain support for short links
5. Link expiration settings
6. QR code generation for short links
7. Bulk link creation
8. Export links to CSV

## Testing

To test the authentication flow:

1. **Sign Up**:
   - Go to `/signup`
   - Enter email and strong password
   - Click "Sign Up"
   - Should redirect to login

2. **Login**:
   - Go to `/login`
   - Enter credentials
   - Click "Sign In"
   - Should redirect to dashboard

3. **Dashboard**:
   - Create a new short link
   - View it in the links list
   - Click copy button
   - Test logout

4. **Protected Route**:
   - While logged out, try accessing `/dashboard`
   - Should redirect to login

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure API Gateway has CORS enabled
   - Check that headers match CORS configuration

2. **Authentication Fails**:
   - Verify Cognito User Pool ID and Client ID in [config.ts](src/config.ts)
   - Check password meets requirements
   - Ensure user pool allows USER_PASSWORD_AUTH flow

3. **Token Errors**:
   - Check token expiration (1 hour by default)
   - Verify Authorization header format: `Bearer <token>`

4. **API Endpoint Issues**:
   - Verify endpoints in [config.ts](src/config.ts) match deployed API
   - Check Lambda function permissions
   - Review CloudWatch logs for errors
