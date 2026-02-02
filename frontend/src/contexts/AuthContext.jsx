import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        // Invalid user data, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password, roleType = 'customer') => {
    try {
      // Determine login endpoint and data structure based on role
      let endpoint, loginData;

      switch (roleType) {
        case 'staff':
          endpoint = '/auth/staff-login';
          loginData = { employeeId: identifier, password };
          break;
        case 'admin':
          endpoint = '/auth/admin-login';
          loginData = { email: identifier, password };
          break;
        case 'super_admin':
          endpoint = '/auth/super-admin-login';
          loginData = { email: identifier, password };
          break;
        default: // customer
          endpoint = '/auth/login';
          loginData = { email: identifier, password };
      }

      const response = await api.post(endpoint, loginData);

      const { token, user: userData } = response.data.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Set user state
      setUser(userData);

      // Set default authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user: newUser } = response.data.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));

      // Set user state
      setUser(newUser);

      // Set default authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return { success: true, user: newUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Import Firebase auth dynamically
      const { signInWithGoogle } = await import('../config/firebase');

      // Sign in with Google
      const result = await signInWithGoogle();

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Send Google ID token to backend for verification
      const response = await api.post('/auth/google-login', {
        idToken: result.idToken,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      });

      const { token, user: userData } = response.data.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Set user state
      setUser(userData);

      // Set default authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Google login failed';
      return { success: false, error: message };
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear user state
    setUser(null);

    // Remove authorization header
    delete api.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};