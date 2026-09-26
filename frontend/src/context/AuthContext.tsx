import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User, Role } from '../types';
import { getSocket } from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  googleLogin: (data: { email: string; name?: string; avatar?: string; googleId?: string }) => Promise<{ success: boolean; message?: string }>;
  register: (data: { name: string; email: string; password: string; phone?: string; role?: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  quickSwitchDemo: (role: Role) => Promise<void>;
  unreadNotifications: number;
  setUnreadNotifications: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('resolvai_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('resolvai_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  useEffect(() => {
    const fetchProfile = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/profile');
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('resolvai_user', JSON.stringify(res.data.data));
            setUnreadNotifications(res.data.data._count?.notifications || 0);

            // Connect socket room
            const socket = getSocket();
            socket.emit('join:user', res.data.data.id);
            socket.emit('join:role', res.data.data.role);
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [token]);

  // Setup socket listener for new notifications
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    const handleNewNotification = () => {
      setUnreadNotifications((prev) => prev + 1);
    };

    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { user: userData, accessToken, refreshToken } = res.data.data;
        setUser(userData);
        setToken(accessToken);
        localStorage.setItem('resolvai_token', accessToken);
        localStorage.setItem('resolvai_refresh_token', refreshToken);
        localStorage.setItem('resolvai_user', JSON.stringify(userData));

        const socket = getSocket();
        socket.emit('join:user', userData.id);
        socket.emit('join:role', userData.role);

        return { success: true };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  const googleLogin = async (data: { email: string; name?: string; avatar?: string; googleId?: string }) => {
    try {
      const res = await api.post('/auth/google', data);
      if (res.data.success) {
        const { user: userData, accessToken, refreshToken } = res.data.data;
        setUser(userData);
        setToken(accessToken);
        localStorage.setItem('resolvai_token', accessToken);
        localStorage.setItem('resolvai_refresh_token', refreshToken);
        localStorage.setItem('resolvai_user', JSON.stringify(userData));

        const socket = getSocket();
        socket.emit('join:user', userData.id);
        socket.emit('join:role', userData.role);

        return { success: true };
      }
      return { success: false, message: res.data.message || 'Google login failed' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Google login failed' };
    }
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string; role?: string }) => {
    try {
      const res = await api.post('/auth/register', data);
      if (res.data.success) {
        const { user: userData, accessToken, refreshToken } = res.data.data;
        setUser(userData);
        setToken(accessToken);
        localStorage.setItem('resolvai_token', accessToken);
        localStorage.setItem('resolvai_refresh_token', refreshToken);
        localStorage.setItem('resolvai_user', JSON.stringify(userData));

        const socket = getSocket();
        socket.emit('join:user', userData.id);
        socket.emit('join:role', userData.role);

        return { success: true };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('resolvai_token');
    localStorage.removeItem('resolvai_refresh_token');
    localStorage.removeItem('resolvai_user');
  };

  const quickSwitchDemo = async (role: Role) => {
    const demoAccounts: Record<Role, { email: string; pass: string }> = {
      ADMIN: { email: 'admin@resolvai.gov', pass: 'Password@123' },
      MANAGER: { email: 'manager@resolvai.gov', pass: 'Password@123' },
      AGENT: { email: 'agent.works@resolvai.gov', pass: 'Password@123' },
      CITIZEN: { email: 'citizen.john@gmail.com', pass: 'Password@123' },
    };

    const target = demoAccounts[role];
    if (target) {
      await login(target.email, target.pass);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        googleLogin,
        register,
        logout,
        quickSwitchDemo,
        unreadNotifications,
        setUnreadNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
