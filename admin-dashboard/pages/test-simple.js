import { SimpleAuthProvider, useSimpleAuth } from '../contexts/SimpleAuth';

function TestComponent() {
  const { loading } = useSimpleAuth();
  console.log('🧪 Test Simple Component, loading:', loading);
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Simple Auth Test</h1>
        <div>Loading: {loading ? 'true' : 'false'}</div>
      </div>
    </div>
  );
}

export default function TestSimple() {
  return (
    <SimpleAuthProvider>
      <TestComponent />
    </SimpleAuthProvider>
  );
}
