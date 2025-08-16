import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState, useEffect } from 'react';

/**
 * PaymentForm - Secure payment form using Stripe Elements
 * Handles card input, validation, and payment processing
 */
const PaymentForm = ({ 
  amount, 
  onSuccess, 
  onError, 
  onProcessing,
  customerData = {},
  className = '',
  disabled = false 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Card element options
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        ':-webkit-autofill': {
          color: '#fce883',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true, // We'll collect this separately if needed
  };

  // Handle card element change
  const handleCardChange = (event) => {
    setError(null);
    setCardComplete(event.complete);
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements || disabled) {
      return;
    }

    if (!cardComplete) {
      setError('Please complete your card information.');
      return;
    }

    setLoading(true);
    setProcessing(true);
    setError(null);

    try {
      // 1. Create order and get payment intent from backend
      console.log('💰 Creating order with payment intent...');
      
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          ...customerData,
          totalAmount: amount,
          paymentMethod: 'stripe'
        })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const { order, paymentIntent } = await orderResponse.json();
      
      if (!paymentIntent || !paymentIntent.clientSecret) {
        throw new Error('Payment intent not received from server');
      }

      console.log('✅ Order created, confirming payment...');

      // 2. Confirm payment with Stripe
      const { error: stripeError, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: customerData.customerName || 'Guest Customer',
              email: customerData.customerEmail,
              phone: customerData.customerPhone,
            },
          },
        }
      );

      if (stripeError) {
        console.error('❌ Stripe payment failed:', stripeError);
        throw new Error(stripeError.message || 'Payment failed');
      }

      if (confirmedIntent.status === 'succeeded') {
        console.log('✅ Payment successful:', confirmedIntent);
        
        // Clear form
        elements.getElement(CardElement).clear();
        setCardComplete(false);
        
        // Call success callback
        onSuccess({
          order: order,
          paymentIntent: confirmedIntent,
          paymentMethod: confirmedIntent.payment_method
        });
      } else {
        throw new Error(`Payment status: ${confirmedIntent.status}`);
      }

    } catch (error) {
      console.error('❌ Payment processing failed:', error);
      setError(error.message || 'Payment failed. Please try again.');
      onError && onError(error);
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  // Call onProcessing when processing state changes
  useEffect(() => {
    if (onProcessing) {
      onProcessing(processing);
    }
  }, [processing, onProcessing]);

  return (
    <div className={`payment-form ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Amount Display */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-700">Total Amount:</span>
            <span className="text-2xl font-bold text-green-600">
              ${amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Card Input Section */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Card Information
          </label>
          
          <div className="border border-gray-300 rounded-lg p-4 bg-white">
            <CardElement
              options={cardElementOptions}
              onChange={handleCardChange}
              className="min-h-[40px]"
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium">Secure Payment</p>
              <p>Your payment information is encrypted and secure. We never store your card details.</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!stripe || !cardComplete || loading || disabled}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors duration-200 ${
            !stripe || !cardComplete || loading || disabled
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Payment...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Pay ${amount.toFixed(2)}
            </div>
          )}
        </button>

        {/* Test Card Information (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Test Mode</p>
                <p>Use test card: <code className="bg-yellow-100 px-1 rounded">4242 4242 4242 4242</code></p>
                <p>Any future date, any CVC</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default PaymentForm;
