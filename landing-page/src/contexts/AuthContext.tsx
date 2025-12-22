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
  getIdToken: () => string | null;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('idToken');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setIdToken(storedToken);
    }
    setIsLoading(false);
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

    // Store in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('idToken', data.tokens.idToken);
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
  };

  const logout = () => {
    setUser(null);
    setIdToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const getIdToken = (): string | null => {
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
