import { useAuth } from '../contexts/AuthContext';

export default function TestAuth() {
  const { user, token, loading, isAuthenticated } = useAuth();
  
  console.log('🧪 Test Auth Page Loaded');
  console.log('User:', user);
  console.log('Token:', token);
  console.log('Loading:', loading);
  console.log('Is Authenticated:', isAuthenticated());

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
        
        <div className="space-y-4">
          <div>
            <strong>Loading:</strong> {loading ? 'true' : 'false'}
          </div>
          
          <div>
            <strong>Is Authenticated:</strong> {isAuthenticated() ? 'true' : 'false'}
          </div>
          
          <div>
            <strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}
          </div>
          
          <div>
            <strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'null'}
          </div>
        </div>
      </div>
    </div>
  );
}
