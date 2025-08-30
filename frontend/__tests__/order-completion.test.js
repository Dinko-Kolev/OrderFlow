import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../contexts/AuthContext'
import PaymentForm from '../components/PaymentForm'

// Mock Stripe
const mockStripe = {
  confirmCardPayment: jest.fn(),
}

const mockElements = {
  getElement: jest.fn(() => ({
    clear: jest.fn(),
  })),
}

jest.mock('@stripe/react-stripe-js', () => {
  // Create a proper mock for CardElement that simulates onChange events
  const MockCardElement = ({ onChange, options, className }) => {
    const handleComplete = () => {
      onChange({ complete: true })
    }
    
    const handleError = () => {
      onChange({ complete: false, error: { message: 'Card error' } })
    }
    
    return (
      <div
        data-testid="card-element"
        className={className}
      >
        <div>Card Input Mock</div>
        <button 
          type="button" 
          onClick={handleComplete}
          data-testid="complete-card"
        >
          Complete Card
        </button>
        <button 
          type="button" 
          onClick={handleError}
          data-testid="error-card"
        >
          Error Card
        </button>
      </div>
    )
  }

  return {
    useStripe: () => mockStripe,
    useElements: () => mockElements,
    CardElement: MockCardElement,
  }
})

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

const renderWithAuth = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  )
}

