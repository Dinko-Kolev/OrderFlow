import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated()) {
        // Redirect to login page
        router.push('/login');
        return;
      }

      // Check role-based access if required
      if (requiredRole && user && user.role !== requiredRole && user.role !== 'super_admin') {
        // Redirect to dashboard if user doesn't have required role
        router.push('/');
        return;
      }
    }
  }, [isAuthenticated, user, loading, router, requiredRole]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated()) {
    return null;
  }

  // Don't render children if user doesn't have required role
  if (requiredRole && user && user.role !== requiredRole && user.role !== 'super_admin') {
    return null;
  }

  return children;
}
