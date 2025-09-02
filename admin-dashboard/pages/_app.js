import '../styles/globals.css';
import '../lib/chartjs-config'; // Import Chart.js configuration globally
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import ToastContainer from '../components/ToastContainer';

function MyApp({ Component, pageProps }) {
  console.log('🚀 _app.js loaded!');
  console.log('📦 Component:', Component.name || 'Unknown');
  console.log('🔧 ToastContainer imported:', typeof ToastContainer);
  
  return (
    <AuthProvider>
      <ThemeProvider>
        <Component {...pageProps} />
        <ToastContainer />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default MyApp;
