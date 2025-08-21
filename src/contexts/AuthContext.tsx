import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar: string;
    timezone: string;
  };
  preferences: {
    focusTime: number;
    breakTime: number;
    dailyGoal: number;
    notifications: boolean;
  };
  progress: {
    totalPoints: number;
    streakDays: number;
    lastActiveDate: string;
    badges: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      type: 'bronze' | 'silver' | 'gold' | 'platinum';
      earnedAt: string;
    }>;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: { login: string; password: string }) => Promise<void>;
  register: (userData: { username: string; email: string; password: string; firstName?: string; lastName?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:5000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('adhd_token'));
  const [isLoading, setIsLoading] = useState(true);

  // API helper function
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    console.log('Making API call to:', url);
    console.log('Config:', config);

    try {
      const response = await fetch(url, config);
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        // Handle validation errors with detailed field information
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err: any) => err.message || err.msg).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API call failed:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Make sure the backend is running on http://localhost:5000');
      }
      throw error;
    }
  };

  // Load user profile on token change
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiCall('/auth/me');
        setUser(response.user);
      } catch (error) {
        console.error('Failed to load user:', error);
        // Clear invalid token
        localStorage.removeItem('adhd_token');
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (credentials: { login: string; password: string }) => {
    try {
      console.log('Attempting login with:', credentials);
      console.log('API URL:', `${API_BASE_URL}/auth/login`);
      
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      console.log('Login response:', response);
      const { token: newToken, user: userData } = response;
      localStorage.setItem('adhd_token', newToken);
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: { 
    username: string; 
    email: string; 
    password: string; 
    firstName?: string; 
    lastName?: string; 
  }) => {
    try {
      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      const { token: newToken, user: newUser } = response;
      localStorage.setItem('adhd_token', newToken);
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('adhd_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      const response = await apiCall('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    updateProfile,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
