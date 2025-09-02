import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  console.log('🔥 AuthProvider component rendering');
  
  // Initialize with proper defaults based on environment
  const isServer = typeof window === 'undefined';
  console.log('🌍 Environment:', isServer ? 'server' : 'client');
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Always start with loading true
  const [token, setToken] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  console.log('📊 Auth state:', { user, loading, token: token ? 'exists' : 'null', isInitialized });

  // Initialize from localStorage on client-side only, after hydration
  useEffect(() => {
    if (isServer) return; // Skip on server
    
    console.log('🔧 Client-side initialization');
    
    try {
      const storedToken = localStorage.getItem('admin_token');
      const storedUser = localStorage.getItem('admin_user');
      
      if (storedToken && storedUser) {
        console.log('🔑 Found stored credentials');
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        console.log('🔓 No stored credentials found');
      }
    } catch (error) {
      console.error('🚨 Error loading auth:', error);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, [isServer]);

  // Logout function
  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // Verify token with backend
  const verifyToken = () => Promise.resolve(false);

  // Login function
  const login = async (username, password) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        const { token: newToken, user: userData } = data.data;
        
        // Store in localStorage
        localStorage.setItem('admin_token', newToken);
        localStorage.setItem('admin_user', JSON.stringify(userData));
        
        // Update state
        setToken(newToken);
        setUser(userData);
        
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Failed to change password' };
    }
  };

  // Get auth headers for API requests
  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!(token && user);
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user && user.role === role;
  };

  // Check if user is admin or super admin
  const isAdmin = () => {
    return user && (user.role === 'admin' || user.role === 'super_admin');
  };

  const value = {
    user,
    token,
    loading,
    isInitialized,
    login,
    logout,
    changePassword,
    getAuthHeaders,
    isAuthenticated,
    hasRole,
    isAdmin,
    verifyToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
