import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

/**
 * Google reCAPTCHA v3 Component
 * Provides invisible CAPTCHA verification for guest orders
 */
const CAPTCHA = forwardRef(({ onVerify, onTimeout, action = 'order', children }, ref) => {
  const recaptchaRef = useRef(null);
  const timeoutRef = useRef(null);

  const executeRecaptcha = async () => {
    try {
      console.log('🔄 Starting CAPTCHA verification...');
      console.log('🌍 Environment:', process.env.NODE_ENV);
      console.log('🔑 Site key:', process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI');
      console.log('🌐 Window object:', typeof window !== 'undefined');
      console.log('🔒 reCAPTCHA available:', isRecaptchaAvailable());
      
      // Check if reCAPTCHA is available
      if (!isRecaptchaAvailable()) {
        console.error('Google reCAPTCHA not available');
        
        // In development, provide a mock token
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Development mode: Using mock CAPTCHA token');
          onVerify('mock_recaptcha_token_dev');
          return;
        } else {
          throw new Error('CAPTCHA service not available');
        }
      }

      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
      
      // Set up timeout handler
      if (onTimeout) {
        timeoutRef.current = setTimeout(() => {
          console.log('⏰ CAPTCHA verification timeout triggered');
          onTimeout();
        }, 12000); // 12 seconds timeout (slightly longer than the 10s Promise timeout)
      }
      
      // Add timeout to prevent hanging
      const token = await Promise.race([
        new Promise((resolve, reject) => {
          try {
            window.grecaptcha.ready(() => {
              window.grecaptcha.execute(siteKey, { action })
                .then(resolve)
                .catch(reject);
            });
          } catch (error) {
            reject(error);
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('CAPTCHA verification timeout')), 10000)
        )
      ]);

      // Clear timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Validate token before calling onVerify
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid CAPTCHA token received');
      }

      console.log('✅ reCAPTCHA token generated for action:', action);
      onVerify(token);
      
    } catch (error) {
      console.error('❌ reCAPTCHA execution failed:', error);
      
      // Clear timeout since we got an error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // For development/testing, provide a mock token
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Development mode: Using mock CAPTCHA token after error');
        onVerify('mock_recaptcha_token_dev');
      } else {
        // In production, don't call onVerify with null - let the parent handle the error
        console.log('🚫 CAPTCHA verification failed in production mode');
        // We'll let the parent component handle this by not calling onVerify
        // The parent should have a timeout mechanism to detect when CAPTCHA doesn't respond
      }
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

  useEffect(() => {
    // Load Google reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Google reCAPTCHA script loaded');
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Google reCAPTCHA script');
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Check if reCAPTCHA is available
  const isRecaptchaAvailable = () => {
    return typeof window !== 'undefined' && 
           typeof window.grecaptcha !== 'undefined' && 
           typeof window.grecaptcha.ready === 'function' &&
           typeof window.grecaptcha.execute === 'function';
  };

  return (
    <div ref={recaptchaRef} data-recaptcha>
      {children}
    </div>
  );
});

CAPTCHA.displayName = 'CAPTCHA';

export default CAPTCHA;

/**
 * CAPTCHA Button Component
 * Triggers CAPTCHA verification when clicked
 */
export function CAPTCHAButton({ onVerify, action = 'order', children, className = '', ...props }) {
  const captchaRef = useRef(null);

  const handleClick = async () => {
    if (captchaRef.current?.execute) {
      await captchaRef.current.execute();
    }
  };

  return (
    <CAPTCHA ref={captchaRef} onVerify={onVerify} action={action}>
      <button
        type="button"
        onClick={handleClick}
        className={className}
        {...props}
      >
        {children}
      </button>
    </CAPTCHA>
  );
}
