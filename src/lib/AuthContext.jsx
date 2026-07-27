import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authApi } from '@/api/authApi';

// Local session-based auth. Public pages never block on this: the app renders
// immediately while the session check runs in the background.
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);        // { id, email, full_name, role, ... }
  const [student, setStudent] = useState(null);  // linked student profile or null
  const [tutor, setTutor] = useState(null);      // linked tutor profile or null
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const applyMe = (me) => {
    setUser(me?.user || null);
    setStudent(me?.student || null);
    setTutor(me?.tutor || null);
    setIsAuthenticated(Boolean(me?.user));
  };

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      applyMe(me);
      return me;
    } catch {
      applyMe(null);
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    const me = await authApi.login(email, password);
    applyMe(me);
    setIsLoadingAuth(false);
    return me;
  };

  const register = async (details) => {
    const me = await authApi.register(details);
    applyMe(me);
    setIsLoadingAuth(false);
    return me;
  };

  const logout = async (shouldRedirect = true) => {
    try {
      await authApi.logout();
    } finally {
      applyMe(null);
      if (shouldRedirect) window.location.assign('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        student,
        tutor,
        isAuthenticated,
        isLoadingAuth,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
