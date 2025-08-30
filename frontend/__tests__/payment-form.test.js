import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import PaymentForm from '../components/PaymentForm'

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    elements: jest.fn(() => ({
      create: jest.fn(() => ({
        mount: jest.fn(),
        unmount: jest.fn(),
        clear: jest.fn(),
        on: jest.fn(),
      })),
    })),
    confirmCardPayment: jest.fn(),
  })),
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock environment variables
const originalEnv = process.env
beforeEach(() => {
  process.env = { ...originalEnv, NEXT_PUBLIC_API_URL: 'http://localhost:3001' }
})

afterEach(() => {
  process.env = originalEnv
})

// Test data
const mockCustomerData = {
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
}

const mockStripeElement = {
  mount: jest.fn(),
  unmount: jest.fn(),
  clear: jest.fn(),
  on: jest.fn((event, callback) => {
    if (event === 'change') {
      // Simulate card completion
      setTimeout(() => callback({ complete: true }), 100)
    }
  }),
}

// Mock Stripe Elements
const MockCardElement = ({ onChange }) => {
  React.useEffect(() => {
    // Simulate Stripe element change
    setTimeout(() => {
      onChange({ complete: true })
    }, 100)
  }, [onChange])
  
  return <div data-testid="card-element">Card Element</div>
}

// Mock Stripe useStripe and useElements hooks
jest.mock('@stripe/react-stripe-js', () => ({
  ...jest.requireActual('@stripe/react-stripe-js'),
  useStripe: () => ({
    confirmCardPayment: jest.fn(() => Promise.resolve({
      error: null,
      paymentIntent: { status: 'succeeded' }
    })),
    elements: jest.fn(() => ({
      getElement: jest.fn(() => mockStripeElement),
    })),
  }),
  useElements: () => ({
    getElement: jest.fn(() => mockStripeElement),
  }),
  CardElement: MockCardElement,
  Elements: ({ children }) => children,
}))

// Helper function to render PaymentForm
const renderPaymentForm = (props = {}) => {
  const defaultProps = {
    amount: 34.97,
    onSuccess: jest.fn(),
    onError: jest.fn(),
    onProcessing: jest.fn(),
    customerData: mockCustomerData,
    className: '',
    disabled: false,
  }
  
  return render(
    <Elements stripe={null}>
      <PaymentForm {...defaultProps} {...props} />
    </Elements>
  )
}

