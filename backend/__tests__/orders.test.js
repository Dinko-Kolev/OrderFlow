const request = require('supertest')
const jwt = require('jsonwebtoken')
const { Pool } = require('pg')

// Mock the database pool
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  })),
}))

// Mock Stripe
jest.mock('stripe', () => jest.fn(() => ({
  paymentIntents: {
    create: jest.fn(() => Promise.resolve({ 
      id: 'pi_test_123', 
      client_secret: 'pi_test_secret_123' 
    })),
    retrieve: jest.fn(() => Promise.resolve({ 
      id: 'pi_test_123', 
      status: 'succeeded' 
    })),
  },
  customers: {
    create: jest.fn(() => Promise.resolve({ id: 'cus_test_123' })),
  },
})))

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.STRIPE_SECRET_KEY = 'test-stripe-secret-key'
process.env.NODE_ENV = 'test'

// Import the app after mocking
let app
let mockPool

describe('Orders API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset mock pool
    mockPool = {
      connect: jest.fn(),
      query: jest.fn(),
      end: jest.fn(),
    }
    Pool.mockImplementation(() => mockPool)
    
    // Import app after mocking
    delete require.cache[require.resolve('../server')]
    app = require('../server')
  })

  afterEach(() => {
    jest.resetModules()
  })

  describe('POST /api/orders', () => {
    const validOrderData = {
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+1234567890',
      deliveryType: 'delivery',
      deliveryAddress: '123 Main St, City, State 12345',
      specialInstructions: 'Ring doorbell twice',
      items: [
        { productId: 1, quantity: 2, name: 'Margherita Pizza', price: 12.99 },
        { productId: 2, quantity: 1, name: 'Caesar Salad', price: 8.99 }
      ],
      totalAmount: 34.97,
      paymentMethod: 'card'
    }

    const validAuthToken = jwt.sign(
      { id: 1, email: 'john@example.com' },
      'test-jwt-secret',
      { expiresIn: '1h' }
    )

    describe('Authenticated User Orders', () => {
      test('creates order successfully for authenticated user with card payment', async () => {
        // Mock database responses
        mockPool.query
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com'
            }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [{ order_number: 'ORD-20241201-0001' }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              order_number: 'ORD-20241201-0001',
              customer_name: 'John Doe',
              customer_email: 'john@example.com',
              customer_phone: '+1234567890',
              delivery_type: 'delivery',
              delivery_address_text: '123 Main St, City, State 12345',
              special_instructions: 'Ring doorbell twice',
              subtotal: 34.97,
              total_amount: 34.97,
              payment_status: 'pending',
              status: 'pending'
            }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [
              { id: 1, product_id: 1, quantity: 2, price: 12.99 },
              { id: 2, product_id: 2, quantity: 1, price: 8.99 }
            ],
            rowCount: 2
          })

        const response = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${validAuthToken}`)
          .send(validOrderData)
          .expect(201)

        expect(response.body.success).toBe(true)
        expect(response.body.order).toBeDefined()
        expect(response.body.paymentIntent).toBeDefined()
        expect(response.body.order.orderNumber).toBe('ORD-20241201-0001')
        expect(response.body.order.customerName).toBe('John Doe')
        expect(response.body.order.customerEmail).toBe('john@example.com')
        expect(response.body.order.deliveryType).toBe('delivery')
        expect(response.body.order.paymentStatus).toBe('pending')
      })

      test('creates order for authenticated user with cash payment', async () => {
        const cashOrderData = {
          ...validOrderData,
          paymentMethod: 'cash'
        }

        mockPool.query
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com'
            }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [{ order_number: 'ORD-20241201-0001' }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              order_number: 'ORD-20241201-0001',
              customer_name: 'John Doe',
              customer_email: 'john@example.com',
              customer_phone: '+1234567890',
              delivery_type: 'delivery',
              delivery_address_text: '123 Main St, City, State 12345',
              special_instructions: 'Ring doorbell twice',
              subtotal: 34.97,
              total_amount: 34.97,
              payment_status: 'pending',
              status: 'pending'
            }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [
              { id: 1, product_id: 1, quantity: 2, price: 12.99 },
              { id: 2, product_id: 2, quantity: 1, price: 8.99 }
            ],
            rowCount: 2
          })

        const response = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${validAuthToken}`)
          .send(cashOrderData)
          .expect(201)

        expect(response.body.success).toBe(true)
        expect(response.body.order.paymentStatus).toBe('pending')
        expect(response.body.order.paymentMethod).toBe('cash')
        // Should not have payment intent for cash payments
        expect(response.body.paymentIntent).toBeUndefined()
      })

      test('creates pickup order for authenticated user', async () => {
        const pickupOrderData = {
          ...validOrderData,
          deliveryType: 'pickup',
          deliveryAddress: undefined
        }

        mockPool.query
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com'
            }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [{ order_number: 'ORD-20241201-0001' }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              order_number: 'ORD-20241201-0001',
              customer_name: 'John Doe',
              customer_email: 'john@example.com',
              customer_phone: '+1234567890',
              delivery_type: 'pickup',
              delivery_address_text: null,
              special_instructions: 'Ring doorbell twice',
              subtotal: 34.97,
              total_amount: 34.97,
              payment_status: 'pending',
              status: 'pending'
            }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [
              { id: 1, product_id: 1, quantity: 2, price: 12.99 },
              { id: 2, product_id: 2, quantity: 1, price: 8.99 }
            ],
            rowCount: 2
          })

        const response = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${validAuthToken}`)
          .send(pickupOrderData)
          .expect(201)

        expect(response.body.success).toBe(true)
        expect(response.body.order.deliveryType).toBe('pickup')
        expect(response.body.order.deliveryAddress).toBeNull()
      })
    })

    describe('Guest User Orders', () => {
      test('creates order successfully for guest user with card payment', async () => {
        mockPool.query
          .mockResolvedValueOnce({
            rows: [{ order_number: 'ORD-20241201-0001' }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              order_number: 'ORD-20241201-0001',
              customer_name: 'John Doe',
              customer_email: 'john@example.com',
              customer_phone: '+1234567890',
              delivery_type: 'delivery',
              delivery_address_text: '123 Main St, City, State 12345',
              special_instructions: 'Ring doorbell twice',
              subtotal: 34.97,
              total_amount: 34.97,
              payment_status: 'pending',
              status: 'pending'
            }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [
              { id: 1, product_id: 1, quantity: 2, price: 12.99 },
              { id: 2, product_id: 2, quantity: 1, price: 8.99 }
            ],
            rowCount: 2
          })

        const response = await request(app)
          .post('/api/orders')
          .send(validOrderData)
          .expect(201)

        expect(response.body.success).toBe(true)
        expect(response.body.order).toBeDefined()
        expect(response.body.paymentIntent).toBeDefined()
        expect(response.body.order.customerName).toBe('John Doe')
        expect(response.body.order.customerEmail).toBe('john@example.com')
        // Guest user should not have user_id
        expect(response.body.order.userId).toBeUndefined()
      })

      test('creates order for guest user with cash payment', async () => {
        const cashOrderData = {
          ...validOrderData,
          paymentMethod: 'cash'
        }

        mockPool.query
          .mockResolvedValueOnce({
            rows: [{ order_number: 'ORD-20241201-0001' }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              order_number: 'ORD-20241201-0001',
              customer_name: 'John Doe',
              customer_email: 'john@example.com',
              customer_phone: '+1234567890',
              delivery_type: 'delivery',
              delivery_address_text: '123 Main St, City, State 12345',
              special_instructions: 'Ring doorbell twice',
              subtotal: 34.97,
              total_amount: 34.97,
              payment_status: 'pending',
              status: 'pending'
            }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [
              { id: 1, product_id: 1, quantity: 2, price: 12.99 },
              { id: 2, product_id: 2, quantity: 1, price: 8.99 }
            ],
            rowCount: 2
          })

        const response = await request(app)
          .post('/api/orders')
          .send(cashOrderData)
          .expect(201)

        expect(response.body.success).toBe(true)
        expect(response.body.order.paymentStatus).toBe('pending')
        expect(response.body.order.paymentMethod).toBe('cash')
      })
    })

    describe('Validation and Error Handling', () => {
      test('returns error for missing required fields', async () => {
        const invalidOrderData = {
          customerName: '',
          customerEmail: '',
          items: []
        }

        const response = await request(app)
          .post('/api/orders')
          .send(invalidOrderData)
          .expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('validation')
      })

      test('returns error for invalid email format', async () => {
        const invalidEmailData = {
          ...validOrderData,
          customerEmail: 'invalid-email'
        }

        const response = await request(app)
          .post('/api/orders')
          .send(invalidEmailData)
          .expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('email')
      })

      test('returns error for invalid phone format', async () => {
        const invalidPhoneData = {
          ...validOrderData,
          customerPhone: '123'
        }

        const response = await request(app)
          .post('/api/orders')
          .send(invalidPhoneData)
          .expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('phone')
      })

      test('returns error for empty items array', async () => {
        const emptyItemsData = {
          ...validOrderData,
          items: []
        }

        const response = await request(app)
          .post('/api/orders')
          .send(emptyItemsData)
          .expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('items')
      })

      test('returns error for invalid item structure', async () => {
        const invalidItemsData = {
          ...validOrderData,
          items: [
            { productId: 1, quantity: 0 }, // Invalid quantity
            { productId: 2, name: 'Salad' } // Missing quantity
          ]
        }

        const response = await request(app)
          .post('/api/orders')
          .send(invalidItemsData)
          .expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('items')
      })

      test('returns error for invalid delivery type', async () => {
        const invalidDeliveryData = {
          ...validOrderData,
          deliveryType: 'invalid-type'
        }

        const response = await request(app)
          .post('/api/orders')
          .send(invalidDeliveryData)
          .expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('delivery type')
      })

      test('returns error for delivery without address', async () => {
        const deliveryWithoutAddress = {
          ...validOrderData,
          deliveryType: 'delivery',
          deliveryAddress: ''
        }

        const response = await request(app)
          .post('/api/orders')
          .send(deliveryWithoutAddress)
          .expect(400)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('delivery address')
      })
    })

    describe('Database Operations', () => {
      test('generates unique order number', async () => {
        mockPool.query
          .mockResolvedValueOnce({
            rows: [{ order_number: 'ORD-20241201-0001' }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              order_number: 'ORD-20241201-0001',
              customer_name: 'John Doe',
              customer_email: 'john@example.com',
              customer_phone: '+1234567890',
              delivery_type: 'delivery',
              delivery_address_text: '123 Main St, City, State 12345',
              special_instructions: 'Ring doorbell twice',
              subtotal: 34.97,
              total_amount: 34.97,
              payment_status: 'pending',
              status: 'pending'
            }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [
              { id: 1, product_id: 1, quantity: 2, price: 12.99 },
              { id: 2, product_id: 2, quantity: 1, price: 8.99 }
            ],
            rowCount: 2
          })

        const response = await request(app)
          .post('/api/orders')
          .send(validOrderData)
          .expect(201)

        expect(response.body.order.orderNumber).toBe('ORD-20241201-0001')
        
        // Verify order number generation was called
        const orderNumberCall = mockPool.query.mock.calls.find(call => 
          call[0].includes('SELECT generate_order_number()')
        )
        expect(orderNumberCall).toBeDefined()
      })

      test('calculates subtotal correctly', async () => {
        const itemsWithPrices = [
          { productId: 1, quantity: 2, name: 'Pizza', price: 15.00 },
          { productId: 2, quantity: 1, name: 'Salad', price: 10.00 }
        ]

        const orderDataWithPrices = {
          ...validOrderData,
          items: itemsWithPrices
        }

        mockPool.query
          .mockResolvedValueOnce({
            rows: [{ order_number: 'ORD-20241201-0001' }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              order_number: 'ORD-20241201-0001',
              customer_name: 'John Doe',
              customer_email: 'john@example.com',
              customer_phone: '+1234567890',
              delivery_type: 'delivery',
              delivery_address_text: '123 Main St, City, State 12345',
              special_instructions: 'Ring doorbell twice',
              subtotal: 40.00, // 2 * 15.00 + 1 * 10.00
              total_amount: 40.00,
              payment_status: 'pending',
              status: 'pending'
            }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [
              { id: 1, product_id: 1, quantity: 2, price: 15.00 },
              { id: 2, product_id: 2, quantity: 1, price: 10.00 }
            ],
            rowCount: 2
          })

        const response = await request(app)
          .post('/api/orders')
          .send(orderDataWithPrices)
          .expect(201)

        expect(response.body.order.subtotal).toBe(40.00)
        expect(response.body.order.totalAmount).toBe(40.00)
      })

      test('stores order items correctly', async () => {
        mockPool.query
          .mockResolvedValueOnce({
            rows: [{ order_number: 'ORD-20241201-0001' }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              order_number: 'ORD-20241201-0001',
              customer_name: 'John Doe',
              customer_email: 'john@example.com',
              customer_phone: '+1234567890',
              delivery_type: 'delivery',
              delivery_address_text: '123 Main St, City, State 12345',
              special_instructions: 'Ring doorbell twice',
              subtotal: 34.97,
              total_amount: 34.97,
              payment_status: 'pending',
              status: 'pending'
            }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [
              { id: 1, product_id: 1, quantity: 2, price: 12.99 },
              { id: 2, product_id: 2, quantity: 1, price: 8.99 }
            ],
            rowCount: 2
          })

        await request(app)
          .post('/api/orders')
          .send(validOrderData)
          .expect(201)

        // Verify order items were inserted
        const orderItemsCall = mockPool.query.mock.calls.find(call => 
          call[0].includes('INSERT INTO order_items')
        )
        expect(orderItemsCall).toBeDefined()
        
        // Verify items were inserted with correct data
        const itemsParams = orderItemsCall[1]
        expect(itemsParams).toContain(1) // order_id
        expect(itemsParams).toContain(1) // product_id
        expect(itemsParams).toContain(2) // quantity
        expect(itemsParams).toContain(12.99) // price
      })
    })

    describe('Stripe Integration', () => {
      test('creates payment intent for card payments', async () => {
        mockPool.query
          .mockResolvedValueOnce({
            rows: [{ order_number: 'ORD-20241201-0001' }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              order_number: 'ORD-20241201-0001',
              customer_name: 'John Doe',
              customer_email: 'john@example.com',
              customer_phone: '+1234567890',
              delivery_type: 'delivery',
              delivery_address_text: '123 Main St, City, State 12345',
              special_instructions: 'Ring doorbell twice',
              subtotal: 34.97,
              total_amount: 34.97,
              payment_status: 'pending',
              status: 'pending'
            }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [
              { id: 1, product_id: 1, quantity: 2, price: 12.99 },
              { id: 2, product_id: 2, quantity: 1, price: 8.99 }
            ],
            rowCount: 2
          })

        const response = await request(app)
          .post('/api/orders')
          .send(validOrderData)
          .expect(201)

        expect(response.body.paymentIntent).toBeDefined()
        expect(response.body.paymentIntent.id).toBe('pi_test_123')
        expect(response.body.paymentIntent.client_secret).toBe('pi_test_secret_123')
      })

      test('handles Stripe errors gracefully', async () => {
        // Mock Stripe to throw error
        const { default: Stripe } = require('stripe')
        Stripe.mockImplementation(() => ({
          paymentIntents: {
            create: jest.fn(() => Promise.reject(new Error('Stripe API error'))),
          },
        }))

        mockPool.query
          .mockResolvedValueOnce({
            rows: [{ order_number: 'ORD-20241201-0001' }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              order_number: 'ORD-20241201-0001',
              customer_name: 'John Doe',
              customer_email: 'john@example.com',
              customer_phone: '+1234567890',
              delivery_type: 'delivery',
              delivery_address_text: '123 Main St, City, State 12345',
              special_instructions: 'Ring doorbell twice',
              subtotal: 34.97,
              total_amount: 34.97,
              payment_status: 'pending',
              status: 'pending'
            }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [
              { id: 1, product_id: 1, quantity: 2, price: 12.99 },
              { id: 2, product_id: 2, quantity: 1, price: 8.99 }
            ],
            rowCount: 2
          })

        const response = await request(app)
          .post('/api/orders')
          .send(validOrderData)
          .expect(500)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('Failed to create payment intent')
      })

      test('bypasses Stripe in development mode for non-card payments', async () => {
        process.env.NODE_ENV = 'development'
        
        const cashOrderData = {
          ...validOrderData,
          paymentMethod: 'cash'
        }

        mockPool.query
          .mockResolvedValueOnce({
            rows: [{ order_number: 'ORD-20241201-0001' }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              order_number: 'ORD-20241201-0001',
              customer_name: 'John Doe',
              customer_email: 'john@example.com',
              customer_phone: '+1234567890',
              delivery_type: 'delivery',
              delivery_address_text: '123 Main St, City, State 12345',
              special_instructions: 'Ring doorbell twice',
              subtotal: 34.97,
              total_amount: 34.97,
              payment_status: 'pending',
              status: 'pending'
            }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [
              { id: 1, product_id: 1, quantity: 2, price: 12.99 },
              { id: 2, product_id: 2, quantity: 1, price: 8.99 }
            ],
            rowCount: 2
          })

        const response = await request(app)
          .post('/api/orders')
          .send(cashOrderData)
          .expect(201)

        expect(response.body.success).toBe(true)
        expect(response.body.order.paymentStatus).toBe('pending')
        // Should not have payment intent in development mode for cash
        expect(response.body.paymentIntent).toBeUndefined()
      })
    })

    describe('Database Error Handling', () => {
      test('handles order creation database errors', async () => {
        mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'))

        const response = await request(app)
          .post('/api/orders')
          .send(validOrderData)
          .expect(500)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('Failed to create order')
      })

      test('handles order items insertion errors', async () => {
        mockPool.query
          .mockResolvedValueOnce({
            rows: [{ order_number: 'ORD-20241201-0001' }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              order_number: 'ORD-20241201-0001',
              customer_name: 'John Doe',
              customer_email: 'john@example.com',
              customer_phone: '+1234567890',
              delivery_type: 'delivery',
              delivery_address_text: '123 Main St, City, State 12345',
              special_instructions: 'Ring doorbell twice',
              subtotal: 34.97,
              total_amount: 34.97,
              payment_status: 'pending',
              status: 'pending'
            }],
            rowCount: 1
          })
          .mockRejectedValueOnce(new Error('Failed to insert order items'))

        const response = await request(app)
          .post('/api/orders')
          .send(validOrderData)
          .expect(500)

        expect(response.body.success).toBe(false)
        expect(response.body.error).toContain('Failed to create order')
      })

      test('rolls back transaction on error', async () => {
        // Mock database to fail on order items insertion
        mockPool.query
          .mockResolvedValueOnce({
            rows: [{ order_number: 'ORD-20241201-0001' }],
            rowCount: 1
          })
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              order_number: 'ORD-20241201-0001',
              customer_name: 'John Doe',
              customer_email: 'john@example.com',
              customer_phone: '+1234567890',
              delivery_type: 'delivery',
              delivery_address_text: '123 Main St, City, State 12345',
              special_instructions: 'Ring doorbell twice',
              subtotal: 34.97,
              total_amount: 34.97,
              payment_status: 'pending',
              status: 'pending'
            }],
            rowCount: 1
          })
          .mockRejectedValueOnce(new Error('Failed to insert order items'))

        const response = await request(app)
          .post('/api/orders')
          .send(validOrderData)
          .expect(500)

        expect(response.body.success).toBe(false)
        
        // Verify that the order was not committed to database
        const insertCalls = mockPool.query.mock.calls.filter(call => 
          call[0].includes('INSERT INTO')
        )
        expect(insertCalls.length).toBeLessThan(3) // Should not have completed all inserts
      })
    })
  })

  describe('GET /api/orders', () => {
    const validAuthToken = jwt.sign(
      { id: 1, email: 'john@example.com' },
      'test-jwt-secret',
      { expiresIn: '1h' }
    )

    test('returns orders for authenticated user', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            order_number: 'ORD-20241201-0001',
            customer_name: 'John Doe',
            customer_email: 'john@example.com',
            customer_phone: '+1234567890',
            delivery_type: 'delivery',
            delivery_address_text: '123 Main St, City, State 12345',
            special_instructions: 'Ring doorbell twice',
            subtotal: 34.97,
            total_amount: 34.97,
            payment_status: 'pending',
            status: 'pending',
            created_at: new Date(),
            updated_at: new Date()
          }
        ],
        rowCount: 1
      })

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.orders).toBeDefined()
      expect(response.body.orders).toHaveLength(1)
      expect(response.body.orders[0].orderNumber).toBe('ORD-20241201-0001')
      expect(response.body.orders[0].customerName).toBe('John Doe')
    })

    test('returns error without authentication', async () => {
      const response = await request(app)
        .get('/api/orders')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('No token provided')
    })

    test('handles database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'))

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Failed to fetch orders')
    })
  })

  describe('GET /api/orders/:id', () => {
    const validAuthToken = jwt.sign(
      { id: 1, email: 'john@example.com' },
      'test-jwt-secret',
      { expiresIn: '1h' }
    )

    test('returns specific order with items', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            order_number: 'ORD-20241201-0001',
            customer_name: 'John Doe',
            customer_email: 'john@example.com',
            customer_phone: '+1234567890',
            delivery_type: 'delivery',
            delivery_address_text: '123 Main St, City, State 12345',
            special_instructions: 'Ring doorbell twice',
            subtotal: 34.97,
            total_amount: 34.97,
            payment_status: 'pending',
            status: 'pending',
            created_at: new Date(),
            updated_at: new Date()
          }],
          rowCount: 1
        })
        .mockResolvedValueOnce({
          rows: [
            { id: 1, product_id: 1, quantity: 2, price: 12.99, name: 'Margherita Pizza' },
            { id: 2, product_id: 2, quantity: 1, price: 8.99, name: 'Caesar Salad' }
          ],
          rowCount: 2
        })

      const response = await request(app)
        .get('/api/orders/1')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.order).toBeDefined()
      expect(response.body.order.items).toBeDefined()
      expect(response.body.order.items).toHaveLength(2)
      expect(response.body.order.items[0].name).toBe('Margherita Pizza')
    })

    test('returns error for non-existent order', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      })

      const response = await request(app)
        .get('/api/orders/999')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Order not found')
    })

    test('returns error without authentication', async () => {
      const response = await request(app)
        .get('/api/orders/1')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('No token provided')
    })
  })
})
