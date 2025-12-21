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
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getIdToken: () => string | null;
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

  const signup = async (email: string, password: string): Promise<void> => {
    const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.signup}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
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

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        isAuthenticated: !!user && !!idToken,
        isLoading,
        login,
        signup,
        logout,
        getIdToken,
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
