import { useState, useCallback } from 'react';
import Toast from './Toast';

const ToastContainer = () => {
  console.log('🍞 ToastContainer component rendered');
  
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    console.log('🍞 Adding toast:', { message, type, duration });
    
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    console.log('🍞 Removing toast:', id);
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Expose addToast method globally
  if (typeof window !== 'undefined') {
    console.log('🍞 Setting window.showToast');
    window.showToast = addToast;
    console.log('🍞 window.showToast available:', typeof window.showToast);
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