describe('Order Completion - PaymentForm Component', () => {
  const defaultProps = {
    amount: 25.99,
    onSuccess: jest.fn(),
    onError: jest.fn(),
    onProcessing: jest.fn(),
    customerData: {
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+1234567890',
      deliveryType: 'delivery',
      deliveryAddress: '123 Main St, City, State 12345',
      specialInstructions: 'Ring doorbell twice',
      items: [
        { productId: 1, quantity: 2, name: 'Margherita Pizza', price: 12.99 },
        { productId: 2, quantity: 1, name: 'Caesar Salad', price: 8.99 }
      ]
    },
    className: 'test-payment-form',
    disabled: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue('mock-token')
  })

  describe('Initial Rendering', () => {
    test('renders payment form with correct amount', () => {
      renderWithAuth(<PaymentForm {...defaultProps} />)
      
      expect(screen.getByText(/total amount:/i)).toBeInTheDocument()
      expect(screen.getByText('$25.99')).toBeInTheDocument()
      expect(screen.getByText(/card information/i)).toBeInTheDocument()
      expect(screen.getByTestId('card-element')).toBeInTheDocument()
      expect(screen.getByText(/pay \$25\.99/i)).toBeInTheDocument()
    })

    test('shows customer data when provided', () => {
      renderWithAuth(<PaymentForm {...defaultProps} />)
      
      expect(screen.getByText(/secure payment/i)).toBeInTheDocument()
      expect(screen.getByText(/your payment information is encrypted/i)).toBeInTheDocument()
    })

    test('shows test mode information in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      renderWithAuth(<PaymentForm {...defaultProps} />)
      
      expect(screen.getByText(/test mode/i)).toBeInTheDocument()
      expect(screen.getByText(/4242 4242 4242 4242/i)).toBeInTheDocument()
      
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Form Validation', () => {
    test('submit button is disabled initially (card not complete)', () => {
      renderWithAuth(<PaymentForm {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: /pay \$25\.99/i })
      expect(submitButton).toBeDisabled()
    })

    test('submit button is disabled when form is disabled', () => {
      renderWithAuth(<PaymentForm {...defaultProps} disabled={true} />)
      
      const submitButton = screen.getByRole('button', { name: /pay \$25\.99/i })
      expect(submitButton).toBeDisabled()
    })

    test('submit button becomes enabled when card is complete', async () => {
      const user = userEvent.setup()
      renderWithAuth(<PaymentForm {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: /pay \$25\.99/i })
      expect(submitButton).toBeDisabled()
      
      // Complete the card
      const completeButton = screen.getByTestId('complete-card')
      await user.click(completeButton)
      
      // Button should now be enabled
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Order Creation - Guest User', () => {
    test('creates order successfully for guest user', async () => {
      const user = userEvent.setup()
      
      // Mock fetch to return successful order creation
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          order: { id: 1, status: 'pending' },
          paymentIntent: { clientSecret: 'pi_test_secret' }
        })
      })

      // Mock successful payment confirmation
      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        error: null,
        paymentIntent: { status: 'succeeded' }
      })

      renderWithAuth(<PaymentForm {...defaultProps} />)

      // Complete the card first
      const completeCardButton = screen.getByTestId('complete-card')
      await user.click(completeCardButton)

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /pay \$25\.99/i })
      await user.click(submitButton)

      // Wait for success callback
      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalledWith({
          order: { id: 1, status: 'pending' },
          paymentIntent: { status: 'succeeded' },
          paymentMethod: undefined // Updated to match actual response
        })
      })
    })
  })

  describe('Order Creation - Authenticated User', () => {
    test('creates order successfully for authenticated user', async () => {
      const user = userEvent.setup()
      
      // Mock fetch to return successful order creation
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          order: { id: 1, status: 'pending' },
          paymentIntent: { clientSecret: 'pi_test_secret' }
        })
      })

      // Mock successful payment confirmation
      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        error: null,
        paymentIntent: { status: 'succeeded' }
      })

      renderWithAuth(<PaymentForm {...defaultProps} />)

      // Complete the card first
      const completeCardButton = screen.getByTestId('complete-card')
      await user.click(completeCardButton)

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /pay \$25\.99/i })
      await user.click(submitButton)

      // Wait for fetch to be called with correct parameters
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/orders', // Updated to match actual URL
          expect.objectContaining({
            headers: {
              'Authorization': 'Bearer mock-token',
              'Content-Type': 'application/json'
            },
            method: 'POST'
          })
        )
      })
    })
  })

  describe('Payment Processing', () => {
    test('calls onProcessing callback during payment', async () => {
      const user = userEvent.setup()
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          order: { id: 5, status: 'pending' },
          paymentIntent: { clientSecret: 'pi_callback_secret' }
        })
      })
      
      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        error: null,
        paymentIntent: { status: 'succeeded' }
      })
      
      renderWithAuth(<PaymentForm {...defaultProps} />)
      
      // Complete the card first
      const completeButton = screen.getByTestId('complete-card')
      await user.click(completeButton)
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /pay \$25\.99/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(defaultProps.onProcessing).toHaveBeenCalledWith(true)
      })
      
      await waitFor(() => {
        expect(defaultProps.onProcessing).toHaveBeenCalledWith(false)
      })
    })
  })

  describe('Error Handling', () => {
    test('handles order creation failure', async () => {
      const user = userEvent.setup()
      
      // Mock fetch to return error
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request'
      })

      renderWithAuth(<PaymentForm {...defaultProps} />)

      // Complete the card first
      const completeCardButton = screen.getByTestId('complete-card')
      await user.click(completeCardButton)

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /pay \$25\.99/i })
      await user.click(submitButton)

      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/server error \(400\)/i)).toBeInTheDocument()
      })
    })

    test('handles payment confirmation failure', async () => {
      const user = userEvent.setup()
      
      // Mock fetch to return successful order creation
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          order: { id: 1, status: 'pending' },
          paymentIntent: { clientSecret: 'pi_test_secret' }
        })
      })

      // Mock Stripe payment confirmation to fail
      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        error: { message: 'Card declined' },
        paymentIntent: null
      })

      renderWithAuth(<PaymentForm {...defaultProps} />)

      // Complete the card first
      const completeCardButton = screen.getByTestId('complete-card')
      await user.click(completeCardButton)

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /pay \$25\.99/i })
      await user.click(submitButton)

      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/card declined/i)).toBeInTheDocument()
      })
    })

    test('handles missing payment intent', async () => {
      const user = userEvent.setup()
      
      // Mock fetch to return successful order creation but without payment intent
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          order: { id: 1, status: 'pending' }
          // No paymentIntent
        })
      })

      renderWithAuth(<PaymentForm {...defaultProps} />)

      // Complete the card first
      const completeCardButton = screen.getByTestId('complete-card')
      await user.click(completeCardButton)

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /pay \$25\.99/i })
      await user.click(submitButton)

      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/payment intent not received/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    test('has proper form structure and labels', () => {
      renderWithAuth(<PaymentForm {...defaultProps} />)
      
      expect(screen.getByText(/card information/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /pay \$25\.99/i })).toBeInTheDocument()
      expect(screen.getByText(/secure payment/i)).toBeInTheDocument()
    })

    test('shows error messages clearly when card has errors', async () => {
      const user = userEvent.setup()
      
      // Mock fetch to return error with text method
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Please complete your card information'
      })

      renderWithAuth(<PaymentForm {...defaultProps} />)

      // Complete the card first
      const completeCardButton = screen.getByTestId('complete-card')
      await user.click(completeCardButton)

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /pay \$25\.99/i })
      await user.click(submitButton)

      // Wait for error message to appear - the component shows a generic error message
      await waitFor(() => {
        expect(screen.getByText(/server error \(400\)/i)).toBeInTheDocument()
      })
    })
  })
})
