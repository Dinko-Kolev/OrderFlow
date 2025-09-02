import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import apiClient from '../lib/api';

const { products } = apiClient;

export default function DebugAuth() {
  const { user, token, isAuthenticated, loading, isInitialized } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const testAPI = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      console.log('🧪 Testing API call...');
      const result = await products.getAll();
      setTestResult({ success: true, data: result });
      console.log('✅ API test successful:', result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
      console.error('❌ API test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Authentication State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                <p><strong>Initialized:</strong> {isInitialized ? 'Yes' : 'No'}</p>
                <p><strong>Authenticated:</strong> {isAuthenticated() ? 'Yes' : 'No'}</p>
                <p><strong>User:</strong> {user ? user.username : 'None'}</p>
                <p><strong>Token:</strong> {token ? token.substring(0, 20) + '...' : 'None'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>LocalStorage Check</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Admin Token:</strong> {typeof window !== 'undefined' ? (localStorage.getItem('admin_token') ? 'Exists' : 'Missing') : 'No window'}</p>
                <p><strong>Admin User:</strong> {typeof window !== 'undefined' ? (localStorage.getItem('admin_user') ? 'Exists' : 'Missing') : 'No window'}</p>
                <p><strong>Window Object:</strong> {typeof window !== 'undefined' ? 'Available' : 'Not available'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={testAPI} disabled={testing}>
                  {testing ? 'Testing...' : 'Test Products API'}
                </Button>
                
                {testResult && (
                  <div className={`p-3 rounded ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <p><strong>Result:</strong> {testResult.success ? 'Success' : 'Failed'}</p>
                    {testResult.success ? (
                      <p><strong>Products Count:</strong> {testResult.data?.data?.length || 0}</p>
                    ) : (
                      <p><strong>Error:</strong> {testResult.error}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Console Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Check the browser console for detailed debugging information.
                  Look for logs starting with 🔑, 🌐, 🛍️, etc.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
