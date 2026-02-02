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
  // Sync initialization from localStorage to prevent "null user" flicker on refresh
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(() => {
    // If we have a token but no user, or just want to verify, we stay loading.
    // If we have both, we can show the UI immediately while verifying in background.
    return !!localStorage.getItem('token') && !localStorage.getItem('user');
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    // Set authorization header for the verification request
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Verify session in background
    api.get('/users/profile')
      .then(res => {
        const userData = res.data.data.user;
        setUser(prevUser => {
          const mergedUser = { ...prevUser, ...userData };
          localStorage.setItem('user', JSON.stringify(mergedUser));
          return mergedUser;
        });
      })
      .catch(() => {
        // Only clear if verification fails
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
      })
      .finally(() => setLoading(false));
  }, []);


  const login = async (email, password) => {
    try {
      // Always use the unified login endpoint
      const response = await api.post('/auth/login', { email, password });

      const { data } = response.data;

      // Check if role selection is required
      if (data.requiresRoleSelection) {
        return {
          success: true,
          requiresRoleSelection: true,
          availableRoles: data.availableRoles,
          userId: data.userId
        };
      }

      // Standard login (single role)
      const { token, user: userData } = data;

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
      return { success: false, message: message }; // Fixed structure to match LoginPage check
    }
  };

  const selectRole = async (userId, selectedRole) => {
    try {
      const response = await api.post('/auth/select-role', { userId, selectedRole });
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
      const message = error.response?.data?.message || 'Role selection failed';
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