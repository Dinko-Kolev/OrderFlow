import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CheckoutPage from '../pages/checkout'
import { CartProvider } from '../contexts/CartContext'
import { AuthProvider } from '../contexts/AuthContext'

// Mock the API module
const mockApi = require('../lib/api').api

// Test wrapper component
const TestWrapper = ({ children, cartItems = [], user = null }) => {
  const mockCartContext = {
    items: cartItems,
    totalItems: cartItems.length,
    totalPrice: cartItems.reduce((sum, item) => sum + (item.total_price * item.quantity), 0),
    clearCart: jest.fn(),
  }

  const mockAuthContext = {
    user,
    isAuthenticated: !!user,
  }

  return (
    <AuthProvider value={mockAuthContext}>
      <CartProvider value={mockCartContext}>
        {children}
      </CartProvider>
    </AuthProvider>
  )
}

// Mock cart items for testing
const mockCartItems = [
  {
    id: 1,
    product_id: 1,
    product_name: 'Margherita Pizza',
    product_image: '/images/margherita.jpg',
    quantity: 2,
    base_price: 12.99,
    total_price: 25.98,
    customizations: [
      { topping_name: 'Extra Cheese', price: 2.00, quantity: 1 }
    ],
    special_instructions: 'Extra crispy crust'
  },
  {
    id: 2,
    product_id: 2,
    product_name: 'Pepperoni Pizza',
    product_image: '/images/pepperoni.jpg',
    quantity: 1,
    base_price: 14.99,
    total_price: 14.99,
    customizations: [],
    special_instructions: ''
  }
]

