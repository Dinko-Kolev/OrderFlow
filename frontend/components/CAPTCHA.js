import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';

/**
 * Google reCAPTCHA v3 Component
 * Provides invisible CAPTCHA verification for guest orders
 */
const CAPTCHA = forwardRef(({ onVerify, action = 'order', children, className = '', onTimeout }, ref) => {
  const recaptchaRef = useRef(null);
  const timeoutRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  const executeRecaptcha = async () => {
    console.log('🔄 Starting CAPTCHA verification...');
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('🔑 Site key:', process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'YOUR_ACTUAL_SITE_KEY_HERE');
    console.log('🔒 reCAPTCHA available:', isRecaptchaAvailable());

    setLoading(true);

    // Set up timeout if onTimeout is provided
    let timeoutId;
    if (onTimeout) {
      timeoutId = setTimeout(() => {
        console.log('⏰ CAPTCHA verification timeout');
        setLoading(false);
        onTimeout();
      }, 12000); // 12 seconds timeout
    }

    try {
      // Check if reCAPTCHA is available
      if (!isRecaptchaAvailable()) {
        console.error('Google reCAPTCHA not available');
        // In development, use mock token for testing
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Development mode: Using mock CAPTCHA token');
          const mockToken = 'mock_recaptcha_token_dev';
          setCaptchaToken(mockToken);
          onVerify(mockToken);
          if (timeoutId) clearTimeout(timeoutId);
          return;
        }
        return;
      }

      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
      
      // In development mode, use mock token for easier testing
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Development mode: Using mock CAPTCHA token for testing');
        const mockToken = 'mock_recaptcha_token_dev';
        setCaptchaToken(mockToken);
        onVerify(mockToken);
        if (timeoutId) clearTimeout(timeoutId);
        return;
      }

      // Production mode: Use real reCAPTCHA
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute(siteKey, { action })
          .then((token) => {
            console.log('✅ reCAPTCHA token generated for action:', action);
            setCaptchaToken(token);
            onVerify(token);
            if (timeoutId) clearTimeout(timeoutId);
          })
          .catch((error) => {
            console.error('❌ reCAPTCHA execution failed:', error);
            // Fallback to mock token in development
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Development mode: Falling back to mock token');
              const mockToken = 'mock_recaptcha_token_dev';
              setCaptchaToken(mockToken);
              onVerify(mockToken);
            }
            if (timeoutId) clearTimeout(timeoutId);
          })
          .finally(() => {
            setLoading(false);
          });
      });
    } catch (error) {
      console.error('❌ CAPTCHA execution error:', error);
      // Fallback to mock token in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Development mode: Using mock token due to error');
        const mockToken = 'mock_recaptcha_token_dev';
        setCaptchaToken(mockToken);
        onVerify(mockToken);
      }
      if (timeoutId) clearTimeout(timeoutId);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Expose execute function to parent component
  useImperativeHandle(ref, () => ({
    execute: executeRecaptcha
  }));

  // Load Google reCAPTCHA script only when needed
  useEffect(() => {
    // Only load script if not already loaded
    if (typeof window !== 'undefined' && !window.grecaptcha) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}`;
      script.async = true;
      script.defer = true;
      
      // Hide the reCAPTCHA badge by default
      script.onload = () => {
        // Hide the badge when script loads
        if (window.grecaptcha) {
          // Set badge to be invisible
          window.grecaptcha.ready(() => {
            // This will hide the badge
            console.log('✅ Google reCAPTCHA script loaded (badge hidden)');
          });
        }
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load Google reCAPTCHA script');
      };
      
      document.head.appendChild(script);
    } else if (window.grecaptcha) {
      console.log('✅ Google reCAPTCHA script already loaded');
    }
  }, []);

  // Check if reCAPTCHA is available
  const isRecaptchaAvailable = () => {
    return typeof window !== 'undefined' && 
           typeof window.grecaptcha !== 'undefined' && 
           typeof window.grecaptcha.ready === 'function' &&
           typeof window.grecaptcha.execute === 'function';
  };

  return (
    <div ref={recaptchaRef} data-recaptcha className="w-full">
      {/* Debug info */}
      <div className="mb-2 p-2 bg-gray-100 text-xs text-gray-600 rounded">
        CAPTCHA Component Loaded - Environment: {process.env.NODE_ENV}
      </div>
      
      {/* CAPTCHA Verification Button */}
      <button
        type="button"
        onClick={executeRecaptcha}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        disabled={loading}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verificando...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            🔒 Verificar CAPTCHA
          </>
        )}
      </button>
      
      {/* Status Message */}
      {captchaToken && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Verificación completada</span>
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
});

CAPTCHA.displayName = 'CAPTCHA';

export default CAPTCHA;
