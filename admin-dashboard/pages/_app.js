import '../styles/globals.css';
import '../lib/chartjs-config'; // Import Chart.js configuration globally
import { ThemeProvider } from '../contexts/ThemeContext';
import ToastContainer from '../components/ToastContainer';

function MyApp({ Component, pageProps }) {
  console.log('🚀 _app.js loaded!');
  console.log('📦 Component:', Component.name || 'Unknown');
  console.log('🔧 ToastContainer imported:', typeof ToastContainer);
  
  return (
    <ThemeProvider>
      <Component {...pageProps} />
      <ToastContainer />
    </ThemeProvider>
  );
}

export default MyApp;