describe('CheckoutPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock successful API response
    mockApi.orders.create.mockResolvedValue({
      success: true,
      order: { orderNumber: 'ORD-12345' }
    })
  })

  describe('Page Rendering', () => {
    test('renders checkout page with correct title', () => {
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      expect(screen.getByText('Finalizar Pedido')).toBeInTheDocument()
      expect(screen.getByText('2 productos en tu carrito')).toBeInTheDocument()
    })

    test('renders order summary with cart items', () => {
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      expect(screen.getByText('Resumen del Pedido')).toBeInTheDocument()
      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument()
      expect(screen.getByText('Pepperoni Pizza')).toBeInTheDocument()
      expect(screen.getByText('Cantidad: 2')).toBeInTheDocument()
      expect(screen.getByText('Cantidad: 1')).toBeInTheDocument()
    })

    test('displays correct pricing information', () => {
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      // Total should be sum of items + delivery fee
      const total = mockCartItems.reduce((sum, item) => sum + (item.total_price * item.quantity), 0) + 2.50
      expect(screen.getByText(`€${total.toFixed(2)}`)).toBeInTheDocument()
    })
  })

  describe('Customer Information Form', () => {
    test('renders all required customer information fields', () => {
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      expect(screen.getByLabelText('Nombre Completo *')).toBeInTheDocument()
      expect(screen.getByLabelText('Teléfono *')).toBeInTheDocument()
      expect(screen.getByLabelText('Email *')).toBeInTheDocument()
    })

    test('allows user to input customer information', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      const nameInput = screen.getByLabelText('Nombre Completo *')
      const phoneInput = screen.getByLabelText('Teléfono *')
      const emailInput = screen.getByLabelText('Email *')
      
      await user.type(nameInput, 'Juan Pérez')
      await user.type(phoneInput, '600123456')
      await user.type(emailInput, 'juan@example.com')
      
      expect(nameInput).toHaveValue('Juan Pérez')
      expect(phoneInput).toHaveValue('600123456')
      expect(emailInput).toHaveValue('juan@example.com')
    })

    test('pre-fills form with user data when logged in', () => {
      const loggedInUser = { name: 'Juan Pérez', email: 'juan@example.com' }
      render(
        <TestWrapper cartItems={mockCartItems} user={loggedInUser}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      expect(screen.getByDisplayValue('Juan Pérez')).toBeInTheDocument()
      expect(screen.getByDisplayValue('juan@example.com')).toBeInTheDocument()
    })
  })

  describe('Delivery Options', () => {
    test('renders delivery and pickup options', () => {
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      expect(screen.getByText('Delivery')).toBeInTheDocument()
      expect(screen.getByText('Recoger')).toBeInTheDocument()
      expect(screen.getByText('Entrega a domicilio')).toBeInTheDocument()
      expect(screen.getByText('Recoge en restaurante')).toBeInTheDocument()
    })

    test('allows user to select delivery option', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      const deliveryOption = screen.getByText('Delivery').closest('div')
      await user.click(deliveryOption)
      
      // Should show delivery address field
      expect(screen.getByLabelText('Dirección de Entrega *')).toBeInTheDocument()
    })

    test('allows user to select pickup option', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      const pickupOption = screen.getByText('Recoger').closest('div')
      await user.click(pickupOption)
      
      // Delivery address field should not be required for pickup
      expect(screen.queryByLabelText('Dirección de Entrega *')).not.toBeInTheDocument()
    })

    test('shows delivery address field when delivery is selected', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      const deliveryOption = screen.getByText('Delivery').closest('div')
      await user.click(deliveryOption)
      
      const addressInput = screen.getByLabelText('Dirección de Entrega *')
      await user.type(addressInput, 'Calle Mayor 123, Madrid')
      
      expect(addressInput).toHaveValue('Calle Mayor 123, Madrid')
    })
  })

  describe('Payment Method Selection', () => {
    test('renders payment method options', () => {
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      expect(screen.getByLabelText('Tarjeta de Crédito/Débito')).toBeInTheDocument()
      expect(screen.getByLabelText('Efectivo')).toBeInTheDocument()
    })

    test('allows user to select payment method', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      const cashOption = screen.getByLabelText('Efectivo')
      await user.click(cashOption)
      
      expect(cashOption).toBeChecked()
    })

    test('defaults to card payment', () => {
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      const cardOption = screen.getByLabelText('Tarjeta de Crédito/Débito')
      expect(cardOption).toBeChecked()
    })
  })

  describe('Special Instructions', () => {
    test('renders special instructions field', () => {
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      expect(screen.getByLabelText('Instrucciones Especiales')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('¿Alguna instrucción especial para tu pedido? (Opcional)')).toBeInTheDocument()
    })

    test('allows user to input special instructions', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      const instructionsInput = screen.getByLabelText('Instrucciones Especiales')
      await user.type(instructionsInput, 'Please deliver to the back entrance')
      
      expect(instructionsInput).toHaveValue('Please deliver to the back entrance')
    })
  })

  describe('Form Validation', () => {
    test('shows error for missing required fields', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      const submitButton = screen.getByText(/Confirmar Pedido/)
      await user.click(submitButton)
      
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
      expect(screen.getByText('El email es obligatorio')).toBeInTheDocument()
      expect(screen.getByText('El teléfono es obligatorio')).toBeInTheDocument()
    })

    test('shows error for invalid email format', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      const emailInput = screen.getByLabelText('Email *')
      await user.type(emailInput, 'invalid-email')
      
      const submitButton = screen.getByText(/Confirmar Pedido/)
      await user.click(submitButton)
      
      expect(screen.getByText('Email inválido')).toBeInTheDocument()
    })

    test('shows error for missing delivery address when delivery is selected', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      // Select delivery option
      const deliveryOption = screen.getByText('Delivery').closest('div')
      await user.click(deliveryOption)
      
      // Fill other required fields
      await user.type(screen.getByLabelText('Nombre Completo *'), 'Juan Pérez')
      await user.type(screen.getByLabelText('Email *'), 'juan@example.com')
      await user.type(screen.getByLabelText('Teléfono *'), '600123456')
      
      const submitButton = screen.getByText(/Confirmar Pedido/)
      await user.click(submitButton)
      
      expect(screen.getByText('La dirección de entrega es obligatoria')).toBeInTheDocument()
    })
  })

  describe('Order Submission', () => {
    test('submits order with correct data when form is valid', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      // Fill all required fields
      await user.type(screen.getByLabelText('Nombre Completo *'), 'Juan Pérez')
      await user.type(screen.getByLabelText('Email *'), 'juan@example.com')
      await user.type(screen.getByLabelText('Teléfono *'), '600123456')
      
      // Select delivery and add address
      const deliveryOption = screen.getByText('Delivery').closest('div')
      await user.click(deliveryOption)
      await user.type(screen.getByLabelText('Dirección de Entrega *'), 'Calle Mayor 123')
      
      // Add special instructions
      await user.type(screen.getByLabelText('Instrucciones Especiales'), 'Ring doorbell twice')
      
      // Submit order
      const submitButton = screen.getByText(/Confirmar Pedido/)
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockApi.orders.create).toHaveBeenCalledWith({
          userId: null, // Guest user
          guestEmail: 'juan@example.com',
          customerName: 'Juan Pérez',
          customerPhone: '600123456',
          customerEmail: 'juan@example.com',
          deliveryType: 'delivery',
          deliveryAddress: 'Calle Mayor 123',
          paymentMethod: 'card',
          specialInstructions: 'Ring doorbell twice',
          items: mockCartItems.map(item => ({
            productId: item.product_id,
            quantity: item.quantity,
            customizations: item.customizations || [],
            specialInstructions: item.special_instructions || ''
          }))
        })
      })
    })

    test('shows loading state during submission', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      // Fill form and submit
      await user.type(screen.getByLabelText('Nombre Completo *'), 'Juan Pérez')
      await user.type(screen.getByLabelText('Email *'), 'juan@example.com')
      await user.type(screen.getByLabelText('Teléfono *'), '600123456')
      
      const submitButton = screen.getByText(/Confirmar Pedido/)
      await user.click(submitButton)
      
      expect(screen.getByText('Procesando Pedido...')).toBeInTheDocument()
    })

    test('handles API errors gracefully', async () => {
      // Mock API error
      mockApi.orders.create.mockRejectedValue(new Error('Network error'))
      
      const user = userEvent.setup()
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      // Fill form and submit
      await user.type(screen.getByLabelText('Nombre Completo *'), 'Juan Pérez')
      await user.type(screen.getByLabelText('Email *'), 'juan@example.com')
      await user.type(screen.getByLabelText('Teléfono *'), '600123456')
      
      const submitButton = screen.getByText(/Confirmar Pedido/)
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Error al procesar el pedido. Inténtalo de nuevo.')).toBeInTheDocument()
      })
    })
  })

  describe('Order Summary Display', () => {
    test('displays cart items with images and details', () => {
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      // Check if images are displayed
      const images = screen.getAllByRole('img')
      expect(images).toHaveLength(2)
      expect(images[0]).toHaveAttribute('src', '/images/margherita.jpg')
      expect(images[1]).toHaveAttribute('src', '/images/pepperoni.jpg')
      
      // Check item details
      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument()
      expect(screen.getByText('Pepperoni Pizza')).toBeInTheDocument()
      expect(screen.getByText('Con personalizaciones')).toBeInTheDocument()
    })

    test('shows customization details', () => {
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      expect(screen.getByText('Con personalizaciones')).toBeInTheDocument()
    })

    test('displays correct pricing breakdown', () => {
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      const subtotal = mockCartItems.reduce((sum, item) => sum + (item.total_price * item.quantity), 0)
      const deliveryFee = 2.50
      const total = subtotal + deliveryFee
      
      expect(screen.getByText(`€${subtotal.toFixed(2)}`)).toBeInTheDocument()
      expect(screen.getByText(`€${deliveryFee.toFixed(2)}`)).toBeInTheDocument()
      expect(screen.getByText(`€${total.toFixed(2)}`)).toBeInTheDocument()
    })

    test('shows estimated delivery time', () => {
      render(
        <TestWrapper cartItems={mockCartItems}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      expect(screen.getByText('Tiempo estimado')).toBeInTheDocument()
      expect(screen.getByText('30-45 minutos')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('redirects when cart is empty', () => {
      render(
        <TestWrapper cartItems={[]}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      // Should redirect to menu when cart is empty
      expect(screen.queryByText('Finalizar Pedido')).not.toBeInTheDocument()
    })

    test('handles items without images gracefully', () => {
      const itemsWithoutImages = [
        {
          id: 1,
          product_id: 1,
          product_name: 'Plain Pizza',
          product_image: null,
          quantity: 1,
          base_price: 10.99,
          total_price: 10.99,
          customizations: [],
          special_instructions: ''
        }
      ]
      
      render(
        <TestWrapper cartItems={itemsWithoutImages}>
          <CheckoutPage />
        </TestWrapper>
      )
      
      expect(screen.getByText('Plain Pizza')).toBeInTheDocument()
      // Should show shopping bag icon for items without images
      expect(screen.getByTestId('shopping-bag-icon')).toBeInTheDocument()
    })
  })
})
