import { createContext, useContext, useState, useEffect } from 'react';

const SimpleAuthContext = createContext();

export function SimpleAuthProvider({ children }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 Simple Auth useEffect running');
    setLoading(false);
  }, []);

  console.log('🔄 SimpleAuth render, loading:', loading);

  return (
    <SimpleAuthContext.Provider value={{ loading }}>
      {children}
    </SimpleAuthContext.Provider>
  );
}

export function useSimpleAuth() {
  return useContext(SimpleAuthContext);
}
