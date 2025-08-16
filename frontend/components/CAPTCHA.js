import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

/**
 * Google reCAPTCHA v3 Component
 * Provides invisible CAPTCHA verification for guest orders
 */
const CAPTCHA = forwardRef(({ onVerify, action = 'order', children }, ref) => {
  const recaptchaRef = useRef(null);

  const executeRecaptcha = async () => {
    try {
      if (typeof window.grecaptcha === 'undefined') {
        console.error('Google reCAPTCHA not loaded');
        throw new Error('CAPTCHA service not available');
      }

      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
      
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

      // Validate token before calling onVerify
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid CAPTCHA token received');
      }

      console.log('✅ reCAPTCHA token generated for action:', action);
      onVerify(token);
      
    } catch (error) {
      console.error('❌ reCAPTCHA execution failed:', error);
      
      // For development/testing, provide a mock token
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Using mock CAPTCHA token for development');
        onVerify('mock_recaptcha_token_dev');
      } else {
        // In production, call onVerify with null to indicate failure
        onVerify(null);
      }
    }
  };

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
