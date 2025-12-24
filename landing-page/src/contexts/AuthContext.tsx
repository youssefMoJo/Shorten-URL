import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { config } from "../config";

interface UserData {
  userId: string;
  email: string;
}

interface AuthContextType {
  user: UserData | null;
  idToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{ requiresVerification: boolean; email: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  verifyEmailAndLogin: (email: string, password: string, code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  logout: () => void;
  getIdToken: () => Promise<string | null>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logoutTimer, setLogoutTimer] = useState<number | null>(null);

  // Clear logout timer
  const clearLogoutTimer = () => {
    if (logoutTimer) {
      clearTimeout(logoutTimer);
      setLogoutTimer(null);
    }
  };

  // Setup auto-logout timer
  const setupAutoLogout = (expiresIn: number) => {
    clearLogoutTimer();

    // Set timer to logout 30 seconds before token actually expires
    // This gives a buffer for token refresh attempts
    const timeoutDuration = (expiresIn - 30) * 1000;

    if (timeoutDuration > 0) {
      const timer = setTimeout(() => {
        console.warn('Session expired. Logging out...');
        logout();
      }, timeoutDuration);

      setLogoutTimer(timer);
    }
  };

  // Refresh the access token using refresh token
  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      console.error('No refresh token available');
      logout();
      return null;
    }

    try {
      const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.refreshToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.error('Token refresh failed');
        logout();
        return null;
      }

      const data = await response.json();

      // Update tokens in state and localStorage
      setIdToken(data.tokens.idToken);
      localStorage.setItem('idToken', data.tokens.idToken);
      localStorage.setItem('accessToken', data.tokens.accessToken);

      // Calculate and store new expiry time
      const expiryTime = Date.now() + (data.tokens.expiresIn * 1000);
      localStorage.setItem('tokenExpiryTime', expiryTime.toString());

      // Setup auto-logout for the new token
      setupAutoLogout(data.tokens.expiresIn);

      return data.tokens.idToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      return null;
    }
  };

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('idToken');
    const expiryTime = localStorage.getItem('tokenExpiryTime');

    if (storedUser && storedToken && expiryTime) {
      const expiryTimestamp = parseInt(expiryTime, 10);
      const currentTime = Date.now();
      const remainingTime = expiryTimestamp - currentTime;

      // If token is still valid
      if (remainingTime > 0) {
        setUser(JSON.parse(storedUser));
        setIdToken(storedToken);

        // Setup auto-logout timer for remaining time
        const remainingSeconds = Math.floor(remainingTime / 1000);
        setupAutoLogout(remainingSeconds);
      } else {
        // Token expired, try to refresh
        const attemptRefresh = async () => {
          const newToken = await refreshAccessToken();
          if (newToken) {
            setUser(JSON.parse(storedUser));
          }
        };
        attemptRefresh();
      }
    }
    setIsLoading(false);

    // Cleanup timer on unmount
    return () => {
      clearLogoutTimer();
    };
  }, []);

  const signup = async (email: string, password: string): Promise<{ requiresVerification: boolean; email: string }> => {
    const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.signup}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Signup failed');
    }

    const data = await response.json();

    // Return info indicating verification is required
    return {
      requiresVerification: true,
      email: data.email,
    };
  };

  const verifyEmail = async (email: string, code: string): Promise<void> => {
    const response = await fetch(`${config.api.baseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Email verification failed');
    }

    await response.json();
    // After verification, user can log in
  };

  const verifyEmailAndLogin = async (email: string, password: string, code: string): Promise<void> => {
    // First verify the email
    await verifyEmail(email, code);

    // Then automatically log in the user
    await login(email, password);
  };

  const resendVerificationCode = async (email: string): Promise<void> => {
    const response = await fetch(`${config.api.baseUrl}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Failed to resend verification code');
    }

    await response.json();
  };

  const login = async (email: string, password: string): Promise<void> => {
    const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.login}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();

      // If user is not confirmed, throw a special error with the email
      if (response.status === 403 && error.error === 'Account not confirmed') {
        const notConfirmedError: any = new Error(error.message || 'Account not confirmed');
        notConfirmedError.code = 'UserNotConfirmedException';
        notConfirmedError.email = email;
        throw notConfirmedError;
      }

      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();

    const userData = {
      userId: data.userId,
      email: data.email,
    };

    setUser(userData);
    setIdToken(data.tokens.idToken);

    // Calculate and store token expiry time
    const expiryTime = Date.now() + (data.tokens.expiresIn * 1000);

    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('idToken', data.tokens.idToken);
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    localStorage.setItem('tokenExpiryTime', expiryTime.toString());

    // Setup auto-logout timer
    setupAutoLogout(data.tokens.expiresIn);
  };

  const logout = () => {
    clearLogoutTimer();
    setUser(null);
    setIdToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiryTime');
  };

  const getIdToken = async (): Promise<string | null> => {
    // Check if token is expired
    const expiryTime = localStorage.getItem('tokenExpiryTime');
    if (!expiryTime) {
      return idToken;
    }

    const expiryTimestamp = parseInt(expiryTime, 10);
    const currentTime = Date.now();

    // If token is about to expire (within 30 seconds), refresh it
    if (currentTime >= (expiryTimestamp - 30000)) {
      console.log('Token expiring soon, refreshing...');
      const newToken = await refreshAccessToken();
      return newToken;
    }

    return idToken;
  };

  const forgotPassword = async (email: string): Promise<void> => {
    const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.forgotPassword}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send password reset code');
    }

    await response.json();
  };

  const resetPassword = async (email: string, code: string, newPassword: string): Promise<void> => {
    const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.resetPassword}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset password');
    }

    await response.json();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        isAuthenticated: !!user && !!idToken,
        isLoading,
        login,
        signup,
        verifyEmail,
        verifyEmailAndLogin,
        resendVerificationCode,
        logout,
        getIdToken,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