describe('PaymentForm Component', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
    jest.clearAllMocks()
    global.fetch.mockClear()
    localStorageMock.getItem.mockClear()
  })

  describe('Initial Rendering', () => {
    test('renders payment form with amount display', () => {
      renderPaymentForm()
      
      expect(screen.getByText('$34.97')).toBeInTheDocument()
      expect(screen.getByText('Card Element')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /pay/i })).toBeInTheDocument()
    })

    test('displays customer information summary', () => {
      renderPaymentForm()
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('+1234567890')).toBeInTheDocument()
      expect(screen.getByText('delivery')).toBeInTheDocument()
      expect(screen.getByText('123 Main St, City, State 12345')).toBeInTheDocument()
    })

    test('shows order items summary', () => {
      renderPaymentForm()
      
      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument()
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument()
      expect(screen.getByText('2x')).toBeInTheDocument()
      expect(screen.getByText('1x')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    test('shows error when card is incomplete', async () => {
      // Mock incomplete card
      const incompleteMockElement = {
        ...mockStripeElement,
        on: jest.fn((event, callback) => {
          if (event === 'change') {
            setTimeout(() => callback({ complete: false }), 100)
          }
        }),
      }
      
      jest.doMock('@stripe/react-stripe-js', () => ({
        ...jest.requireActual('@stripe/react-stripe-js'),
        useElements: () => ({
          getElement: jest.fn(() => incompleteMockElement),
        }),
      }))
      
      renderPaymentForm()
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Please complete your card information.')).toBeInTheDocument()
      })
    })

    test('validates required customer data', async () => {
      const invalidCustomerData = {
        customerName: '',
        customerEmail: '',
        deliveryType: '',
        items: []
      }
      
      renderPaymentForm({ customerData: invalidCustomerData })
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Missing required order information. Please check your cart and customer details.')).toBeInTheDocument()
      })
    })

    test('validates items structure', async () => {
      const invalidItemsData = {
        ...mockCustomerData,
        items: [
          { productId: 1, quantity: 0 }, // Invalid quantity
          { productId: 2, name: 'Salad' } // Missing quantity
        ]
      }
      
      renderPaymentForm({ customerData: invalidItemsData })
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid item/)).toBeInTheDocument()
      })
    })
  })

  describe('Order Creation', () => {
    test('creates order with correct payload for authenticated user', async () => {
      localStorageMock.getItem.mockReturnValue('auth-token-123')
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          order: { id: 1, orderNumber: 'ORD-001' },
          paymentIntent: { clientSecret: 'pi_test_secret' }
        })
      })
      
      renderPaymentForm()
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/orders',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer auth-token-123'
            },
            body: JSON.stringify({
              customerName: 'John Doe',
              customerEmail: 'john@example.com',
              customerPhone: '+1234567890',
              deliveryType: 'delivery',
              deliveryAddress: '123 Main St, City, State 12345',
              specialInstructions: 'Ring doorbell twice',
              items: mockCustomerData.items,
              totalAmount: 34.97,
              paymentMethod: 'stripe'
            })
          })
        )
      })
    })

    test('creates order without auth token for guest user', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          order: { id: 1, orderNumber: 'ORD-001' },
          paymentIntent: { clientSecret: 'pi_test_secret' }
        })
      })
      
      renderPaymentForm()
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/orders',
          expect.objectContaining({
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer '
            }
          })
        )
      })
    })

    test('handles order creation failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request')
      })
      
      const onError = jest.fn()
      renderPaymentForm({ onError })
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Bad Request')).toBeInTheDocument()
        expect(onError).toHaveBeenCalled()
      })
    })

    test('handles non-JSON error responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('<!DOCTYPE html><html>Server Error</html>')
      })
      
      renderPaymentForm()
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Server error (500). Please check your order details and try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Payment Processing', () => {
    test('processes payment successfully with Stripe', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          order: { id: 1, orderNumber: 'ORD-001' },
          paymentIntent: { clientSecret: 'pi_test_secret' }
        })
      })
      
      const onSuccess = jest.fn()
      renderPaymentForm({ onSuccess })
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({
          order: { id: 1, orderNumber: 'ORD-001' },
          paymentIntent: { status: 'succeeded' },
          paymentMethod: undefined
        })
      })
    })

    test('handles Stripe payment failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          order: { id: 1, orderNumber: 'ORD-001' },
          paymentIntent: { clientSecret: 'pi_test_secret' }
        })
      })
      
      // Mock Stripe error
      const { useStripe } = require('@stripe/react-stripe-js')
      useStripe.mockReturnValue({
        confirmCardPayment: jest.fn(() => Promise.resolve({
          error: { message: 'Card declined' },
          paymentIntent: null
        })),
        elements: jest.fn(() => ({
          getElement: jest.fn(() => mockStripeElement),
        })),
      })
      
      renderPaymentForm()
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Card declined')).toBeInTheDocument()
      })
    })

    test('handles payment intent status other than succeeded', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          order: { id: 1, orderNumber: 'ORD-001' },
          paymentIntent: { clientSecret: 'pi_test_secret' }
        })
      })
      
      // Mock payment intent with non-succeeded status
      const { useStripe } = require('@stripe/react-stripe-js')
      useStripe.mockReturnValue({
        confirmCardPayment: jest.fn(() => Promise.resolve({
          error: null,
          paymentIntent: { status: 'processing' }
        })),
        elements: jest.fn(() => ({
          getElement: jest.fn(() => mockStripeElement),
        })),
      })
      
      renderPaymentForm()
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Payment status: processing')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    test('shows loading state during payment processing', async () => {
      global.fetch.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            order: { id: 1, orderNumber: 'ORD-001' },
            paymentIntent: { clientSecret: 'pi_test_secret' }
          })
        }), 100))
      )
      
      const onProcessing = jest.fn()
      renderPaymentForm({ onProcessing })
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      // Should show loading state
      expect(screen.getByText('Processing...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      
      // Should call onProcessing with true
      expect(onProcessing).toHaveBeenCalledWith(true)
    })

    test('disables form during processing', async () => {
      global.fetch.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            order: { id: 1, orderNumber: 'ORD-001' },
            paymentIntent: { clientSecret: 'pi_test_secret' }
          })
        }), 100))
      )
      
      renderPaymentForm()
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      // Form should be disabled
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    test('handles network errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))
      
      renderPaymentForm()
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    test('handles missing payment intent', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          order: { id: 1, orderNumber: 'ORD-001' }
          // Missing paymentIntent
        })
      })
      
      renderPaymentForm()
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Payment intent not received from server')).toBeInTheDocument()
      })
    })

    test('clears form on successful payment', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          order: { id: 1, orderNumber: 'ORD-001' },
          paymentIntent: { clientSecret: 'pi_test_secret' }
        })
      })
      
      renderPaymentForm()
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        // Should clear the form
        expect(mockStripeElement.clear).toHaveBeenCalled()
      })
    })
  })

  describe('Disabled State', () => {
    test('prevents submission when disabled', async () => {
      renderPaymentForm({ disabled: true })
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      expect(submitButton).toBeDisabled()
      
      await user.click(submitButton)
      
      // Should not make any API calls
      expect(global.fetch).not.toHaveBeenCalled()
    })

    test('shows disabled styling when disabled', () => {
      renderPaymentForm({ disabled: true })
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      expect(submitButton).toHaveClass('opacity-50', 'cursor-not-allowed')
    })
  })

  describe('Customer Data Display', () => {
    test('displays pickup order information correctly', () => {
      const pickupData = {
        ...mockCustomerData,
        deliveryType: 'pickup',
        deliveryAddress: undefined
      }
      
      renderPaymentForm({ customerData: pickupData })
      
      expect(screen.getByText('pickup')).toBeInTheDocument()
      expect(screen.queryByText('123 Main St, City, State 12345')).not.toBeInTheDocument()
    })

    test('displays special instructions when provided', () => {
      renderPaymentForm()
      
      expect(screen.getByText('Ring doorbell twice')).toBeInTheDocument()
    })

    test('handles missing special instructions', () => {
      const dataWithoutInstructions = {
        ...mockCustomerData,
        specialInstructions: ''
      }
      
      renderPaymentForm({ customerData: dataWithoutInstructions })
      
      // Should not show special instructions section
      expect(screen.queryByText('Special Instructions')).not.toBeInTheDocument()
    })
  })

  describe('Amount Calculations', () => {
    test('displays correct total amount', () => {
      renderPaymentForm({ amount: 45.50 })
      
      expect(screen.getByText('$45.50')).toBeInTheDocument()
    })

    test('handles zero amount', () => {
      renderPaymentForm({ amount: 0 })
      
      expect(screen.getByText('$0.00')).toBeInTheDocument()
    })

    test('handles decimal amounts', () => {
      renderPaymentForm({ amount: 19.99 })
      
      expect(screen.getByText('$19.99')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has proper form labels and associations', () => {
      renderPaymentForm()
      
      expect(screen.getByRole('button', { name: /pay/i })).toBeInTheDocument()
      expect(screen.getByText('Card Element')).toBeInTheDocument()
    })

    test('supports keyboard navigation', async () => {
      renderPaymentForm()
      
      // Tab to submit button
      await user.tab()
      expect(screen.getByRole('button', { name: /pay/i })).toHaveFocus()
    })
  })

  describe('Integration with Parent Components', () => {
    test('calls onSuccess callback with correct data', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          order: { id: 1, orderNumber: 'ORD-001' },
          paymentIntent: { clientSecret: 'pi_test_secret' }
        })
      })
      
      const onSuccess = jest.fn()
      renderPaymentForm({ onSuccess })
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({
          order: { id: 1, orderNumber: 'ORD-001' },
          paymentIntent: { status: 'succeeded' },
          paymentMethod: undefined
        })
      })
    })

    test('calls onError callback on failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))
      
      const onError = jest.fn()
      renderPaymentForm({ onError })
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error))
      })
    })

    test('calls onProcessing callback during processing', async () => {
      global.fetch.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            order: { id: 1, orderNumber: 'ORD-001' },
            paymentIntent: { clientSecret: 'pi_test_secret' }
          })
        }), 100))
      )
      
      const onProcessing = jest.fn()
      renderPaymentForm({ onProcessing })
      
      const submitButton = screen.getByRole('button', { name: /pay/i })
      await user.click(submitButton)
      
      expect(onProcessing).toHaveBeenCalledWith(true)
      
      await waitFor(() => {
        expect(onProcessing).toHaveBeenCalledWith(false)
      })
    })
  })
})
