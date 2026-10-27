import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { useAdminAuth } from './AdminAuthContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { login: adminLogin, logout: adminLogout } = useAdminAuth();

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('shaheer-user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('shaheer-user', JSON.stringify(user));
      } else {
        localStorage.removeItem('shaheer-user');
      }
    } catch {
      // localStorage unavailable
    }
  }, [user]);

  const login = async (email, password) => {
    const data = await api.login({
      email,
      password,
    });

    setUser(data);

    // If this account is an admin/staff account,
    // also create the admin session.
    if (data.is_staff) {
      try {
        await adminLogin(email, password);
      } catch (error) {
        console.error('Admin session could not be created:', error);
      }
    }

    return data;
  };

  const register = async (fullName, email, password) => {
    const data = await api.register({
      full_name: fullName,
      email,
      password,
    });

    setUser(data);

    return data;
  };

  const logout = () => {
    // Clear normal user session
    setUser(null);

    // Clear admin session too
    adminLogout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}